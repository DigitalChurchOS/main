import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// 1. CURRICULUM MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function createCourse(
  tenantId: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    coverImageUrl?: string;
    status?: string;
  }
): Promise<any> {
  return await prisma.lmsCourse.create({
    data: {
      tenantId,
      title: data.title,
      slug: data.slug.toLowerCase().trim(),
      description: data.description || null,
      coverImageUrl: data.coverImageUrl || null,
      status: data.status || 'draft',
    },
  });
}

export async function createModule(
  tenantId: string,
  courseId: string,
  data: {
    title: string;
    sequenceOrder?: number;
  }
): Promise<any> {
  const course = await prisma.lmsCourse.findFirst({
    where: { id: courseId, tenantId },
  });
  if (!course) {
    throw new Error('Course not found');
  }

  return await prisma.lmsModule.create({
    data: {
      tenantId,
      courseId,
      title: data.title,
      sequenceOrder: data.sequenceOrder || 0,
    },
  });
}

export async function createLesson(
  tenantId: string,
  moduleId: string,
  data: {
    title: string;
    content?: string;
    videoUrl?: string;
    audioUrl?: string;
    pdfUrl?: string;
    sequenceOrder?: number;
  }
): Promise<any> {
  const mod = await prisma.lmsModule.findFirst({
    where: { id: moduleId, tenantId },
  });
  if (!mod) {
    throw new Error('Module not found');
  }

  return await prisma.lmsLesson.create({
    data: {
      tenantId,
      moduleId,
      title: data.title,
      content: data.content || null,
      videoUrl: data.videoUrl || null,
      audioUrl: data.audioUrl || null,
      pdfUrl: data.pdfUrl || null,
      sequenceOrder: data.sequenceOrder || 0,
    },
  });
}

export async function createQuiz(
  tenantId: string,
  lessonId: string,
  data: {
    question: string;
    options: string[];
    correctAnswer: string;
  }
): Promise<any> {
  const lesson = await prisma.lmsLesson.findFirst({
    where: { id: lessonId, tenantId },
  });
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  return await prisma.lmsQuiz.create({
    data: {
      tenantId,
      lessonId,
      question: data.question,
      optionsJson: JSON.stringify(data.options),
      correctAnswer: data.correctAnswer,
    },
  });
}

export async function createAssignment(
  tenantId: string,
  lessonId: string,
  data: {
    title: string;
    instructions?: string;
  }
): Promise<any> {
  const lesson = await prisma.lmsLesson.findFirst({
    where: { id: lessonId, tenantId },
  });
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  return await prisma.lmsAssignment.create({
    data: {
      tenantId,
      lessonId,
      title: data.title,
      instructions: data.instructions || null,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. ENROLLMENT & STUDENT JOURNEY
// ─────────────────────────────────────────────────────────────

export async function enrollStudent(tenantId: string, courseId: string, memberId: string): Promise<any> {
  const course = await prisma.lmsCourse.findFirst({
    where: { id: courseId, tenantId },
    include: { modules: { include: { lessons: true } } },
  });
  if (!course) {
    throw new Error('Course not found');
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const enrollment = await prisma.lmsEnrollment.upsert({
    where: {
      courseId_memberId: { courseId, memberId },
    },
    update: {
      status: 'enrolled',
    },
    create: {
      tenantId,
      courseId,
      memberId,
      status: 'enrolled',
      progressPercent: 0.0,
    },
  });

  // Seed Lesson Progress records for all lessons in this course
  const lessons = course.modules.flatMap((m) => m.lessons);
  for (const lesson of lessons) {
    await prisma.lmsLessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id },
      },
      update: {},
      create: {
        tenantId,
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        isCompleted: false,
      },
    });
  }

  return enrollment;
}

export async function getStudentDashboard(tenantId: string, memberId: string): Promise<any[]> {
  return await prisma.lmsEnrollment.findMany({
    where: { memberId, tenantId },
    include: {
      course: {
        select: { id: true, title: true, slug: true, coverImageUrl: true },
      },
    },
  });
}

export async function checkGraduation(tenantId: string, enrollmentId: string): Promise<boolean> {
  const enrollment = await prisma.lmsEnrollment.findFirst({
    where: { id: enrollmentId, tenantId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: { quizzes: true, assignments: true },
              },
            },
          },
        },
      },
      lessonProgress: true,
      quizAnswers: true,
      assignmentSubmission: true,
    },
  });
  if (!enrollment) {
    throw new Error('Enrollment record not found');
  }

  const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
  const totalLessons = lessons.length;

  if (totalLessons === 0) {
    return false;
  }

  // 1. All lessons must be completed
  const completedLessonsCount = enrollment.lessonProgress.filter((lp) => lp.isCompleted).length;
  if (completedLessonsCount < totalLessons) {
    return false;
  }

  // 2. All quizzes must be answered correctly
  const quizzes = lessons.flatMap((l) => l.quizzes);
  for (const quiz of quizzes) {
    const ans = enrollment.quizAnswers.find((qa) => qa.quizId === quiz.id);
    if (!ans || !ans.isCorrect) {
      return false;
    }
  }

  // 3. All assignments must be graded as "pass"
  const assignments = lessons.flatMap((l) => l.assignments);
  for (const assignment of assignments) {
    const sub = enrollment.assignmentSubmission.find((as) => as.assignmentId === assignment.id);
    if (!sub || sub.status !== 'graded' || sub.grade !== 'pass') {
      return false;
    }
  }

  // If all criteria passed, graduate student!
  await prisma.lmsEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      certificateUrl: `https://cdn.church.org/certificates/${enrollment.id}.pdf`,
    },
  });

  // If this is Foundation School, update NewBelieverProfile milestone
  if (enrollment.course.slug === 'foundation-school') {
    const believerProfile = await prisma.newBelieverProfile.findFirst({
      where: { memberId: enrollment.memberId, tenantId },
    });
    if (believerProfile) {
      await prisma.newBelieverProfile.update({
        where: { id: believerProfile.id },
        data: {
          finishedClass: true,
          lmsCompletedAt: new Date(),
        },
      });
    }
  }

  return true;
}

export async function completeLesson(tenantId: string, enrollmentId: string, lessonId: string): Promise<any> {
  const enrollment = await prisma.lmsEnrollment.findFirst({
    where: { id: enrollmentId, tenantId },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: true },
          },
        },
      },
    },
  });
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  await prisma.lmsLessonProgress.upsert({
    where: {
      enrollmentId_lessonId: { enrollmentId, lessonId },
    },
    update: {
      isCompleted: true,
      completedAt: new Date(),
    },
    create: {
      tenantId,
      enrollmentId,
      lessonId,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  // Recalculate progress percent
  const totalLessons = enrollment.course.modules.flatMap((m) => m.lessons).length;
  const completedProgress = await prisma.lmsLessonProgress.count({
    where: { enrollmentId, isCompleted: true },
  });

  const progressPercent = totalLessons > 0 ? parseFloat(((completedProgress / totalLessons) * 100).toFixed(1)) : 0.0;

  const updated = await prisma.lmsEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent,
      status: enrollment.status === 'enrolled' ? 'active' : enrollment.status,
    },
  });

  // Check if graduation can be triggered
  await checkGraduation(tenantId, enrollmentId);

  return updated;
}

export async function submitQuizAnswer(
  tenantId: string,
  enrollmentId: string,
  quizId: string,
  selectedAnswer: string
): Promise<{ isCorrect: boolean }> {
  const enrollment = await prisma.lmsEnrollment.findFirst({
    where: { id: enrollmentId, tenantId },
  });
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const quiz = await prisma.lmsQuiz.findUnique({
    where: { id: quizId },
  });
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const isCorrect = quiz.correctAnswer.toLowerCase().trim() === selectedAnswer.toLowerCase().trim();

  await prisma.lmsQuizAnswer.upsert({
    where: {
      enrollmentId_quizId: { enrollmentId, quizId },
    },
    update: {
      selectedAnswer,
      isCorrect,
    },
    create: {
      tenantId,
      enrollmentId,
      quizId,
      selectedAnswer,
      isCorrect,
    },
  });

  // If correct, automatically mark the lesson complete
  if (isCorrect) {
    await completeLesson(tenantId, enrollmentId, quiz.lessonId);
  }

  return { isCorrect };
}

export async function submitAssignment(
  tenantId: string,
  enrollmentId: string,
  assignmentId: string,
  data: {
    answerText?: string;
    fileUrl?: string;
  }
): Promise<any> {
  const enrollment = await prisma.lmsEnrollment.findFirst({
    where: { id: enrollmentId, tenantId },
  });
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const assignment = await prisma.lmsAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  return await prisma.lmsAssignmentSubmission.upsert({
    where: {
      enrollmentId_assignmentId: { enrollmentId, assignmentId },
    },
    update: {
      answerText: data.answerText || null,
      fileUrl: data.fileUrl || null,
      status: 'pending',
      grade: null,
      feedback: null,
    },
    create: {
      tenantId,
      enrollmentId,
      assignmentId,
      answerText: data.answerText || null,
      fileUrl: data.fileUrl || null,
      status: 'pending',
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 3. INSTRUCTOR GRADING & REPORTS
// ─────────────────────────────────────────────────────────────

export async function listPendingSubmissions(tenantId: string): Promise<any[]> {
  return await prisma.lmsAssignmentSubmission.findMany({
    where: {
      status: 'pending',
      tenantId,
    },
    include: {
      enrollment: {
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true },
          },
          course: {
            select: { id: true, title: true },
          },
        },
      },
      assignment: {
        select: { id: true, title: true },
      },
    },
  });
}

export async function gradeSubmission(
  tenantId: string,
  submissionId: string,
  instructorId: string,
  grade: 'pass' | 'fail',
  feedback?: string
): Promise<any> {
  const submission = await prisma.lmsAssignmentSubmission.findFirst({
    where: { id: submissionId, tenantId },
  });
  if (!submission) {
    throw new Error('Assignment submission not found');
  }

  const instructor = await prisma.member.findFirst({
    where: { id: instructorId, tenantId },
  });
  if (!instructor) {
    throw new Error('Instructor member profile not found');
  }

  const updated = await prisma.lmsAssignmentSubmission.update({
    where: { id: submission.id },
    data: {
      status: 'graded',
      grade,
      feedback: feedback || null,
      gradedById: instructorId,
      gradedAt: new Date(),
    },
  });

  // Check if graduation can be triggered
  await checkGraduation(tenantId, submission.enrollmentId);

  return updated;
}

export async function getCourseCompletionReport(
  tenantId: string,
  courseId: string
): Promise<{
  totalEnrolled: number;
  completedCount: number;
  activeCount: number;
  averageProgress: number;
}> {
  const enrollments = await prisma.lmsEnrollment.findMany({
    where: { courseId, tenantId },
  });

  const totalEnrolled = enrollments.length;
  const completedCount = enrollments.filter((e) => e.status === 'completed').length;
  const activeCount = enrollments.filter((e) => e.status === 'active' || e.status === 'enrolled').length;

  const totalProgress = enrollments.reduce((sum, e) => sum + e.progressPercent, 0);
  const averageProgress = totalEnrolled > 0 ? parseFloat((totalProgress / totalEnrolled).toFixed(1)) : 0.0;

  return {
    totalEnrolled,
    completedCount,
    activeCount,
    averageProgress,
  };
}

import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 36: LMS Academy Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let adminMemberId: string;

  let studentToken: string;
  let studentUserId: string;
  let studentMemberId: string;

  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let quizId: string;
  let assignmentId: string;
  let enrollmentId: string;
  let submissionId: string;

  beforeAll(async () => {
    // ── Clean up related tables in correct order ──────────────────────────────
    await prisma.lmsAssignmentSubmission.deleteMany({});
    await prisma.lmsQuizAnswer.deleteMany({});
    await prisma.lmsLessonProgress.deleteMany({});
    await prisma.lmsEnrollment.deleteMany({});
    await prisma.lmsAssignment.deleteMany({});
    await prisma.lmsQuiz.deleteMany({});
    await prisma.lmsLesson.deleteMany({});
    await prisma.lmsModule.deleteMany({});
    await prisma.lmsCourse.deleteMany({});
    
    await prisma.newBelieverReminder.deleteMany({});
    await prisma.newBelieverProfile.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Harvest Church', subdomain: 'harvest-church', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Roles & Permissions ───────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({ data: { tenantId, name: 'Member', isCustom: false } });
    const memberPerms = permissions.filter((p) => p.name !== 'tenant.settings');
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // ── Admin User (Instructor) ─────────────────────────
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@harvest.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const adminMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Barnabas',
        lastName: 'Leader',
        email: 'pastor@harvest.com',
        membershipStatus: 'leader',
      },
    });
    adminMemberId = adminMember.id;

    // ── Student User ─────────────────────────
    const studentUser = await prisma.user.create({
      data: { tenantId, email: 'student@harvest.com', passwordHash: passHash },
    });
    studentUserId = studentUser.id;
    await prisma.userRole.create({ data: { userId: studentUser.id, roleId: memberRole.id } });
    studentToken = jwt.sign({ userId: studentUser.id, tenantId, email: studentUser.email }, JWT_SECRET);

    const studentMember = await prisma.member.create({
      data: {
        tenantId,
        userId: studentUser.id,
        firstName: 'Timothy',
        lastName: 'Student',
        email: 'student@harvest.com',
        membershipStatus: 'member',
      },
    });
    studentMemberId = studentMember.id;

    // ── New Believer Profile (for testing Foundation School completion milestone integration) ──
    await prisma.newBelieverProfile.create({
      data: {
        tenantId,
        memberId: studentMemberId,
        source: 'manual',
        finishedClass: false,
      },
    });
  });

  describe('Curriculum Creator API (Admin Only)', () => {
    it('should create a new course', async () => {
      const res = await request(app)
        .post('/api/lms/courses')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Foundation School',
          slug: 'foundation-school',
          description: 'Basic discipleship class for new believers',
          coverImageUrl: 'https://cdn.church.org/cover.png',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Foundation School');
      expect(res.body.data.slug).toBe('foundation-school');
      expect(res.body.data.status).toBe('published');
      courseId = res.body.data.id;
    });

    it('should fail if required fields are missing when creating a course', async () => {
      const res = await request(app)
        .post('/api/lms/courses')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'No title or slug',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should create a module inside the course', async () => {
      const res = await request(app)
        .post(`/api/lms/courses/${courseId}/modules`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Module 1: The New Life',
          sequenceOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Module 1: The New Life');
      expect(res.body.data.courseId).toBe(courseId);
      moduleId = res.body.data.id;
    });

    it('should create a lesson inside the module', async () => {
      const res = await request(app)
        .post(`/api/lms/modules/${moduleId}/lessons`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Lesson 1.1: Introduction to Salvation',
          content: 'This lesson teaches about grace and salvation.',
          videoUrl: 'https://youtube.com/watch?v=salvation',
          sequenceOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Lesson 1.1: Introduction to Salvation');
      expect(res.body.data.moduleId).toBe(moduleId);
      lessonId = res.body.data.id;
    });

    it('should create a quiz inside the lesson', async () => {
      const res = await request(app)
        .post(`/api/lms/lessons/${lessonId}/quizzes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: 'Is salvation earned by good works?',
          options: ['Yes', 'No'],
          correctAnswer: 'No',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.question).toBe('Is salvation earned by good works?');
      expect(res.body.data.correctAnswer).toBe('No');
      quizId = res.body.data.id;
    });

    it('should create an assignment inside the lesson', async () => {
      const res = await request(app)
        .post(`/api/lms/lessons/${lessonId}/assignments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Assignment 1: Reflection on Salvation',
          instructions: 'Write a 200 word summary of what salvation means to you.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Assignment 1: Reflection on Salvation');
      assignmentId = res.body.data.id;
    });
  });

  describe('Student Journey & Progress API', () => {
    it('should self-enroll the student in the course', async () => {
      const res = await request(app)
        .post(`/api/lms/courses/${courseId}/enroll`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.courseId).toBe(courseId);
      expect(res.body.data.memberId).toBe(studentMemberId);
      expect(res.body.data.status).toBe('enrolled');
      expect(res.body.data.progressPercent).toBe(0);
      enrollmentId = res.body.data.id;

      // Verify that progress records are created
      const progressCount = await prisma.lmsLessonProgress.count({
        where: { enrollmentId },
      });
      expect(progressCount).toBe(1);
    });

    it('should retrieve enrolled courses on the student dashboard', async () => {
      const res = await request(app)
        .get('/api/lms/dashboard')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(enrollmentId);
      expect(res.body.data[0].course.title).toBe('Foundation School');
    });

    it('should allow student to mark a lesson completed manually', async () => {
      const res = await request(app)
        .post(`/api/lms/lessons/${lessonId}/complete`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ enrollmentId });

      expect(res.status).toBe(200);
      expect(res.body.data.progressPercent).toBe(100);
      expect(res.body.data.status).toBe('active'); // active when progress starts
    });

    it('should submit quiz answer and grade it', async () => {
      // First try wrong answer
      let res = await request(app)
        .post(`/api/lms/quizzes/${quizId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ enrollmentId, selectedAnswer: 'Yes' });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(false);

      // Now try correct answer
      res = await request(app)
        .post(`/api/lms/quizzes/${quizId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ enrollmentId, selectedAnswer: 'No' });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
    });

    it('should allow student to submit an assignment', async () => {
      const res = await request(app)
        .post(`/api/lms/assignments/${assignmentId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          enrollmentId,
          answerText: 'Salvation means freedom and direct fellowship with God.',
          fileUrl: 'https://cdn.church.org/homework/Timothy_Reflection.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.answerText).toContain('freedom');
      submissionId = res.body.data.id;
    });
  });

  describe('Instructor Dashboard & Reporting API', () => {
    it('should list pending submissions for grading', async () => {
      const res = await request(app)
        .get('/api/lms/submissions/pending')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(submissionId);
      expect(res.body.data[0].enrollment.member.firstName).toBe('Timothy');
    });

    it('should grade a submission and trigger graduation when all modules are completed', async () => {
      const res = await request(app)
        .post(`/api/lms/submissions/${submissionId}/grade`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          grade: 'pass',
          feedback: 'Excellent reflection, Timothy!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('graded');
      expect(res.body.data.grade).toBe('pass');

      // Since the student has completed the lesson, answered the quiz correctly, and passed the assignment,
      // they should graduate! Let's verify the enrollment table details:
      const enrollment = await prisma.lmsEnrollment.findUnique({
        where: { id: enrollmentId },
      });
      expect(enrollment!.status).toBe('completed');
      expect(enrollment!.completedAt).toBeDefined();
      expect(enrollment!.certificateUrl).toBe(`https://cdn.church.org/certificates/${enrollmentId}.pdf`);

      // And verify that NewBelieverProfile is updated because course slug was 'foundation-school'
      const believerProfile = await prisma.newBelieverProfile.findFirst({
        where: { memberId: studentMemberId },
      });
      expect(believerProfile!.finishedClass).toBe(true);
      expect(believerProfile!.lmsCompletedAt).toBeDefined();
    });

    it('should retrieve a course completion report with analytics', async () => {
      const res = await request(app)
        .get(`/api/lms/courses/${courseId}/report`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalEnrolled).toBe(1);
      expect(res.body.data.completedCount).toBe(1);
      expect(res.body.data.activeCount).toBe(0);
      expect(res.body.data.averageProgress).toBe(100);
    });
  });
});

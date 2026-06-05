import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  createCourse,
  createModule,
  createLesson,
  createQuiz,
  createAssignment,
  enrollStudent,
  getStudentDashboard,
  completeLesson,
  submitQuizAnswer,
  submitAssignment,
  listPendingSubmissions,
  gradeSubmission,
  getCourseCompletionReport,
} from '../services/lms';

const router = Router();

// Apply authentication to all LMS routes
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// CURRICULUM CREATOR (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────

router.post('/courses', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, slug, description, coverImageUrl, status } = req.body;
    if (!title || !slug) {
      res.status(400).json({ error: 'title and slug are required' });
      return;
    }

    const course = await createCourse(req.tenantId!, { title, slug, description, coverImageUrl, status });
    res.status(201).json({ data: course });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/courses/:courseId/modules', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, sequenceOrder } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const mod = await createModule(req.tenantId!, req.params.courseId as string, { title, sequenceOrder });
    res.status(201).json({ data: mod });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/modules/:moduleId/lessons', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, videoUrl, audioUrl, pdfUrl, sequenceOrder } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const lesson = await createLesson(req.tenantId!, req.params.moduleId as string, {
      title,
      content,
      videoUrl,
      audioUrl,
      pdfUrl,
      sequenceOrder,
    });
    res.status(201).json({ data: lesson });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/lessons/:lessonId/quizzes', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, options, correctAnswer } = req.body;
    if (!question || !options || !correctAnswer) {
      res.status(400).json({ error: 'question, options, and correctAnswer are required' });
      return;
    }

    const quiz = await createQuiz(req.tenantId!, req.params.lessonId as string, { question, options, correctAnswer });
    res.status(201).json({ data: quiz });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/lessons/:lessonId/assignments', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, instructions } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const assignment = await createAssignment(req.tenantId!, req.params.lessonId as string, { title, instructions });
    res.status(201).json({ data: assignment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// STUDENT PORTAL (MEMBERS)
// ─────────────────────────────────────────────────────────────

router.post('/courses/:courseId/enroll', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const enrollment = await enrollStudent(req.tenantId!, req.params.courseId as string, member.id);
    res.status(201).json({ data: enrollment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/dashboard', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const enrollments = await getStudentDashboard(req.tenantId!, member.id);
    res.json({ data: enrollments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lessons/:lessonId/complete', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) {
      res.status(400).json({ error: 'enrollmentId is required' });
      return;
    }

    const progress = await completeLesson(req.tenantId!, enrollmentId, req.params.lessonId as string);
    res.json({ data: progress });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/quizzes/:quizId/submit', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollmentId, selectedAnswer } = req.body;
    if (!enrollmentId || !selectedAnswer) {
      res.status(400).json({ error: 'enrollmentId and selectedAnswer are required' });
      return;
    }

    const result = await submitQuizAnswer(req.tenantId!, enrollmentId, req.params.quizId as string, selectedAnswer);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/assignments/:assignmentId/submit', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollmentId, answerText, fileUrl } = req.body;
    if (!enrollmentId) {
      res.status(400).json({ error: 'enrollmentId is required' });
      return;
    }

    const sub = await submitAssignment(req.tenantId!, enrollmentId, req.params.assignmentId as string, {
      answerText,
      fileUrl,
    });
    res.status(201).json({ data: sub });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR DASHBOARD
// ─────────────────────────────────────────────────────────────

router.get('/submissions/pending', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const subs = await listPendingSubmissions(req.tenantId!);
    res.json({ data: subs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:id/grade', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { grade, feedback } = req.body;
    if (!grade) {
      res.status(400).json({ error: 'grade is required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const graded = await gradeSubmission(req.tenantId!, req.params.id as string, member.id, grade, feedback);
    res.json({ data: graded });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/courses/:courseId/report', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getCourseCompletionReport(req.tenantId!, req.params.courseId as string);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

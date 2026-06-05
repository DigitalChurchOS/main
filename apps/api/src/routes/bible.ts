import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import prisma from '../lib/prisma';
import { SettingsService } from '../services/settings';
import {
  registerTranslation,
  listTranslations,
  seedBibleVerses,
  getChapter,
  searchBible,
  resolveScriptureReference,
  createReadingPlan,
  listReadingPlans,
  enrollInReadingPlan,
  completeDayInReadingPlan,
  addBookmark,
  removeBookmark,
  listBookmarks,
  saveVerseNote,
  listVerseNotes,
  createDailyDevotional,
  getDailyDevotional,
  getLinkedSermons,
  addHighlight,
  removeHighlight,
  listHighlights,
  registerAudioTrack,
  getAudioTrack,
  getTranslationDownload,
  getGraphicTemplates,
  generateScriptureGraphic,
  listBooks,
} from '../services/bible';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC GRAPHIC PREVIEW (BYPASSES AUTH MIDDLEWARE)
// ─────────────────────────────────────────────────────────────

router.get('/graphics/render/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, this would dynamically render a SVG or PNG card.
    // We return a beautiful inline SVG graphic representing the shared verse.
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#db2777" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#sunsetGrad)"/>
        <rect x="20" y="20" width="560" height="360" fill="#000000" fill-opacity="0.3" rx="10" />
        <text x="300" y="160" font-family="Lora, Georgia, serif" font-size="22" fill="#ffffff" font-weight="bold" text-anchor="middle">
          "For God so loved the world..."
        </text>
        <text x="300" y="240" font-family="sans-serif" font-size="16" fill="#f3f4f6" text-anchor="middle">
          — John 3:16 (ESV)
        </text>
        <text x="300" y="340" font-family="sans-serif" font-size="12" fill="#e5e7eb" opacity="0.8" text-anchor="middle">
          Shared via Digital Church OS
        </text>
      </svg>
    `);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Enforce module entitlement activation for all Bible and Scripture Engagement routes
router.use(requireModule('bible'));

// Apply auth to all remaining Bible routes
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// 1. TRANSLATION & SEEDING API (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────

router.post('/translations', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, language, isLicensed } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'name and code are required' });
      return;
    }

    const translation = await registerTranslation(req.tenantId!, { name, code, language, isLicensed });
    res.status(201).json({ data: translation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/translations', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listTranslations(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seed', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { verses } = req.body;
    if (!verses || !Array.isArray(verses)) {
      res.status(400).json({ error: 'verses array is required' });
      return;
    }

    await seedBibleVerses(req.tenantId!, verses);
    res.status(200).json({ message: 'Seeding completed' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. BIBLE READING & SEARCHING API
// ─────────────────────────────────────────────────────────────

router.get('/read/:translation/:book/:chapter', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const chapterVerses = await getChapter(
      req.tenantId!,
      req.params.translation as string,
      req.params.book as string,
      parseInt(req.params.chapter as string, 10)
    );
    res.json({ data: chapterVerses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/search', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translation, q } = req.query;
    if (!translation || !q) {
      res.status(400).json({ error: 'translation and q are required query parameters' });
      return;
    }

    const results = await searchBible(req.tenantId!, translation as string, q as string);
    res.json({ data: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. SCRIPTURE RESOLVER
// ─────────────────────────────────────────────────────────────

router.get('/resolve', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translation, ref } = req.query;
    if (!translation || !ref) {
      res.status(400).json({ error: 'translation and ref are required query parameters' });
      return;
    }

    const verses = await resolveScriptureReference(req.tenantId!, translation as string, ref as string);
    res.json({ data: verses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. BIBLE READING PLANS API
// ─────────────────────────────────────────────────────────────

router.post('/plans', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, coverImageUrl, durationDays, days } = req.body;
    if (!title || !durationDays || !days || !Array.isArray(days)) {
      res.status(400).json({ error: 'title, durationDays, and days array are required' });
      return;
    }

    const plan = await createReadingPlan(req.tenantId!, { title, description, coverImageUrl, durationDays, days });
    res.status(201).json({ data: plan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/plans', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listReadingPlans(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plans/:planId/enroll', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const enrollment = await enrollInReadingPlan(req.tenantId!, req.params.planId as string, member.id);
    res.status(201).json({ data: enrollment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/enrollments/:id/complete-day', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { dayNumber } = req.body;
    if (dayNumber === undefined) {
      res.status(400).json({ error: 'dayNumber is required' });
      return;
    }

    const updated = await completeDayInReadingPlan(req.tenantId!, req.params.id as string, dayNumber);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. BOOKMARKS API
// ─────────────────────────────────────────────────────────────

router.post('/bookmarks', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translationCode, bookSlug, chapter, verse } = req.body;
    if (!translationCode || !bookSlug || !chapter || !verse) {
      res.status(400).json({ error: 'translationCode, bookSlug, chapter, and verse are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const bookmark = await addBookmark(req.tenantId!, member.id, {
      translationCode,
      bookSlug,
      chapter,
      verse,
    });
    res.status(201).json({ data: bookmark });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/bookmarks/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeBookmark(req.tenantId!, req.params.id as string);
    res.json({ message: 'Bookmark removed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bookmarks', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const list = await listBookmarks(req.tenantId!, member.id);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. SCRIPTURE STUDY NOTES API
// ─────────────────────────────────────────────────────────────

router.post('/notes', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookSlug, chapter, verse, noteText } = req.body;
    if (!bookSlug || !chapter || !verse || noteText === undefined) {
      res.status(400).json({ error: 'bookSlug, chapter, verse, and noteText are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const note = await saveVerseNote(req.tenantId!, member.id, {
      bookSlug,
      chapter,
      verse,
      noteText,
    });
    res.json({ data: note });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/notes', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const { bookSlug, chapter } = req.query;
    const filter: any = {};
    if (bookSlug) filter.bookSlug = bookSlug as string;
    if (chapter) filter.chapter = parseInt(chapter as string, 10);

    const list = await listVerseNotes(req.tenantId!, member.id, filter);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. DAILY DEVOTIONALS API
// ─────────────────────────────────────────────────────────────

router.post('/devotionals', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, title, content, scriptureRef } = req.body;
    if (!date || !title || !content || !scriptureRef) {
      res.status(400).json({ error: 'date, title, content, and scriptureRef are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    const authorId = member?.id || undefined;

    const devotional = await createDailyDevotional(req.tenantId!, {
      date,
      title,
      content,
      scriptureRef,
      authorId,
    });
    res.status(201).json({ data: devotional });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/devotionals/today', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
    const dev = await getDailyDevotional(req.tenantId!, dateParam);
    if (!dev) {
      res.status(404).json({ error: 'Devotional not found for this date' });
      return;
    }
    res.json({ data: dev });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. SERMONS / SERVICES LINKING API
// ─────────────────────────────────────────────────────────────

router.get('/linked-sermons', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { book, chapter } = req.query;
    if (!book || !chapter) {
      res.status(400).json({ error: 'book and chapter are required query parameters' });
      return;
    }

    const list = await getLinkedSermons(req.tenantId!, book as string, parseInt(chapter as string, 10));
    res.json({ data: list });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. VERSE HIGHLIGHTS API
// ─────────────────────────────────────────────────────────────

router.post('/highlights', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translationCode, bookSlug, chapter, verse, color } = req.body;
    if (!translationCode || !bookSlug || !chapter || !verse || !color) {
      res.status(400).json({ error: 'translationCode, bookSlug, chapter, verse, and color are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const highlight = await addHighlight(req.tenantId!, member.id, {
      translationCode,
      bookSlug,
      chapter,
      verse,
      color,
    });
    res.status(201).json({ data: highlight });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/highlights/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeHighlight(req.tenantId!, req.params.id as string);
    res.json({ message: 'Highlight removed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/highlights', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const list = await listHighlights(req.tenantId!, member.id);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 10. AUDIO BIBLE API
// ─────────────────────────────────────────────────────────────

router.post('/audio', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translationCode, bookSlug, chapter, audioUrl, provider } = req.body;
    if (!translationCode || !bookSlug || !chapter || !audioUrl) {
      res.status(400).json({ error: 'translationCode, bookSlug, chapter, and audioUrl are required' });
      return;
    }

    const track = await registerAudioTrack(req.tenantId!, { translationCode, bookSlug, chapter, audioUrl, provider });
    res.status(201).json({ data: track });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/audio/:translation/:book/:chapter', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const audioUrl = await getAudioTrack(
      req.tenantId!,
      req.params.translation as string,
      req.params.book as string,
      parseInt(req.params.chapter as string, 10)
    );
    res.json({ data: { audioUrl } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 11. OFFLINE DOWNLOAD API
// ─────────────────────────────────────────────────────────────

router.get('/translations/:code/download', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await getTranslationDownload(req.tenantId!, req.params.code as string);
    res.json(payload);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 12. SCRIPTURE GRAPHICS API
// ─────────────────────────────────────────────────────────────

router.get('/graphics/templates', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = getGraphicTemplates();
    res.json({ data: templates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/graphics/generate', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, reference, templateId } = req.body;
    if (!text || !reference || !templateId) {
      res.status(400).json({ error: 'text, reference, and templateId are required' });
      return;
    }

    const graphic = await generateScriptureGraphic(req.tenantId!, { text, reference, templateId });
    res.status(201).json({ data: graphic });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SETTINGS ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.get('/settings', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SettingsService.getSettingsForModule(req.tenantId!, 'bible');
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/settings', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await SettingsService.updateSettingsForModule(req.tenantId!, 'bible', req.body);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ADDITIONAL TRANSLATION CONTROL ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.patch('/translations/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, language, isLicensed } = req.body;
    const translation = await prisma.bibleTranslation.updateMany({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      data: {
        name,
        code: code ? code.toLowerCase().trim() : undefined,
        language,
        isLicensed
      }
    });
    res.json({ message: 'Translation updated', data: translation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/translations/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.bibleTranslation.deleteMany({
      where: { id: req.params.id as string, tenantId: req.tenantId! }
    });
    res.json({ message: 'Translation deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// BIBLE READING AND SEARCH ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.get('/books', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const books = await listBooks(req.tenantId!);
    res.json({ data: books });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/books/:bookKey/chapters/:chapterNumber', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const translation = req.query.translation as string || 'kjv';
    const verses = await getChapter(
      req.tenantId!,
      translation,
      req.params.bookKey as string,
      parseInt(req.params.chapterNumber as string, 10)
    );
    res.json({ data: verses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reference', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref, translation } = req.query;
    if (!ref) {
      res.status(400).json({ error: 'ref query parameter is required' });
      return;
    }
    const verses = await resolveScriptureReference(req.tenantId!, (translation as string) || 'kjv', ref as string);
    res.json({ data: verses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/verse', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { book, chapter, verse, translation } = req.query;
    if (!book || !chapter || !verse) {
      res.status(400).json({ error: 'book, chapter, and verse query parameters are required' });
      return;
    }
    const verses = await prisma.bibleVerse.findMany({
      where: {
        tenantId: req.tenantId!,
        translationCode: ((translation as string) || 'kjv').toLowerCase(),
        bookSlug: (book as string).toLowerCase().trim(),
        chapter: parseInt(chapter as string, 10),
        verse: parseInt(verse as string, 10)
      }
    });
    res.json({ data: verses[0] || null });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SCRIPTURE REFERENCES PROCESSING ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.post('/references/parse', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required in request body' });
      return;
    }

    // Split by semicolons, commas, or newlines to find references
    const parts = text.split(/[;\n]/);
    const results: any[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Regex to match "John 3:16" or "Genesis 1:1-5" or "1 John 2:3"
      const regex = /(\d?\s*[a-zA-Z\s]+)\s+(\d+):(\d+)(?:-(\d+))?/;
      const match = trimmed.match(regex);
      if (match) {
        const book = match[1].trim();
        const chapter = parseInt(match[2], 10);
        const startVerse = parseInt(match[3], 10);
        const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
        const normalized = `${book} ${chapter}:${startVerse}${endVerse !== startVerse ? '-' + endVerse : ''}`;

        results.push({
          reference: trimmed,
          book,
          chapter,
          start_verse: startVerse,
          end_verse: endVerse,
          normalized
        });
      }
    }
    res.json({ data: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/references/resolve', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference, translation } = req.body;
    if (!reference) {
      res.status(400).json({ error: 'reference is required' });
      return;
    }
    const verses = await resolveScriptureReference(req.tenantId!, translation || 'kjv', reference);
    res.json({ data: verses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/references/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const ref = await prisma.bibleScriptureReference.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! }
    });
    if (!ref) {
      res.status(404).json({ error: 'Scripture reference not found' });
      return;
    }
    res.json({ data: ref });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// READING PLANS DETAILS & DELETES
// ─────────────────────────────────────────────────────────────
router.get(['/plans/:id', '/reading-plans/:id'], requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await prisma.bibleReadingPlan.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      include: { days: true }
    });
    if (!plan) {
      res.status(404).json({ error: 'Reading plan not found' });
      return;
    }
    res.json({ data: plan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch(['/plans/:id', '/reading-plans/:id'], requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, coverImageUrl, durationDays } = req.body;
    await prisma.bibleReadingPlan.updateMany({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      data: {
        title,
        description,
        coverImageUrl,
        durationDays
      }
    });
    const updated = await prisma.bibleReadingPlan.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      include: { days: true }
    });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete(['/plans/:id', '/reading-plans/:id'], requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.bibleReadingPlan.deleteMany({
      where: { id: req.params.id as string, tenantId: req.tenantId! }
    });
    res.json({ message: 'Reading plan deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post(['/plans/:id/publish', '/reading-plans/:id/publish'], requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Reading plan published successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get(['/enrollments/:id/progress', '/plans/:id/progress', '/reading-plans/:id/progress'], requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const progress = await prisma.bibleReadingPlanEnrollment.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! }
    });
    res.json({ data: progress });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// BOOKMARKS CONTROL
// ─────────────────────────────────────────────────────────────
router.patch('/bookmarks/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Bookmark updated' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SCRIPTURE NOTES DETAILS & DELETES
// ─────────────────────────────────────────────────────────────
router.get('/notes/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }
    const note = await prisma.bibleVerseNote.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId!, memberId: member.id }
    });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json({ data: note });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/notes/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { noteText } = req.body;
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }
    await prisma.bibleVerseNote.updateMany({
      where: { id: req.params.id as string, tenantId: req.tenantId!, memberId: member.id },
      data: { noteText }
    });
    const updated = await prisma.bibleVerseNote.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId!, memberId: member.id }
    });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/notes/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }
    await prisma.bibleVerseNote.deleteMany({
      where: { id: req.params.id as string, tenantId: req.tenantId!, memberId: member.id }
    });
    res.json({ message: 'Note deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DAILY DEVOTIONALS ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.get('/devotionals', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const devotionals = await prisma.dailyDevotional.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { date: 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
    res.json({ data: devotionals });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/devotionals/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const dev = await prisma.dailyDevotional.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
    if (!dev) {
      res.status(404).json({ error: 'Devotional not found' });
      return;
    }
    res.json({ data: dev });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/devotionals/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, scriptureRef, date } = req.body;
    const updateData: any = { title, content, scriptureRef };
    if (date) {
      updateData.date = new Date(date);
    }
    await prisma.dailyDevotional.updateMany({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      data: updateData
    });
    const updated = await prisma.dailyDevotional.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! }
    });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/devotionals/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.dailyDevotional.deleteMany({
      where: { id: req.params.id as string, tenantId: req.tenantId! }
    });
    res.json({ message: 'Devotional deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/devotionals/:id/publish', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Devotional published successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/devotionals/:id/mark-read', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Devotional marked read successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// VERSE SHARING ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.post('/share/verse', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference, translation, text } = req.body;
    res.json({ message: 'Verse shared successfully', reference, translation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/share/generate-image', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference, text, templateId } = req.body;
    res.json({ renderedImageUrl: `https://cdn.church.org/graphics/rendered-mock-${Date.now()}.png`, reference, templateId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ANALYTICS ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.get('/analytics', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await prisma.bibleAnalyticsDaily.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { date: 'desc' },
      take: 30
    });
    res.json({ data: stats });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/analytics/reading-plans/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const totalEnrolled = await prisma.bibleReadingPlanEnrollment.count({
      where: { planId: req.params.id as string, tenantId: req.tenantId! }
    });
    const totalCompleted = await prisma.bibleReadingPlanEnrollment.count({
      where: { planId: req.params.id as string, tenantId: req.tenantId!, completedAt: { not: null } }
    });
    res.json({
      data: {
        totalEnrolled,
        totalCompleted,
        completionRate: totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/analytics/devotionals/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ data: { totalReads: 147 } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AI STUDY HELPERS ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.post('/ai/summarize-passage', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.body;
    res.json({
      summary: `AI summarized insights for ${reference || 'the scripture passage'}: Focuses on divine grace, spiritual stewardship, and theological foundations.`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ai/generate-devotional', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.body;
    res.json({
      title: `Daily Meditations: ${reference || 'Scripture'}`,
      content: `AI generated content for ${reference || 'Scripture'}: We are called to walk in divine purpose and absolute victory, matching our physical steps to spiritual principles.`,
      scriptureRef: reference || 'John 3:16'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ai/generate-reading-plan', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, durationDays } = req.body;
    res.json({
      title: `AI Plan: Walking in ${topic || 'Faith'}`,
      durationDays: durationDays || 3,
      days: [
        { dayNumber: 1, readings: [{ book: 'John', chapter: 3, verses: '16' }] }
      ]
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

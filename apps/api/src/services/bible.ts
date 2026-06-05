import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// 1. TRANSLATION & SEEDING MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function registerTranslation(
  tenantId: string,
  data: { name: string; code: string; language?: string; isLicensed?: boolean }
): Promise<any> {
  return await prisma.bibleTranslation.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code.toLowerCase().trim(),
      language: data.language || 'en',
      isLicensed: data.isLicensed !== undefined ? data.isLicensed : true,
    },
  });
}

export async function listTranslations(tenantId: string): Promise<any[]> {
  return await prisma.bibleTranslation.findMany({
    where: { tenantId },
  });
}

const DEFAULT_BOOKS = [
  { name: 'Genesis', slug: 'genesis', testament: 'OT', order: 1 },
  { name: 'Exodus', slug: 'exodus', testament: 'OT', order: 2 },
  { name: 'Leviticus', slug: 'leviticus', testament: 'OT', order: 3 },
  { name: 'Numbers', slug: 'numbers', testament: 'OT', order: 4 },
  { name: 'Deuteronomy', slug: 'deuteronomy', testament: 'OT', order: 5 },
  { name: 'Joshua', slug: 'joshua', testament: 'OT', order: 6 },
  { name: 'Judges', slug: 'judges', testament: 'OT', order: 7 },
  { name: 'Ruth', slug: 'ruth', testament: 'OT', order: 8 },
  { name: '1 Samuel', slug: '1-samuel', testament: 'OT', order: 9 },
  { name: '2 Samuel', slug: '2-samuel', testament: 'OT', order: 10 },
  { name: '1 Kings', slug: '1-kings', testament: 'OT', order: 11 },
  { name: '2 Kings', slug: '2-kings', testament: 'OT', order: 12 },
  { name: '1 Chronicles', slug: '1-chronicles', testament: 'OT', order: 13 },
  { name: '2 Chronicles', slug: '2-chronicles', testament: 'OT', order: 14 },
  { name: 'Ezra', slug: 'ezra', testament: 'OT', order: 15 },
  { name: 'Nehemiah', slug: 'nehemiah', testament: 'OT', order: 16 },
  { name: 'Esther', slug: 'esther', testament: 'OT', order: 17 },
  { name: 'Job', slug: 'job', testament: 'OT', order: 18 },
  { name: 'Psalms', slug: 'psalms', testament: 'OT', order: 19 },
  { name: 'Proverbs', slug: 'proverbs', testament: 'OT', order: 20 },
  { name: 'Ecclesiastes', slug: 'ecclesiastes', testament: 'OT', order: 21 },
  { name: 'Song of Solomon', slug: 'song-of-solomon', testament: 'OT', order: 22 },
  { name: 'Isaiah', slug: 'isaiah', testament: 'OT', order: 23 },
  { name: 'Jeremiah', slug: 'jeremiah', testament: 'OT', order: 24 },
  { name: 'Lamentations', slug: 'lamentations', testament: 'OT', order: 25 },
  { name: 'Ezekiel', slug: 'ezekiel', testament: 'OT', order: 26 },
  { name: 'Daniel', slug: 'daniel', testament: 'OT', order: 27 },
  { name: 'Hosea', slug: 'hosea', testament: 'OT', order: 28 },
  { name: 'Joel', slug: 'joel', testament: 'OT', order: 29 },
  { name: 'Amos', slug: 'amos', testament: 'OT', order: 30 },
  { name: 'Obadiah', slug: 'obadiah', testament: 'OT', order: 31 },
  { name: 'Jonah', slug: 'jonah', testament: 'OT', order: 32 },
  { name: 'Micah', slug: 'micah', testament: 'OT', order: 33 },
  { name: 'Nahum', slug: 'nahum', testament: 'OT', order: 34 },
  { name: 'Habakkuk', slug: 'habakkuk', testament: 'OT', order: 35 },
  { name: 'Zephaniah', slug: 'zephaniah', testament: 'OT', order: 36 },
  { name: 'Haggai', slug: 'haggai', testament: 'OT', order: 37 },
  { name: 'Zechariah', slug: 'zechariah', testament: 'OT', order: 38 },
  { name: 'Malachi', slug: 'malachi', testament: 'OT', order: 39 },
  { name: 'Matthew', slug: 'matthew', testament: 'NT', order: 40 },
  { name: 'Mark', slug: 'mark', testament: 'NT', order: 41 },
  { name: 'Luke', slug: 'luke', testament: 'NT', order: 42 },
  { name: 'John', slug: 'john', testament: 'NT', order: 43 },
  { name: 'Acts', slug: 'acts', testament: 'NT', order: 44 },
  { name: 'Romans', slug: 'romans', testament: 'NT', order: 45 },
  { name: '1 Corinthians', slug: '1-corinthians', testament: 'NT', order: 46 },
  { name: '2 Corinthians', slug: '2-corinthians', testament: 'NT', order: 47 },
  { name: 'Galatians', slug: 'galatians', testament: 'NT', order: 48 },
  { name: 'Ephesians', slug: 'ephesians', testament: 'NT', order: 49 },
  { name: 'Philippians', slug: 'philippians', testament: 'NT', order: 50 },
  { name: 'Colossians', slug: 'colossians', testament: 'NT', order: 51 },
  { name: '1 Thessalonians', slug: '1-thessalonians', testament: 'NT', order: 52 },
  { name: '2 Thessalonians', slug: '2-thessalonians', testament: 'NT', order: 53 },
  { name: '1 Timothy', slug: '1-timothy', testament: 'NT', order: 54 },
  { name: '2 Timothy', slug: '2-timothy', testament: 'NT', order: 55 },
  { name: 'Titus', slug: 'titus', testament: 'NT', order: 56 },
  { name: 'Philemon', slug: 'philemon', testament: 'NT', order: 57 },
  { name: 'Hebrews', slug: 'hebrews', testament: 'NT', order: 58 },
  { name: 'James', slug: 'james', testament: 'NT', order: 59 },
  { name: '1 Peter', slug: '1-peter', testament: 'NT', order: 60 },
  { name: '2 Peter', slug: '2-peter', testament: 'NT', order: 61 },
  { name: '1 John', slug: '1-john', testament: 'NT', order: 62 },
  { name: '2 John', slug: '2-john', testament: 'NT', order: 63 },
  { name: '3 John', slug: '3-john', testament: 'NT', order: 64 },
  { name: 'Jude', slug: 'jude', testament: 'NT', order: 65 },
  { name: 'Revelation', slug: 'revelation', testament: 'NT', order: 66 }
];

export async function listBooks(tenantId: string): Promise<any[]> {
  const existing = await prisma.bibleBook.findMany({
    where: { tenantId },
    orderBy: { order: 'asc' },
  });
  if (existing.length > 0) {
    return existing;
  }
  // Auto-seed for this tenant
  await prisma.bibleBook.createMany({
    data: DEFAULT_BOOKS.map((b) => ({
      tenantId,
      name: b.name,
      slug: b.slug,
      order: b.order,
      testament: b.testament,
    })),
  });
  return await prisma.bibleBook.findMany({
    where: { tenantId },
    orderBy: { order: 'asc' },
  });
}

export async function seedBibleVerses(
  tenantId: string,
  verses: Array<{
    translationCode: string;
    bookSlug: string;
    chapter: number;
    verse: number;
    text: string;
  }>
): Promise<void> {
  for (const v of verses) {
    const translationCode = v.translationCode.toLowerCase().trim();
    const bookSlug = v.bookSlug.toLowerCase().trim();
    await prisma.bibleVerse.upsert({
      where: {
        tenantId_translationCode_bookSlug_chapter_verse: {
          tenantId,
          translationCode,
          bookSlug,
          chapter: v.chapter,
          verse: v.verse,
        },
      },
      update: {
        text: v.text,
      },
      create: {
        tenantId,
        translationCode,
        bookSlug,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 2. BIBLE READING & SEARCHING
// ─────────────────────────────────────────────────────────────

export async function getChapter(
  tenantId: string,
  translationCode: string,
  bookSlug: string,
  chapter: number
): Promise<any[]> {
  return await prisma.bibleVerse.findMany({
    where: {
      tenantId,
      translationCode: translationCode.toLowerCase().trim(),
      bookSlug: bookSlug.toLowerCase().trim(),
      chapter,
    },
    orderBy: { verse: 'asc' },
  });
}

export async function searchBible(
  tenantId: string,
  translationCode: string,
  query: string
): Promise<any[]> {
  return await prisma.bibleVerse.findMany({
    where: {
      tenantId,
      translationCode: translationCode.toLowerCase().trim(),
      text: {
        contains: query,
      },
    },
    orderBy: [
      { bookSlug: 'asc' },
      { chapter: 'asc' },
      { verse: 'asc' },
    ],
    take: 50,
  });
}

// ─────────────────────────────────────────────────────────────
// 3. SCRIPTURE REFERENCE PARSER & RESOLVER
// ─────────────────────────────────────────────────────────────

export interface ParsedReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export function parseReference(referenceText: string): ParsedReference {
  // Regex to match "John 3:16" or "Genesis 1:1-5" or "1 John 2:3"
  const regex = /^(\d?\s*[a-zA-Z\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
  const match = referenceText.trim().match(regex);
  if (!match) {
    throw new Error(`Invalid scripture reference format: ${referenceText}`);
  }

  const book = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verseStart = parseInt(match[3], 10);
  const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;

  return { book, chapter, verseStart, verseEnd };
}

export async function resolveScriptureReference(
  tenantId: string,
  translationCode: string,
  referenceText: string
): Promise<any[]> {
  const parsed = parseReference(referenceText);
  const code = translationCode.toLowerCase().trim();
  const bookSlug = parsed.book.toLowerCase().replace(/\s+/g, '-').trim();

  return await prisma.bibleVerse.findMany({
    where: {
      tenantId,
      translationCode: code,
      bookSlug,
      chapter: parsed.chapter,
      verse: {
        gte: parsed.verseStart,
        lte: parsed.verseEnd,
      },
    },
    orderBy: { verse: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. BIBLE READING PLANS
// ─────────────────────────────────────────────────────────────

export async function createReadingPlan(
  tenantId: string,
  data: {
    title: string;
    description?: string;
    coverImageUrl?: string;
    durationDays: number;
    days: Array<{
      dayNumber: number;
      readings: Array<{ book: string; chapter: number; verses: string }>;
    }>;
  }
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const plan = await tx.bibleReadingPlan.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description || null,
        coverImageUrl: data.coverImageUrl || null,
        durationDays: data.durationDays,
      },
    });

    for (const d of data.days) {
      await tx.bibleReadingPlanDay.create({
        data: {
          tenantId,
          planId: plan.id,
          dayNumber: d.dayNumber,
          readingsJson: JSON.stringify(d.readings),
        },
      });
    }

    return plan;
  });
}

export async function listReadingPlans(tenantId: string): Promise<any[]> {
  return await prisma.bibleReadingPlan.findMany({
    where: { tenantId },
    include: { days: true },
  });
}

export async function enrollInReadingPlan(
  tenantId: string,
  planId: string,
  memberId: string
): Promise<any> {
  const plan = await prisma.bibleReadingPlan.findFirst({
    where: { id: planId, tenantId },
  });
  if (!plan) {
    throw new Error('Reading plan not found');
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const enrollment = await prisma.bibleReadingPlanEnrollment.upsert({
    where: {
      planId_memberId: { planId, memberId },
    },
    update: {},
    create: {
      tenantId,
      planId,
      memberId,
      progressPercent: 0.0,
      completedDaysJson: JSON.stringify([]),
    },
  });

  // Also update NewBelieverProfile bibleReadingPlanStartedAt if member is a new believer
  const newBeliever = await prisma.newBelieverProfile.findFirst({
    where: { memberId, tenantId },
  });
  if (newBeliever && !newBeliever.bibleReadingPlanStartedAt) {
    await prisma.newBelieverProfile.update({
      where: { id: newBeliever.id },
      data: {
        bibleReadingPlanStartedAt: new Date(),
      },
    });
  }

  return enrollment;
}

export async function completeDayInReadingPlan(
  tenantId: string,
  enrollmentId: string,
  dayNumber: number
): Promise<any> {
  const enrollment = await prisma.bibleReadingPlanEnrollment.findFirst({
    where: { id: enrollmentId, tenantId },
    include: { plan: true },
  });
  if (!enrollment) {
    throw new Error('Reading plan enrollment not found');
  }

  let completedDays: number[] = [];
  try {
    completedDays = JSON.parse(enrollment.completedDaysJson);
  } catch (e) {
    completedDays = [];
  }

  if (!completedDays.includes(dayNumber)) {
    completedDays.push(dayNumber);
  }

  const durationDays = enrollment.plan.durationDays;
  const progressPercent = durationDays > 0 ? parseFloat(((completedDays.length / durationDays) * 100).toFixed(1)) : 0.0;
  const completedAt = completedDays.length >= durationDays ? new Date() : null;

  return await prisma.bibleReadingPlanEnrollment.update({
    where: { id: enrollmentId },
    data: {
      completedDaysJson: JSON.stringify(completedDays),
      progressPercent,
      completedAt,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 5. BOOKMARKS & JOURNALING
// ─────────────────────────────────────────────────────────────

export async function addBookmark(
  tenantId: string,
  memberId: string,
  data: {
    translationCode: string;
    bookSlug: string;
    chapter: number;
    verse: number;
  }
): Promise<any> {
  const code = data.translationCode.toLowerCase().trim();
  const bookSlug = data.bookSlug.toLowerCase().trim();

  return await prisma.bibleBookmark.upsert({
    where: {
      memberId_translationCode_bookSlug_chapter_verse: {
        memberId,
        translationCode: code,
        bookSlug,
        chapter: data.chapter,
        verse: data.verse,
      },
    },
    update: {},
    create: {
      tenantId,
      memberId,
      translationCode: code,
      bookSlug,
      chapter: data.chapter,
      verse: data.verse,
    },
  });
}

export async function removeBookmark(tenantId: string, bookmarkId: string): Promise<void> {
  const bookmark = await prisma.bibleBookmark.findFirst({
    where: { id: bookmarkId, tenantId },
  });
  if (!bookmark) {
    throw new Error('Bookmark not found');
  }

  await prisma.bibleBookmark.delete({
    where: { id: bookmarkId },
  });
}

export async function listBookmarks(tenantId: string, memberId: string): Promise<any[]> {
  return await prisma.bibleBookmark.findMany({
    where: { tenantId, memberId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveVerseNote(
  tenantId: string,
  memberId: string,
  data: {
    bookSlug: string;
    chapter: number;
    verse: number;
    noteText: string;
  }
): Promise<any> {
  const bookSlug = data.bookSlug.toLowerCase().trim();

  return await prisma.bibleVerseNote.upsert({
    where: {
      memberId_bookSlug_chapter_verse: {
        memberId,
        bookSlug,
        chapter: data.chapter,
        verse: data.verse,
      },
    },
    update: {
      noteText: data.noteText,
    },
    create: {
      tenantId,
      memberId,
      bookSlug,
      chapter: data.chapter,
      verse: data.verse,
      noteText: data.noteText,
    },
  });
}

export async function listVerseNotes(
  tenantId: string,
  memberId: string,
  filter?: { bookSlug?: string; chapter?: number }
): Promise<any[]> {
  const where: any = { tenantId, memberId };
  if (filter?.bookSlug) {
    where.bookSlug = filter.bookSlug.toLowerCase().trim();
  }
  if (filter?.chapter) {
    where.chapter = filter.chapter;
  }

  return await prisma.bibleVerseNote.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 6. DAILY DEVOTIONALS
// ─────────────────────────────────────────────────────────────

export async function createDailyDevotional(
  tenantId: string,
  data: {
    date: Date | string;
    title: string;
    content: string;
    scriptureRef: string;
    authorId?: string;
  }
): Promise<any> {
  const devotionalDate = new Date(data.date);
  devotionalDate.setUTCHours(0, 0, 0, 0);

  return await prisma.dailyDevotional.create({
    data: {
      tenantId,
      date: devotionalDate,
      title: data.title,
      content: data.content,
      scriptureRef: data.scriptureRef,
      authorId: data.authorId || null,
    },
  });
}

export async function getDailyDevotional(tenantId: string, date: Date | string): Promise<any> {
  const devotionalDate = new Date(date);
  devotionalDate.setUTCHours(0, 0, 0, 0);

  return await prisma.dailyDevotional.findFirst({
    where: { tenantId, date: devotionalDate },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 7. SERMONS / SERVICES CROSS-LINKING
// ─────────────────────────────────────────────────────────────

export async function getLinkedSermons(
  tenantId: string,
  bookSlug: string,
  chapter: number
): Promise<any[]> {
  const serviceScriptures = await prisma.serviceScripture.findMany({
    where: {
      service: {
        tenantId,
      },
    },
    include: {
      service: {
        select: { id: true, title: true, serviceDate: true },
      },
    },
  });

  const matchedServices: any[] = [];
  const bookClean = bookSlug.toLowerCase().replace(/-/g, ' ').trim();

  for (const ss of serviceScriptures) {
    try {
      const parsed = parseReference(ss.reference);
      const parsedBook = parsed.book.toLowerCase().trim();
      if (parsedBook === bookClean && parsed.chapter === chapter) {
        matchedServices.push({
          serviceId: ss.serviceId,
          title: ss.service.title,
          serviceDate: ss.service.serviceDate,
          reference: ss.reference,
        });
      }
    } catch (e) {
      const refLower = ss.reference.toLowerCase();
      if (refLower.includes(bookClean) && refLower.includes(chapter.toString())) {
        matchedServices.push({
          serviceId: ss.serviceId,
          title: ss.service.title,
          serviceDate: ss.service.serviceDate,
          reference: ss.reference,
        });
      }
    }
  }

  const uniqueServices = Array.from(new Map(matchedServices.map((s) => [s.serviceId, s])).values());
  return uniqueServices;
}

// ─────────────────────────────────────────────────────────────
// 8. BIBLE VERSE HIGHLIGHTS
// ─────────────────────────────────────────────────────────────

export async function addHighlight(
  tenantId: string,
  memberId: string,
  data: {
    translationCode: string;
    bookSlug: string;
    chapter: number;
    verse: number;
    color: string;
  }
): Promise<any> {
  const code = data.translationCode.toLowerCase().trim();
  const bookSlug = data.bookSlug.toLowerCase().trim();

  return await prisma.bibleVerseHighlight.upsert({
    where: {
      memberId_translationCode_bookSlug_chapter_verse: {
        memberId,
        translationCode: code,
        bookSlug,
        chapter: data.chapter,
        verse: data.verse,
      },
    },
    update: {
      color: data.color,
    },
    create: {
      tenantId,
      memberId,
      translationCode: code,
      bookSlug,
      chapter: data.chapter,
      verse: data.verse,
      color: data.color,
    },
  });
}

export async function removeHighlight(tenantId: string, highlightId: string): Promise<void> {
  const highlight = await prisma.bibleVerseHighlight.findFirst({
    where: { id: highlightId, tenantId },
  });
  if (!highlight) {
    throw new Error('Highlight not found');
  }

  await prisma.bibleVerseHighlight.delete({
    where: { id: highlightId },
  });
}

export async function listHighlights(tenantId: string, memberId: string): Promise<any[]> {
  return await prisma.bibleVerseHighlight.findMany({
    where: { tenantId, memberId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 9. AUDIO BIBLE MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function registerAudioTrack(
  tenantId: string,
  data: {
    translationCode: string;
    bookSlug: string;
    chapter: number;
    audioUrl: string;
    provider?: string;
  }
): Promise<any> {
  const code = data.translationCode.toLowerCase().trim();
  const bookSlug = data.bookSlug.toLowerCase().trim();

  return await prisma.bibleAudioTrack.upsert({
    where: {
      tenantId_translationCode_bookSlug_chapter: {
        tenantId,
        translationCode: code,
        bookSlug,
        chapter: data.chapter,
      },
    },
    update: {
      audioUrl: data.audioUrl,
      provider: data.provider || 'custom',
    },
    create: {
      tenantId,
      translationCode: code,
      bookSlug,
      chapter: data.chapter,
      audioUrl: data.audioUrl,
      provider: data.provider || 'custom',
    },
  });
}

export async function getAudioTrack(
  tenantId: string,
  translationCode: string,
  bookSlug: string,
  chapter: number
): Promise<string> {
  const code = translationCode.toLowerCase().trim();
  const book = bookSlug.toLowerCase().trim();

  const track = await prisma.bibleAudioTrack.findFirst({
    where: {
      tenantId,
      translationCode: code,
      bookSlug: book,
      chapter,
    },
  });

  if (track) {
    return track.audioUrl;
  }

  return `https://audio.bible.is/tts/${code}/${book}/${chapter}.mp3`;
}

// ─────────────────────────────────────────────────────────────
// 10. OFFLINE DOWNLOAD API
// ─────────────────────────────────────────────────────────────

export async function getTranslationDownload(
  tenantId: string,
  translationCode: string
): Promise<{
  translation: { name: string; code: string; language: string };
  verses: Array<{ book: string; chapter: number; verse: number; text: string }>;
}> {
  const code = translationCode.toLowerCase().trim();
  const translation = await prisma.bibleTranslation.findFirst({
    where: { tenantId, code },
  });

  if (!translation) {
    throw new Error('Translation not found');
  }

  const verses = await prisma.bibleVerse.findMany({
    where: { tenantId, translationCode: code },
    orderBy: [
      { bookSlug: 'asc' },
      { chapter: 'asc' },
      { verse: 'asc' },
    ],
  });

  return {
    translation: {
      name: translation.name,
      code: translation.code,
      language: translation.language,
    },
    verses: verses.map((v) => ({
      book: v.bookSlug,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// 11. SCRIPTURE GRAPHICS CREATOR
// ─────────────────────────────────────────────────────────────

export interface GraphicTemplate {
  id: string;
  name: string;
  backgroundUrl: string;
  fontColor: string;
  fontFamily: string;
}

export function getGraphicTemplates(): GraphicTemplate[] {
  return [
    { id: 'sunset', name: 'Sunset Glow', backgroundUrl: 'https://cdn.church.org/backgrounds/sunset.jpg', fontColor: '#ffffff', fontFamily: 'Lora' },
    { id: 'abstract-blue', name: 'Abstract Blue Ocean', backgroundUrl: 'https://cdn.church.org/backgrounds/ocean.jpg', fontColor: '#e0f2fe', fontFamily: 'Inter' },
    { id: 'minimal-dark', name: 'Charcoal Minimalist', backgroundUrl: 'https://cdn.church.org/backgrounds/charcoal.jpg', fontColor: '#f3f4f6', fontFamily: 'Outfit' },
    { id: 'forest', name: 'Mystic Forest', backgroundUrl: 'https://cdn.church.org/backgrounds/forest.jpg', fontColor: '#ecfdf5', fontFamily: 'Playfair Display' },
  ];
}

export async function generateScriptureGraphic(
  tenantId: string,
  data: {
    text: string;
    reference: string;
    templateId: string;
  }
): Promise<any> {
  const templates = getGraphicTemplates();
  const template = templates.find((t) => t.id === data.templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const crypto = require('crypto');
  const graphicId = crypto.randomUUID();

  return {
    id: graphicId,
    text: data.text,
    reference: data.reference,
    template,
    renderedImageUrl: `https://cdn.church.org/graphics/rendered-${graphicId}.png`,
  };
}


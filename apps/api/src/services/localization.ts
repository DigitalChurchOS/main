import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { AiCopilotProvider } from './integrations/interfaces';

/**
 * Registers a new language in the system.
 */
export async function registerLanguage(
  id: string,
  name: string,
  direction: string = 'ltr'
): Promise<any> {
  if (!['ltr', 'rtl'].includes(direction)) {
    throw new Error('Invalid direction. Must be ltr or rtl');
  }

  return await prisma.languageRegistry.upsert({
    where: { id },
    update: { name, direction },
    create: { id, name, direction },
  });
}

/**
 * Batch registers/upserts translation key-value mappings for a namespace.
 */
export async function registerTranslationKeys(
  locale: string,
  namespace: string,
  keys: Record<string, string>
): Promise<void> {
  const language = await prisma.languageRegistry.findUnique({
    where: { id: locale },
  });

  if (!language) {
    throw new Error(`Language '${locale}' is not registered in the system`);
  }

  // Use a transaction to upsert keys
  await prisma.$transaction(
    Object.entries(keys).map(([key, value]) =>
      prisma.translationKey.upsert({
        where: {
          locale_key_namespace: { locale, key, namespace },
        },
        update: { value },
        create: { locale, key, namespace, value },
      })
    )
  );
}

/**
 * Retrieves all translation key-value mappings for selected namespaces and locale.
 * Performs fallback to 'en' locale for any missing keys.
 */
export async function getTranslations(
  locale: string,
  namespaces: string[]
): Promise<Record<string, string>> {
  const targetKeys = await prisma.translationKey.findMany({
    where: {
      locale,
      namespace: { in: namespaces },
    },
  });

  const result: Record<string, string> = {};

  // Populate target translations
  targetKeys.forEach((tk) => {
    result[tk.key] = tk.value;
  });

  // If target locale is not 'en', load 'en' translations to fall back for missing keys
  if (locale !== 'en') {
    const fallbackKeys = await prisma.translationKey.findMany({
      where: {
        locale: 'en',
        namespace: { in: namespaces },
      },
    });

    fallbackKeys.forEach((tk) => {
      if (result[tk.key] === undefined) {
        result[tk.key] = tk.value;
      }
    });
  }

  return result;
}

/**
 * Translates a single key, substituting variable placeholders like {{name}}.
 * Falls back to 'en' if key is missing in target locale.
 */
export async function translate(
  locale: string,
  key: string,
  namespace: string = 'core',
  variables?: Record<string, string>
): Promise<string> {
  let tk = await prisma.translationKey.findUnique({
    where: {
      locale_key_namespace: { locale, key, namespace },
    },
  });

  // Fallback to 'en'
  if (!tk && locale !== 'en') {
    tk = await prisma.translationKey.findUnique({
      where: {
        locale_key_namespace: { locale: 'en', key, namespace },
      },
    });
  }

  if (!tk) {
    return key; // return key as fallback if translation is not found anywhere
  }

  let text = tk.value;

  if (variables) {
    Object.entries(variables).forEach(([vKey, vVal]) => {
      text = text.replace(new RegExp(`{{\\s*${vKey}\\s*}}`, 'g'), vVal);
    });
  }

  return text;
}

/**
 * Updates user preferred language setting. Also syncs with the linked Member profile.
 */
export async function updateUserLanguagePreference(
  userId: string,
  preferredLanguage: string
): Promise<any> {
  // Check if language is registered
  const language = await prisma.languageRegistry.findUnique({
    where: { id: preferredLanguage },
  });

  if (!language) {
    throw new Error(`Language '${preferredLanguage}' is not registered`);
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { preferredLanguage },
    });

    // Check if user has a linked Member record and update it
    const member = await tx.member.findUnique({
      where: { userId },
    });

    if (member) {
      await tx.member.update({
        where: { id: member.id },
        data: { preferredLanguage },
      });
    }

    return user;
  });
}

// ─────────────────────────────────────────────────────────────
// ADVANCED TRANSLATION SERVICES
// ─────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  const cleaned = text.replace(/^\[Translated to [a-zA-Z\-]+\]:\s*/i, '');
  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─────────────────────────────────────────────────────────────
// AI TRANSLATION JOBS
// ─────────────────────────────────────────────────────────────

export async function createTranslationJob(
  tenantId: string,
  data: {
    entityType: string;
    entityId: string;
    targetLanguage: string;
  }
) {
  const { entityType, entityId, targetLanguage } = data;

  // Verify the entity exists before queuing
  if (entityType === 'page') {
    const page = await prisma.page.findFirst({ where: { id: entityId, tenantId } });
    if (!page) throw new Error('Page not found');
  } else if (entityType === 'blog_post') {
    const post = await prisma.blogPost.findFirst({ where: { id: entityId, tenantId } });
    if (!post) throw new Error('BlogPost not found');
  } else if (entityType === 'library_resource') {
    const resource = await prisma.libraryResource.findFirst({ where: { id: entityId, tenantId } });
    if (!resource) throw new Error('LibraryResource not found');
  } else if (entityType === 'lms_lesson') {
    const lesson = await prisma.lmsLesson.findFirst({ where: { id: entityId, tenantId } });
    if (!lesson) throw new Error('LmsLesson not found');
  } else {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  // Create pending job
  return await prisma.translationJob.create({
    data: {
      tenantId,
      entityType,
      entityId,
      targetLanguage,
      status: 'pending',
    },
  });
}

export async function runTranslationJob(tenantId: string, jobId: string) {
  const job = await prisma.translationJob.findFirst({
    where: { id: jobId, tenantId },
  });
  if (!job) throw new Error('Translation job not found');

  await prisma.translationJob.update({
    where: { id: jobId },
    data: { status: 'processing' },
  });

  try {
    // 1. Resolve AI Copilot driver
    const driver: AiCopilotProvider = await resolveDriver(tenantId, 'ai_copilot');

    // 2. Fetch the entity details based on type
    let title = '';
    let content = '';
    let excerpt: string | null = null;
    let description: string | null = null;

    if (job.entityType === 'page') {
      const page = await prisma.page.findFirst({ where: { id: job.entityId, tenantId } });
      if (!page) throw new Error('Page not found');
      title = page.title;
      content = page.content;
    } else if (job.entityType === 'blog_post') {
      const post = await prisma.blogPost.findFirst({ where: { id: job.entityId, tenantId } });
      if (!post) throw new Error('BlogPost not found');
      title = post.title;
      content = post.content;
      excerpt = post.excerpt;
    } else if (job.entityType === 'library_resource') {
      const resource = await prisma.libraryResource.findFirst({ where: { id: job.entityId, tenantId } });
      if (!resource) throw new Error('LibraryResource not found');
      title = resource.title;
      description = resource.description;
    } else if (job.entityType === 'lms_lesson') {
      const lesson = await prisma.lmsLesson.findFirst({ where: { id: job.entityId, tenantId } });
      if (!lesson) throw new Error('LmsLesson not found');
      title = lesson.title;
      content = lesson.content || '';
    } else {
      throw new Error(`Unsupported entity type: ${job.entityType}`);
    }

    // 3. Translate fields
    const translatedPayload: any = {};

    const titleRes = await driver.translateText(title, job.targetLanguage);
    if (!titleRes.success) throw new Error(titleRes.error || 'Title translation failed');
    translatedPayload.title = titleRes.text;

    if (content) {
      const contentRes = await driver.translateText(content, job.targetLanguage);
      if (!contentRes.success) throw new Error(contentRes.error || 'Content translation failed');
      translatedPayload.content = contentRes.text;
    }

    if (excerpt) {
      const excerptRes = await driver.translateText(excerpt, job.targetLanguage);
      if (!excerptRes.success) throw new Error(excerptRes.error || 'Excerpt translation failed');
      translatedPayload.excerpt = excerptRes.text;
    }

    if (description) {
      const descRes = await driver.translateText(description, job.targetLanguage);
      if (!descRes.success) throw new Error(descRes.error || 'Description translation failed');
      translatedPayload.description = descRes.text;
    }

    // 4. Update job to completed
    return await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        translatedContent: JSON.stringify(translatedPayload),
      },
    });
  } catch (err: any) {
    return await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: err.message || 'Internal AI execution error',
      },
    });
  }
}

export async function getTranslationJob(tenantId: string, jobId: string) {
  const job = await prisma.translationJob.findFirst({
    where: { id: jobId, tenantId },
  });
  if (!job) throw new Error('Translation job not found');
  return job;
}

export async function listTranslationJobs(tenantId: string) {
  return await prisma.translationJob.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function approveTranslationJob(tenantId: string, jobId: string) {
  const job = await getTranslationJob(tenantId, jobId);
  if (job.status !== 'completed' || !job.translatedContent) {
    throw new Error('Translation job is not completed yet');
  }

  const payload = JSON.parse(job.translatedContent);
  const slug = slugify(payload.title);

  // Upsert the translated content
  return await prisma.translatedContent.upsert({
    where: {
      tenantId_entityType_entityId_locale: {
        tenantId,
        entityType: job.entityType,
        entityId: job.entityId,
        locale: job.targetLanguage,
      },
    },
    update: {
      title: payload.title,
      content: payload.content || payload.description || '',
      slug,
      isPublished: true,
    },
    create: {
      tenantId,
      entityType: job.entityType,
      entityId: job.entityId,
      locale: job.targetLanguage,
      title: payload.title,
      content: payload.content || payload.description || '',
      slug,
      isPublished: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// MANUAL TRANSLATION & EDITING
// ─────────────────────────────────────────────────────────────

export async function createOrUpdateTranslation(
  tenantId: string,
  data: {
    entityType: string;
    entityId: string;
    locale: string;
    slug: string;
    title: string;
    content: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    isPublished?: boolean;
  }
) {
  const {
    entityType,
    entityId,
    locale,
    slug,
    title,
    content,
    seoTitle,
    seoDescription,
    seoKeywords,
    isPublished,
  } = data;

  return await prisma.translatedContent.upsert({
    where: {
      tenantId_entityType_entityId_locale: {
        tenantId,
        entityType,
        entityId,
        locale,
      },
    },
    update: {
      slug,
      title,
      content,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      isPublished: isPublished !== undefined ? isPublished : true,
    },
    create: {
      tenantId,
      entityType,
      entityId,
      locale,
      slug,
      title,
      content,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      isPublished: isPublished !== undefined ? isPublished : true,
    },
  });
}

export async function getTranslation(
  tenantId: string,
  entityType: string,
  entityId: string,
  locale: string
) {
  const translation = await prisma.translatedContent.findUnique({
    where: {
      tenantId_entityType_entityId_locale: {
        tenantId,
        entityType,
        entityId,
        locale,
      },
    },
  });
  if (!translation) throw new Error('Translation not found');
  return translation;
}

export async function getTranslationBySlug(
  tenantId: string,
  entityType: string,
  locale: string,
  slug: string
) {
  const translation = await prisma.translatedContent.findUnique({
    where: {
      tenantId_locale_slug: {
        tenantId,
        locale,
        slug,
      },
    },
  });

  if (!translation || translation.entityType !== entityType) {
    throw new Error('Translation not found');
  }
  return translation;
}

export async function listTranslationsForEntity(
  tenantId: string,
  entityType: string,
  entityId: string
) {
  return await prisma.translatedContent.findMany({
    where: { tenantId, entityType, entityId },
  });
}

// ─────────────────────────────────────────────────────────────
// LIVESTREAM INTERPRETATION FEEDS
// ─────────────────────────────────────────────────────────────

export async function addLiveTranslationFeed(
  tenantId: string,
  data: {
    livestreamId: string;
    locale: string;
    audioUrl: string;
    label: string;
    isActive?: boolean;
  }
) {
  // Validate livestream exists
  const stream = await prisma.livestream.findFirst({
    where: { id: data.livestreamId, tenantId },
  });
  if (!stream) throw new Error('Livestream not found');

  return await prisma.liveTranslationFeed.create({
    data: {
      tenantId,
      livestreamId: data.livestreamId,
      locale: data.locale,
      audioUrl: data.audioUrl,
      label: data.label,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function listLiveTranslationFeeds(tenantId: string, livestreamId: string) {
  // Validate livestream exists
  const stream = await prisma.livestream.findFirst({
    where: { id: livestreamId, tenantId },
  });
  if (!stream) throw new Error('Livestream not found');

  return await prisma.liveTranslationFeed.findMany({
    where: { tenantId, livestreamId },
    orderBy: { locale: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// MEDIA CAPTIONS & SUBTITLES
// ─────────────────────────────────────────────────────────────

export async function addMediaCaption(
  tenantId: string,
  data: {
    mediaAssetId: string;
    locale: string;
    fileUrl: string;
    content: string;
  }
) {
  // Validate media asset exists
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: data.mediaAssetId, tenantId },
  });
  if (!asset) throw new Error('Media asset not found');

  return await prisma.mediaCaption.create({
    data: {
      tenantId,
      mediaAssetId: data.mediaAssetId,
      locale: data.locale,
      fileUrl: data.fileUrl,
      content: data.content,
    },
  });
}

export async function listMediaCaptions(tenantId: string, mediaAssetId: string) {
  // Validate media asset exists
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: mediaAssetId, tenantId },
  });
  if (!asset) throw new Error('Media asset not found');

  return await prisma.mediaCaption.findMany({
    where: { tenantId, mediaAssetId },
    orderBy: { locale: 'asc' },
  });
}

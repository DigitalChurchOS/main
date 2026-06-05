import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Parses the Accept-Language header into short locale codes sorted by preference weight (q).
 * Example: "fr-CH, fr;q=0.9, en;q=0.8" -> ["fr", "en"]
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((lang) => {
      const parts = lang.trim().split(';');
      const code = parts[0].trim().toLowerCase();
      // Extract the general language code (e.g. "fr-ch" -> "fr")
      const shortCode = code.split('-')[0];
      
      let priority = 1.0;
      if (parts[1]) {
        const qParts = parts[1].trim().split('=');
        if (qParts[0] === 'q' && qParts[1]) {
          priority = parseFloat(qParts[1]) || 1.0;
        }
      }
      return { shortCode, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .map((item) => item.shortCode);
}

/**
 * Locale Detection Middleware
 * ----------------------------
 * Determines the target language code for the request.
 * Prioritizes:
 *   1. Query string: `?locale=es`
 *   2. User profile preference: `req.user.preferredLanguage`
 *   3. Browser Accept-Language header weights
 *   4. Fallback default: `"en"`
 *
 * Injects `req.locale` containing the resolved code.
 */
export async function localeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let resolvedLocale = 'en';

  try {
    // 1. Query parameter override
    if (req.query.locale && typeof req.query.locale === 'string') {
      resolvedLocale = req.query.locale.trim().toLowerCase();
    } 
    // 2. User profile preference
    else if (req.user?.preferredLanguage) {
      resolvedLocale = req.user.preferredLanguage;
    } 
    // 3. Browser headers
    else {
      const acceptLang = req.headers['accept-language'];
      if (acceptLang && typeof acceptLang === 'string') {
        const headerLocales = parseAcceptLanguage(acceptLang);
        
        // Find the first matching active language in our database registry
        const activeLanguages = await prisma.languageRegistry.findMany({
          where: {
            id: { in: headerLocales },
            isActive: true,
          },
          select: { id: true },
        });

        const activeSet = new Set(activeLanguages.map((l) => l.id));
        const matched = headerLocales.find((loc) => activeSet.has(loc));
        if (matched) {
          resolvedLocale = matched;
        }
      }
    }

    req.locale = resolvedLocale;
    next();
  } catch (err) {
    next(err);
  }
}

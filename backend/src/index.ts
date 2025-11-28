import axios from 'axios';
import { load } from 'cheerio';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-change-me';
const USER_AGENT = 'TomfooleryCrawler/1.0 (+https://example.com)';

const allowedOrigins = FRONTEND_ORIGIN.split(',').map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

type User = {
  id: string;
  tumId: string | null;
  email: string;
  fullName: string;
  faculty: string | null;
  semester?: number | null;
  profileSlug: string;
  authProvider: 'mock' | 'tum';
  createdAt: Date;
  updatedAt: Date;
};

type AuthenticatedRequest = express.Request & { user?: User };

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const users: User[] = [];

type CrawlPage = {
  url: string;
  status?: number;
  title?: string;
  description?: string;
  links: string[];
  error?: string;
};

type ScrapeResult = {
  url: string;
  status?: number;
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  textPreview?: string;
  headings: string[];
  links: string[];
  error?: string;
};

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'student'}-${suffix}`;
}

function sanitizeUser(user: User) {
  return {
    ...user,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function issueToken(user: User) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      provider: user.authProvider,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function authMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token user' });
    }

    req.user = user;
    return next();
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Invalid token';
    return res.status(401).json({ error: reason });
  }
}

function normalizeUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isSameDomain(url: string, origin: URL) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === origin.hostname;
  } catch {
    return false;
  }
}

async function crawl(startUrl: string, options: { maxPages: number; maxDepth: number; sameDomain: boolean; }) {
  const { maxPages, maxDepth, sameDomain } = options;
  const origin = new URL(startUrl);
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const visited = new Set<string>();
  const pages: CrawlPage[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift();
    if (!current) break;
    const normalized = normalizeUrl(current.url);
    if (!normalized || visited.has(normalized)) continue;
    visited.add(normalized);

    let page: CrawlPage = { url: normalized, links: [] };

    try {
      const response = await axios.get(normalized, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
        maxRedirects: 5,
      });

      const contentType = response.headers['content-type'] || '';
      page.status = response.status;

      if (!contentType.includes('text/html')) {
        page.error = 'Skipped non-HTML response';
        pages.push(page);
        continue;
      }

      const $ = load(response.data);
      page.title = $('title').first().text().trim() || undefined;
      page.description = $('meta[name="description"]').attr('content') || undefined;

      const links: string[] = [];
      $('a[href]')
        .slice(0, 50)
        .each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          try {
            const absolute = new URL(href, normalized).toString();
            links.push(normalizeUrl(absolute) || absolute);
          } catch {
            return;
          }
        });

      page.links = Array.from(new Set(links)).slice(0, 50);
      pages.push(page);

      const nextDepth = current.depth + 1;
      if (nextDepth <= maxDepth) {
        for (const link of page.links) {
          if (!link) continue;
          if (sameDomain && !isSameDomain(link, origin)) continue;
          if (!visited.has(link)) {
            queue.push({ url: link, depth: nextDepth });
          }
        }
      }
    } catch (err) {
      page.error = err instanceof Error ? err.message : 'Request failed';
      pages.push(page);
    }
  }

  return pages;
}

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', docs: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.post('/auth/mock-login', (req, res) => {
  const { email, fullName, tumId = null, faculty = null, semester = null } = req.body ?? {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!fullName || typeof fullName !== 'string') {
    return res.status(400).json({ error: 'Full name is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let existing = users.find((u) => u.email === normalizedEmail);
  const normalizedSemester =
    semester === undefined || semester === null || semester === ''
      ? null
      : Number(semester);

  if (!existing) {
    existing = {
      id: randomUUID(),
      tumId: tumId ? String(tumId) : null,
      email: normalizedEmail,
      fullName: fullName.trim(),
      faculty: faculty ? String(faculty) : null,
      semester: Number.isNaN(normalizedSemester) ? null : normalizedSemester,
      profileSlug: slugify(fullName),
      authProvider: 'mock',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(existing);
  } else {
    existing.fullName = fullName.trim();
    existing.tumId = tumId ? String(tumId) : null;
    existing.faculty = faculty ? String(faculty) : null;
    existing.semester = Number.isNaN(normalizedSemester) ? null : normalizedSemester;
    existing.updatedAt = new Date();
  }

  const token = issueToken(existing);
  return res.json({ token, user: sanitizeUser(existing) });
});

app.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: sanitizeUser(req.user) });
});

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body ?? {};

  if (!url || typeof url !== 'string' || !isHttpUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  const target = normalizeUrl(url);
  if (!target) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const result: ScrapeResult = {
    url: target,
    headings: [],
    links: [],
  };

  try {
    const response = await axios.get(target, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    result.status = response.status;
    const contentType = response.headers['content-type'] || '';

    if (!contentType.includes('text/html')) {
      result.error = 'Skipped non-HTML response';
      return res.json(result);
    }

    const $ = load(response.data);
    const getMeta = (name: string) =>
      $(`meta[name="${name}"]`).attr('content') || $(`meta[property="${name}"]`).attr('content');

    result.title = $('title').first().text().trim() || undefined;
    result.description = getMeta('description') || undefined;
    result.ogTitle = getMeta('og:title') || undefined;
    result.ogDescription = getMeta('og:description') || undefined;
    result.ogImage = getMeta('og:image') || undefined;

    const headings: string[] = [];
    $('h1, h2, h3')
      .slice(0, 20)
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings.push(text);
      });
    result.headings = headings;

    const firstParagraph = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .find((text) => text.length > 40);
    if (firstParagraph) {
      result.textPreview = firstParagraph.slice(0, 280);
    }

    const links: string[] = [];
    $('a[href]')
      .slice(0, 50)
      .each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        try {
          const absolute = new URL(href, target).toString();
          links.push(normalizeUrl(absolute) || absolute);
        } catch {
          return;
        }
      });
    result.links = Array.from(new Set(links)).slice(0, 50);

    return res.json(result);
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Request failed';
    return res.status(500).json(result);
  }
});

app.post('/api/crawl', async (req, res) => {
  const { url, maxPages = 5, maxDepth = 1, sameDomain = true } = req.body ?? {};

  if (!url || typeof url !== 'string' || !isHttpUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  const safeMaxPages = Math.min(Math.max(Number(maxPages) || 1, 1), 20);
  const safeMaxDepth = Math.min(Math.max(Number(maxDepth) || 0, 0), 3);
  const enforceSameDomain = Boolean(sameDomain);

  try {
    const pages = await crawl(url, {
      maxPages: safeMaxPages,
      maxDepth: safeMaxDepth,
      sameDomain: enforceSameDomain,
    });

    res.json({
      startUrl: url,
      maxPages: safeMaxPages,
      maxDepth: safeMaxDepth,
      sameDomain: enforceSameDomain,
      pages,
    });
  } catch (err) {
    console.error('Crawl failed', err);
    return res.status(500).json({ error: 'Crawl failed' });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

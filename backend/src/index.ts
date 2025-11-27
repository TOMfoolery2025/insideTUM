import axios from 'axios';
import { load } from 'cheerio';
import cors from 'cors';
import express from 'express';
import { URL } from 'node:url';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const USER_AGENT = 'TomfooleryCrawler/1.0 (+https://example.com)';

const allowedOrigins = FRONTEND_ORIGIN.split(',').map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

type CrawlPage = {
  url: string;
  status?: number;
  title?: string;
  description?: string;
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

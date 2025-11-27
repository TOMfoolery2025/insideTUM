import { FormEvent, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlResult, setCrawlResult] = useState<{
    startUrl: string;
    maxPages: number;
    maxDepth: number;
    sameDomain: boolean;
    pages: Array<{
      url: string;
      status?: number;
      title?: string;
      description?: string;
      links: string[];
      error?: string;
    }>;
  } | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [maxDepth, setMaxDepth] = useState(1);
  const [sameDomain, setSameDomain] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = await res.json();
        setMessage(data.message ?? 'Backend responded');
        setError(null);
        setStatus('ok');
      })
      .catch((err) => {
        console.error('Health check failed', err);
        const reason = err instanceof Error ? err.message : 'Request failed';
        setError(reason);
        setMessage('Connect the backend to see the health check here.');
        setStatus('error');
      });

    return () => controller.abort();
  }, []);

  const handleCrawl = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!crawlUrl.trim()) {
      setCrawlError('Please enter a URL');
      return;
    }
    setCrawlLoading(true);
    setCrawlError(null);
    setCrawlResult(null);

    try {
      const response = await fetch(`${API_URL}/api/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: crawlUrl.trim(),
          maxPages,
          maxDepth,
          sameDomain,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      setCrawlResult(data);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Crawl failed';
      setCrawlError(reason);
    } finally {
      setCrawlLoading(false);
    }
  };

  return (
    <main className="app">
      <div className="card">
        <h1>Tomfoolery Hackathon</h1>
        <p>Vite + React + TypeScript boilerplate.</p>
        <div className="status">
          <span className={`status-dot ${status}`} aria-label={`Backend status: ${status}`} />
          <span className="label">Backend:</span>
          <span className="value">{message || 'Loading...'}</span>
        </div>
        {error ? (
          <div className="error">
            <strong>Error:</strong> {error}
            <div>API URL: {API_URL}</div>
          </div>
        ) : null}
        <div className="meta">
          <code>frontend</code> (Vercel)
          <code>backend</code> (Railway)
        </div>
      </div>
      <div className="card">
        <h2>Mini Crawler</h2>
        <p>Enter a URL to crawl. Limits keep it fast and polite.</p>
        <form className="crawl-form" onSubmit={handleCrawl}>
          <label className="field">
            <span>Start URL</span>
            <input
              type="url"
              placeholder="https://example.com"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              required
            />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Max pages (1–20)</span>
              <input
                type="number"
                min={1}
                max={20}
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span>Max depth (0–3)</span>
              <input
                type="number"
                min={0}
                max={3}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={sameDomain}
              onChange={(e) => setSameDomain(e.target.checked)}
            />
            <span>Stay on the same domain</span>
          </label>
          <button type="submit" disabled={crawlLoading}>
            {crawlLoading ? 'Crawling...' : 'Start crawl'}
          </button>
        </form>
        {crawlError ? (
          <div className="error">
            <strong>Crawl error:</strong> {crawlError}
          </div>
        ) : null}
        {crawlResult ? (
          <div className="crawl-results">
            <div className="meta-line">
              <code>{crawlResult.startUrl}</code>
              <span>
                pages: {crawlResult.pages.length}/{crawlResult.maxPages} • depth:{' '}
                {crawlResult.maxDepth} • same domain: {crawlResult.sameDomain ? 'yes' : 'no'}
              </span>
            </div>
            <div className="page-list">
              {crawlResult.pages.map((page, idx) => (
                <div className="page" key={`${page.url}-${idx}`}>
                  <div className="page-header">
                    <div className="page-url">{page.url}</div>
                    <div className="page-status">
                      {page.status ? `HTTP ${page.status}` : 'no status'}
                    </div>
                  </div>
                  {page.title ? <div className="page-title">{page.title}</div> : null}
                  {page.description ? (
                    <div className="page-desc">{page.description}</div>
                  ) : null}
                  {page.error ? <div className="page-error">Error: {page.error}</div> : null}
                  {page.links?.length ? (
                    <div className="links">
                      {page.links.slice(0, 10).map((link) => (
                        <code key={link}>{link}</code>
                      ))}
                      {page.links.length > 10 ? (
                        <span className="more">+{page.links.length - 10} more</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default App;

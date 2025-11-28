import { FormEvent, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'tum-mock-token';

type User = {
  id: string;
  tumId: string | null;
  email: string;
  fullName: string;
  faculty: string | null;
  semester?: number | null;
  profileSlug: string;
  authProvider: 'mock' | 'tum';
  createdAt: string;
  updatedAt: string;
};

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [statusOpen, setStatusOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tumId, setTumId] = useState('');
  const [faculty, setFaculty] = useState('');
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
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{
    url: string;
    status?: number;
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    textPreview?: string;
    headings?: string[];
    links?: string[];
    error?: string;
  } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchProfile = async (authToken: string) => {
    setProfileLoading(true);
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }
      const data = (await response.json()) as { user: User };
      setProfile(data.user);
      setAuthError(null);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Failed to fetch profile';
      setAuthError(reason);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (saved) {
      setToken(saved);
      fetchProfile(saved);
    }
  }, []);

  const handleLogin = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const safeEmail = email.trim();
    const safeName = fullName.trim();

    if (!safeEmail || !safeName) {
      setAuthError('Please enter your email and full name.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_URL}/auth/mock-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: safeEmail,
          fullName: safeName,
          tumId: tumId.trim() || null,
          faculty: faculty.trim() || null,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }

      const data = (await response.json()) as { token: string; user: User };
      setToken(data.token);
      setProfile(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Login failed';
      setAuthError(reason);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const handleRefreshProfile = () => {
    if (token) {
      fetchProfile(token);
    }
  };

  const handleCrawl = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const target = crawlUrl.trim() || 'https://example.com';
    setCrawlLoading(true);
    setCrawlError(null);
    setCrawlResult(null);

    try {
      const response = await fetch(`${API_URL}/api/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target,
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

  const handleScrape = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const target = scrapeUrl.trim() || 'https://example.com';
    setScrapeLoading(true);
    setScrapeError(null);
    setScrapeResult(null);

    try {
      const response = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      setScrapeResult(data);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Scrape failed';
      setScrapeError(reason);
    } finally {
      setScrapeLoading(false);
    }
  };

  return (
    <main className="app">
      <div className="layout">
        <div className="top-bar">
          <button
            type="button"
            className={`status-toggle ${statusOpen ? 'open' : ''}`}
            onClick={() => setStatusOpen((prev) => !prev)}
            aria-expanded={statusOpen}
          >
            <div className="status">
              <span className={`status-dot ${status}`} aria-label={`Backend status: ${status}`} />
              <span className="label">Backend</span>
              <span className="value">{message || 'Loading...'}</span>
            </div>
            <span className="chevron">{statusOpen ? '▴' : '▾'}</span>
          </button>
          <div className="theme-toggle">
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '🌞'}
            </button>
          </div>
        </div>
        {statusOpen ? (
          <div className="status-details">
            {error ? (
              <div className="error compact">
                <strong>Error:</strong> {error} • API: {API_URL}
              </div>
            ) : (
              <div className="ok compact">Healthy</div>
            )}
            <div className="meta compact">
              <code>frontend</code> (Vercel) • <code>backend</code> (Railway)
            </div>
          </div>
        ) : null}

        <div className="cards">
          <div className="card auth-card">
            <h2>Login with TUM (Prototype)</h2>
            <p>Mock login endpoint that mirrors the future OIDC shape. We issue a JWT and create the student profile.</p>
            <form className="crawl-form" onSubmit={handleLogin} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Full name</span>
                  <input
                    type="text"
                    placeholder="Mia Schmidt"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>TUM email</span>
                  <input
                    type="email"
                    placeholder="mia.schmidt@tum.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>TUM ID (optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. ga12abc"
                    value={tumId}
                    onChange={(e) => setTumId(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Faculty (optional)</span>
                  <input
                    type="text"
                    placeholder="CIT, SOM, MW, EDU…"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                  />
                </label>
              </div>
              <div className="auth-actions">
                <button type="submit" disabled={authLoading}>
                  {authLoading ? 'Signing in…' : 'Login with TUM (Prototype)'}
                </button>
                {token ? (
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleRefreshProfile}
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Refreshing…' : 'Refresh /me'}
                  </button>
                ) : null}
                {token ? (
                  <button type="button" className="ghost danger" onClick={handleLogout}>
                    Log out
                  </button>
                ) : null}
              </div>
            </form>
            {authError ? (
              <div className="error">
                <strong>Auth error:</strong> {authError}
              </div>
            ) : null}
            <div className="auth-status">
              <div className="status-row">
                <span className={`pill ${token ? 'pill-live' : 'pill-idle'}`}>
                  {token ? 'JWT stored' : 'No session'}
                </span>
                {token ? <code className="token-pill">{token.slice(0, 32)}…</code> : null}
              </div>
              {profileLoading ? (
                <div className="muted">Loading profile…</div>
              ) : profile ? (
                <div className="profile-grid">
                  <div>
                    <div className="muted">Name</div>
                    <strong>{profile.fullName}</strong>
                  </div>
                  <div>
                    <div className="muted">Email</div>
                    <code>{profile.email}</code>
                  </div>
                  <div>
                    <div className="muted">Faculty</div>
                    <span>{profile.faculty || '—'}</span>
                  </div>
                  <div>
                    <div className="muted">Profile slug</div>
                    <code>{profile.profileSlug}</code>
                  </div>
                  <div>
                    <div className="muted">Provider</div>
                    <span className="pill pill-live">{profile.authProvider}</span>
                  </div>
                  <div>
                    <div className="muted">Created</div>
                    <span>{new Date(profile.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="muted">Authenticate to see /me payload here.</div>
              )}
            </div>
          </div>

          <div className="card">
            <h2>Scrape a Page</h2>
            <p>Extract title, description, headings, and links from a single page.</p>
            <form className="crawl-form" onSubmit={handleScrape} noValidate>
              <label className="field">
                <span>URL</span>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                />
              </label>
              <button type="submit" disabled={scrapeLoading}>
                {scrapeLoading ? 'Scraping...' : 'Scrape'}
              </button>
            </form>
            {scrapeError ? (
              <div className="error">
                <strong>Scrape error:</strong> {scrapeError}
              </div>
            ) : null}
            {scrapeResult ? (
              <div className="scrape-results">
                <div className="page">
                  <div className="page-header">
                    <div className="page-url">{scrapeResult.url}</div>
                    <div className="page-status">
                      {scrapeResult.status ? `HTTP ${scrapeResult.status}` : 'no status'}
                    </div>
                  </div>
                  {scrapeResult.title ? (
                    <div className="page-title">{scrapeResult.title}</div>
                  ) : null}
                  {scrapeResult.description ? (
                    <div className="page-desc">{scrapeResult.description}</div>
                  ) : null}
                  <div className="meta-grid">
                    {scrapeResult.ogTitle ? (
                      <div>
                        <strong>OG Title:</strong> {scrapeResult.ogTitle}
                      </div>
                    ) : null}
                    {scrapeResult.ogDescription ? (
                      <div>
                        <strong>OG Description:</strong> {scrapeResult.ogDescription}
                      </div>
                    ) : null}
                    {scrapeResult.ogImage ? (
                      <div>
                        <strong>OG Image:</strong>{' '}
                        <code className="inline-code">{scrapeResult.ogImage}</code>
                      </div>
                    ) : null}
                    {scrapeResult.textPreview ? (
                      <div>
                        <strong>Preview:</strong> {scrapeResult.textPreview}
                      </div>
                    ) : null}
                  </div>
                  {scrapeResult.headings?.length ? (
                    <div className="headings">
                      <strong>Headings:</strong>
                      <ul>
                        {scrapeResult.headings.map((h, idx) => (
                          <li key={`${h}-${idx}`}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scrapeResult.links?.length ? (
                    <div className="links">
                      {scrapeResult.links.slice(0, 10).map((link) => (
                        <code key={link}>{link}</code>
                      ))}
                      {scrapeResult.links.length > 10 ? (
                        <span className="more">+{scrapeResult.links.length - 10} more</span>
                      ) : null}
                    </div>
                  ) : null}
                  {scrapeResult.error ? (
                    <div className="page-error">Error: {scrapeResult.error}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="card">
            <h2>Mini Crawler</h2>
            <p>Enter a URL to crawl. Limits keep it fast and polite.</p>
            <form className="crawl-form" onSubmit={handleCrawl} noValidate>
              <label className="field">
                <span>Start URL</span>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
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
        </div>
      </div>
    </main>
  );
}

export default App;

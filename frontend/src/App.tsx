import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = await res.json();
        setMessage(data.message ?? 'Backend responded');
      })
      .catch(() => {
        setMessage('Connect the backend to see the health check here.');
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="app">
      <div className="card">
        <h1>Tomfoolery Hackathon</h1>
        <p>Vite + React + TypeScript boilerplate.</p>
        <div className="status">
          <span className="label">Backend:</span>
          <span className="value">{message || 'Loading...'}</span>
        </div>
        <div className="meta">
          <code>frontend</code> on port <code>5173</code>
          <code>backend</code> default port <code>4000</code>
        </div>
      </div>
    </main>
  );
}

export default App;

import './App.css'

function App() {
  return (
    <main className="app-shell">
      <div className="app-shell__content">
        <section className="app-shell__hero" aria-labelledby="app-title">
          <span className="app-shell__badge">React + Vite Foundation</span>
          <h1 id="app-title" className="app-shell__title">
            OnlineForms Frontend
          </h1>
          <p className="app-shell__subtitle">
            A clean baseline for the public catalog, enrollment flow, and
            organization portal MVP.
          </p>
        </section>

        <section className="app-shell__panel" aria-label="Project status">
          <dl className="app-shell__meta">
            <div>
              <dt className="app-shell__meta-label">Build stack</dt>
              <dd className="app-shell__meta-value">React, Vite, TypeScript</dd>
            </div>
            <div>
              <dt className="app-shell__meta-label">Deployment target</dt>
              <dd className="app-shell__meta-value">S3 + CloudFront</dd>
            </div>
            <div>
              <dt className="app-shell__meta-label">Next milestone</dt>
              <dd className="app-shell__meta-value">Shared routes and app shell</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  )
}

export default App

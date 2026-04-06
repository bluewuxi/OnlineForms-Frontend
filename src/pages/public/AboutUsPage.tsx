import { Link } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'

const techStack = [
  { label: 'UI Framework', value: 'React 19 + TypeScript' },
  { label: 'Build Tool', value: 'Vite' },
  { label: 'Routing', value: 'React Router v6' },
  { label: 'Data Fetching', value: 'TanStack Query' },
  { label: 'Styling', value: 'Plain CSS with custom properties' },
  { label: 'Auth', value: 'AWS Cognito + mock-mode fallback' },
  { label: 'Testing', value: 'Vitest + Testing Library' },
  { label: 'Deployment', value: 'Static build, CDN-ready' },
]

const team = [
  {
    initials: 'RY',
    name: 'Ricky Yu',
    role: 'Developer',
    bio: 'Full-stack developer and the human driving force behind OnlineForms. Ricky designed the product vision, shaped every feature, and guided the AI collaborators through each build phase.',
  },
  {
    initials: 'CX',
    name: 'Codex',
    role: 'AI Engineer — OpenAI',
    bio: 'An AI coding assistant by OpenAI. Codex contributed to scaffolding, feature implementation, and working through complex logic across the early phases of the project.',
  },
  {
    initials: 'CC',
    name: 'Claude Code',
    role: 'AI Engineer — Anthropic',
    bio: 'An agentic coding assistant by Anthropic. Claude Code drove UI redesign phases F12 onwards, refactored components, authored CSS design systems, resolved conflicts, and managed the full git / PR workflow autonomously.',
  },
]

export function AboutUsPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Our Story"
        badgeOutlined
        variant="public"
        title="About OnlineForms"
        description="A modern online learning enrollment platform built by a developer and two AI collaborators — proving that human creativity and AI capability make a remarkable team."
      />

      {/* What we do */}
      <section className="content-panel">
        <h2>What is OnlineForms?</h2>
        <p>
          OnlineForms is an online learning enrollment platform that connects training providers
          with learners. Organisations can publish courses, manage enrollment windows, design
          custom enrollment forms, and track submissions — all through a clean, responsive web
          interface.
        </p>
        <p>
          Learners browse a public course catalog, view course details, and submit enrollment
          applications directly through the platform. No account required for public browsing —
          just find a course and apply.
        </p>
        <div className="button-row" style={{ marginTop: '1.5rem' }}>
          <Link to="/" className="button button--primary">
            Browse Courses
          </Link>
          <Link to="/contact" className="button button--outline">
            Get in Touch
          </Link>
        </div>
      </section>

      {/* Architecture */}
      <section className="content-panel">
        <h2>Architecture</h2>
        <p>
          OnlineForms is a single-page application with a clean separation between three
          portal contexts — <strong>Public</strong> (learners), <strong>Org</strong> (training
          providers), and <strong>Internal</strong> (platform admins). Each context has its own
          layout, navigation, and role-based access control.
        </p>
        <div className="detail-summary-grid" style={{ marginTop: '1.25rem' }}>
          {techStack.map((item) => (
            <div key={item.label} className="field-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '1.25rem' }}>
          The backend exposes a REST API consumed via TanStack Query. Authentication uses
          AWS Cognito for production and a built-in mock-mode for local development — so the
          entire app works offline with no external dependencies.
        </p>
      </section>

      {/* How it was built */}
      <section className="content-panel">
        <h2>Built with AI</h2>
        <p>
          OnlineForms is one of the first production-grade applications built almost entirely
          through AI pair-programming. The developer wrote zero boilerplate by hand — instead,
          each feature was described in plain language and the AI collaborators turned it into
          working, tested, committed code.
        </p>
        <p>
          The workflow evolved across phases:
        </p>
        <ul className="hero-card__list" style={{ marginTop: '0.75rem', lineHeight: '1.9' }}>
          <li><strong>Phases F1–F10</strong> — Core data models, API integration, org portal, internal portal, and enrollment flow built with Codex.</li>
          <li><strong>Phase F11</strong> — UI improvements and public portal polish.</li>
          <li><strong>Phase F12</strong> — Full visual redesign (design tokens, sidebar navigation, card redesign, responsive pass) driven by Claude Code, informed by Nano Banana mock screens.</li>
          <li><strong>Ongoing</strong> — Architecture decisions, PR reviews, conflict resolution, and test maintenance — all handled by the AI pair autonomously.</li>
        </ul>
      </section>

      {/* Team */}
      <section className="content-panel">
        <h2>Meet the Team</h2>
        <p>Three collaborators. One with a heartbeat.</p>
        <div className="content-card-grid" style={{ marginTop: '1.25rem' }}>
          {team.map((member) => (
            <div key={member.name} className="state-card" style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  className="org-activity-feed__avatar"
                  style={{ width: '3rem', height: '3rem', fontSize: '0.9rem', flexShrink: 0 }}
                >
                  {member.initials}
                </span>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--color-text)' }}>
                    {member.name}
                  </strong>
                  <span className="page-hero__badge" style={{ marginTop: '0.3rem' }}>
                    {member.role}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: '1.65', fontSize: '0.95rem' }}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

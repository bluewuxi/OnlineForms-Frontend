import { Link } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'

const portalRoles = [
  {
    portal: 'Public',
    role: 'Guest',
    description: 'Browse the course catalog, view course details, and submit enrollment applications. No account required.',
    badge: 'No login required',
  },
  {
    portal: 'Org',
    role: 'Org Viewer',
    description: 'Read-only access to all data within a tenant — courses, submissions, branding, and audit history. Suited for auditors and external reviewers.',
    badge: 'org_viewer',
  },
  {
    portal: 'Org',
    role: 'Org Editor',
    description: 'Create and edit courses, design enrollment form schemas, and manage uploaded assets. Cannot change tenant settings or update submission statuses.',
    badge: 'org_editor',
  },
  {
    portal: 'Org',
    role: 'Org Admin',
    description: 'Full org-level control — everything an editor can do, plus updating submission statuses, managing tenant branding and settings, and inviting new team members.',
    badge: 'org_admin',
  },
  {
    portal: 'Internal',
    role: 'Platform Support',
    description: 'Cross-tenant support access. Can read org data within any specific tenant to assist with troubleshooting. Cannot write data or access internal management endpoints.',
    badge: 'platform_support',
  },
  {
    portal: 'Internal',
    role: 'Internal Admin',
    description: 'Platform operator access. Creates and manages tenants, provisions and manages users, assigns roles. Operates without a tenant context.',
    badge: 'internal_admin',
  },
]

const frontendStack = [
  { label: 'UI Framework', value: 'React 19 + TypeScript' },
  { label: 'Build Tool', value: 'Vite' },
  { label: 'Routing', value: 'React Router v6' },
  { label: 'Data Fetching', value: 'TanStack Query' },
  { label: 'Styling', value: 'Plain CSS with custom properties' },
  { label: 'Testing', value: 'Vitest + Testing Library' },
  { label: 'Deployment', value: 'Static build, CDN-ready' },
]

const backendStack = [
  { label: 'Runtime', value: 'Node.js + TypeScript' },
  { label: 'Compute', value: 'AWS Lambda (serverless)' },
  { label: 'API', value: 'AWS API Gateway (REST)' },
  { label: 'Database', value: 'AWS DynamoDB (single-table design)' },
  { label: 'Storage', value: 'AWS S3 (asset uploads)' },
  { label: 'Auth', value: 'AWS Cognito (JWT)' },
  { label: 'Infrastructure', value: 'AWS SAM (CloudFormation)' },
  { label: 'Monitoring', value: 'CloudWatch dashboards + alarms' },
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

      {/* Roles & Access */}
      <section className="content-panel">
        <h2>Roles &amp; Access</h2>
        <p>
          OnlineForms uses a role-based access control system across three portal contexts.
          Each role carries a precise set of permissions — no role inherits unnecessary
          write access by default.
        </p>
        <div className="content-card-grid" style={{ marginTop: '1.25rem' }}>
          {portalRoles.map((item) => (
            <div key={item.badge} className="state-card" style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{item.role}</strong>
                <span className="page-hero__badge" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {item.badge}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                {item.portal} portal
              </span>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: '1.65', fontSize: '0.93rem' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="content-panel">
        <h2>Architecture</h2>
        <p>
          OnlineForms is a full-stack serverless application. The frontend is a single-page
          app with three portal contexts — <strong>Public</strong> (learners),{' '}
          <strong>Org</strong> (training providers, with viewer / editor / admin roles),
          and <strong>Internal</strong> (platform operators and support staff) — each with its
          own layout, navigation, and role-based access control. The backend is a serverless
          REST API deployed on AWS, with DynamoDB as the primary data store and Cognito
          handling authentication.
        </p>

        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.25rem', fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Frontend
        </h3>
        <div className="detail-summary-grid">
          {frontendStack.map((item) => (
            <div key={item.label} className="field-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.25rem', fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Backend
        </h3>
        <div className="detail-summary-grid">
          {backendStack.map((item) => (
            <div key={item.label} className="field-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
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

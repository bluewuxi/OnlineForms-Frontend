import { Link } from 'react-router-dom'
import { PageHero } from '../../components/layout/PageHero'

export function ContactPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Get in Touch"
        badgeOutlined
        variant="public"
        title="Contact Us"
        description="Have a question about OnlineForms, or interested in using the platform for your organisation? We'd love to hear from you."
      />

      <div className="editorial-split">
        {/* Contact card */}
        <section className="content-panel">
          <h2>Contact Details</h2>
          <p>
            Reach out directly and we'll get back to you as soon as possible.
          </p>

          <div className="detail-summary-grid" style={{ marginTop: '1.25rem' }}>
            <div className="field-card">
              <span>Name</span>
              <strong>Ricky Yu</strong>
            </div>
            <div className="field-card">
              <span>Role</span>
              <strong>Developer &amp; Project Lead</strong>
            </div>
            <div className="field-card" style={{ gridColumn: 'span 2' }}>
              <span>Email</span>
              <strong>
                <a
                  href="mailto:ricky.nz@yahoo.com"
                  style={{ color: 'var(--color-accent)', textDecoration: 'underline', textUnderlineOffset: '0.2em' }}
                >
                  ricky.nz@yahoo.com
                </a>
              </strong>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: '1.75rem' }}>
            <a href="mailto:ricky.nz@yahoo.com" className="button button--primary">
              Send Email
            </a>
            <Link to="/about" className="button button--outline">
              About the Project
            </Link>
          </div>
        </section>

        {/* What to include */}
        <section className="content-panel">
          <h2>What to Include</h2>
          <p>To help us respond quickly, please include:</p>
          <ul className="hero-card__list" style={{ lineHeight: '2' }}>
            <li>Your name and organisation</li>
            <li>What you'd like to discuss (enrolment, demo, integration, feedback)</li>
            <li>Your preferred contact method and timezone</li>
          </ul>

          <div style={{ marginTop: '1.5rem', padding: '1rem 1.15rem', borderRadius: 'var(--radius-panel)', background: 'var(--color-bg-soft)', borderLeft: '3px solid var(--color-accent)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.65' }}>
              <strong style={{ color: 'var(--color-text)' }}>Response time:</strong> We aim to reply within one business day. For urgent matters, mention it in the subject line.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

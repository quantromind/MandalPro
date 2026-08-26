import { Link } from 'react-router-dom';

/*
 * =========================================================================
 * MANDALPRO - TERMS & CONDITIONS
 * Public route: /terms-and-conditions (Zero auth, zero tenant context required)
 * Entity: Quantromind Pvt. Ltd.
 * Address: Wakad, Pimpri-Chinchwad, Maharashtra 411057
 * Contact: contact@quantromind.com
 * =========================================================================
 */

const TermsAndConditions = () => {
  return (
    <div className="legal-page">
      {/* ── Top Navigation Bar ── */}
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-brand">
            <img src="/logo.png" alt="Apla Mandal Logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <span>Apla<strong>Mandal</strong></span>
          </Link>

          <nav className="legal-nav-links">
            <Link to="/privacy-policy" className="legal-nav-link">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="legal-nav-link active">Terms &amp; Conditions</Link>
            <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* ── Main Document Container ── */}
      <main className="legal-container">
        <div className="legal-card">
          <div className="legal-badge">Legal Document</div>
          <h1 className="legal-title">Terms &amp; Conditions</h1>
          <p className="legal-meta">
            Last updated: <strong>August 26, 2026</strong>
          </p>

          <div className="legal-intro">
            <p>
              These terms govern use of the MandalPro platform, operated by <strong>Quantromind Pvt. Ltd.</strong> By creating an account, you agree to them.
            </p>
          </div>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. The service</h2>
              <p>
                MandalPro is a record-keeping and workflow tool for mandals &mdash; donation collection, digital receipts, expense approval, budgeting, event and volunteer management, and related AI-assisted features. MandalPro is not an accounting firm, chartered accountant, or legal advisor; using it doesn&apos;t substitute for professional tax, audit, or compliance advice.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Accounts and eligibility</h2>
              <p>
                You must be an authorized representative of the mandal you register, and you&apos;re responsible for the accuracy of data entered and for keeping your login credentials secure. Feature access is governed by your assigned role (President, Treasurer, Secretary, or Volunteer).
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Subscriptions and billing</h2>
              <p>
                Plans (Free/Pro/Premium/Enterprise) and their limits are described in-app. Paid plans renew automatically unless cancelled before the renewal date; a failed payment moves your account to a read-only grace period rather than immediate loss of access. If you downgrade, we&apos;ll show exactly what data or features you&apos;ll lose and offer an export first. Subscriptions are billed in advance on a monthly or annual basis. You may cancel your subscription at any time through account settings, and access remains active until the end of your prepaid period. Refund requests submitted within 7 days of payment are reviewed on a case-by-case basis by reaching out to support.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. AI features</h2>
              <p>
                Bill OCR, categorization, forecasting, anomaly detection, and the financial assistant are advisory tools. They propose; they never approve, submit, cancel, or reverse a financial transaction on their own &mdash; a human user must confirm every financial or destructive action. AI outputs may be inaccurate and should be reviewed before you rely on them.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Your responsibilities</h2>
              <p>
                You agree to use MandalPro only for lawful donation and event management, keep records accurate, and not use the platform to launder funds, misrepresent donations, or violate any law applicable to your organization (including, where relevant, rules on receiving foreign contributions).
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Data and records</h2>
              <p>
                Receipts and reports reflect the data your mandal enters; we don&apos;t independently verify donor identities or fund sources. Your mandal remains responsible for its own statutory filings and compliance.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Limitation of liability</h2>
              <p>
                MandalPro is provided &ldquo;as is.&rdquo; To the extent permitted by law, <strong>Quantromind Pvt. Ltd.</strong> isn&apos;t liable for indirect or consequential losses, or for decisions made on AI-generated suggestions that a human didn&apos;t independently verify.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Termination</h2>
              <p>
                We may suspend accounts for non-payment (after the grace period) or violation of these terms. You can request an export of your mandal&apos;s data before or at termination.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Governing law</h2>
              <p>
                These terms are governed by the laws of India; disputes are subject to the exclusive jurisdiction of the courts of Pune, Maharashtra.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Contact</h2>
              <p>
                <strong>Quantromind Pvt. Ltd.</strong><br />
                <strong>Address:</strong> Wakad, Pimpri-Chinchwad, Maharashtra 411057, India<br />
                <strong>Email:</strong>{' '}
                <a href="mailto:contact@quantromind.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  contact@quantromind.com
                </a>
              </p>
            </section>
          </div>

          {/* ── Document Footer ── */}
          <div className="legal-doc-footer">
            <div className="legal-links">
              <span>Related:</span>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span>&bull;</span>
              <Link to="/login">MandalPro Login</Link>
            </div>
            <p className="legal-copyright">&copy; {new Date().getFullYear()} Quantromind Pvt. Ltd. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;

import { Link } from 'react-router-dom';

/*
 * =========================================================================
 * APLA MANDAL - PRIVACY POLICY
 * Public route: /privacy-policy (Zero auth, zero tenant context required)
 * Entity: Quantromind Pvt. Ltd.
 * Address: Wakad, Pimpri-Chinchwad, Maharashtra 411057
 * Contact: contact@quantromind.com
 * =========================================================================
 */

const PrivacyPolicy = () => {
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
            <Link to="/privacy-policy" className="legal-nav-link active">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="legal-nav-link">Terms &amp; Conditions</Link>
          </nav>
        </div>
      </header>

      {/* ── Main Document Container ── */}
      <main className="legal-container">
        <div className="legal-card">
          <div className="legal-badge">Legal Document</div>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-meta">
            Last updated: <strong>August 26, 2026</strong>
          </p>

          <div className="legal-intro">
            <p>
              <strong>Quantromind Pvt. Ltd.</strong> (&ldquo;Apla Mandal&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the Apla Mandal platform for managing donation collection, receipts, expenses, events, and related activities for community organizations (&ldquo;mandals&rdquo;). This policy explains what data we collect, how we use it, and the choices available to you.
            </p>
          </div>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Data we collect</h2>
              <ul>
                <li><strong>Account data:</strong> name, mobile number, email, and OTP verification records.</li>
                <li><strong>Mandal/organization data:</strong> mandal name, logo, address, contact details, and bank/UPI details provided by the mandal admin.</li>
                <li><strong>Transaction data:</strong> donor names, phone numbers, donation amounts, payment mode, and expense records entered by authorized users of a mandal.</li>
                <li>
                  <strong>Payment data:</strong> processed by our authorized payment gateway partners (Razorpay / Cashfree); we store transaction references and status, not full card numbers.
                </li>
                <li><strong>Documents:</strong> bills, receipts, and verification documents uploaded for storage or AI processing (e.g. OCR).</li>
                <li><strong>Device and usage data:</strong> app version, device type, log data, crash reports.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>2. How we use it</h2>
              <ul>
                <li>To operate the core service: receipts, expense approvals, budgets, events, reporting.</li>
                <li>To power AI features &mdash; bill OCR, expense categorization, budget forecasting, anomaly flags, and the financial assistant &mdash; all scoped to your mandal&apos;s own data only, none of which take a financial or destructive action without your explicit confirmation.</li>
                <li>To send receipts and notifications via WhatsApp, SMS, or email.</li>
                <li>To process payments and manage subscriptions.</li>
                <li>To detect fraud, abuse, or anomalous activity.</li>
                <li>To comply with legal, tax, and audit obligations.</li>
              </ul>
              <div className="legal-highlight">
                We do not sell personal data and do not use it for third-party advertising &mdash; Apla Mandal does not carry ads.
              </div>
            </section>

            <section className="legal-section">
              <h2>3. Who we share it with</h2>
              <ul>
                <li>Payment gateway providers (Razorpay / Cashfree), to process transactions securely.</li>
                <li>Messaging providers (WhatsApp Business API, SMS/email), to deliver receipts and notifications.</li>
                <li>Cloud hosting and storage providers, to run the service.</li>
                <li>Law enforcement or regulators, only where legally required.</li>
              </ul>
              <p>
                Every mandal&apos;s data is isolated from every other mandal&apos;s; cross-tenant access isn&apos;t possible by design.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Data retention</h2>
              <p>
                Transaction and receipt records are retained while your account is active and for the additional period required by applicable accounting, tax, and audit rules. You can request deletion of personal data not subject to a retention obligation.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Your rights</h2>
              <p>
                You can request access to, correction of, or deletion of your personal data, subject to our record-keeping obligations for financial data. Contact our Grievance Officer at <a href="mailto:contact@quantromind.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>contact@quantromind.com</a> to exercise these rights.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Security</h2>
              <p>
                Access is role-based (President/Treasurer/Secretary/Volunteer), financial actions are logged in an audit trail, and financial records are never hard-deleted &mdash; only reversed and logged.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Children</h2>
              <p>
                Apla Mandal is not directed at children under 18 and we do not knowingly collect their data.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Regulatory note</h2>
              <p>
                This policy is drafted with reference to India&apos;s Digital Personal Data Protection Act, 2023 and its Rules notified in November 2025, which are being phased in through 2027. We&apos;ll update this policy as those obligations come into force.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Changes to this policy</h2>
              <p>
                We&apos;ll update the &ldquo;Last updated&rdquo; date above and notify mandal admins in-app of material changes.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Contact</h2>
              <p>
                <strong>Questions about this policy:</strong>{' '}
                <a href="mailto:contact@quantromind.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  contact@quantromind.com
                </a>
              </p>
              <p>
                <strong>Grievance Officer:</strong> Grievance Officer, Quantromind Pvt. Ltd.<br />
                <strong>Email:</strong> <a href="mailto:contact@quantromind.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>contact@quantromind.com</a><br />
                <strong>Address:</strong> Wakad, Pimpri-Chinchwad, Maharashtra 411057, India
              </p>
            </section>
          </div>

          {/* ── Document Footer ── */}
          <div className="legal-doc-footer">
            <div className="legal-links">
              <span>Related:</span>
              <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            </div>
            <p className="legal-copyright">&copy; {new Date().getFullYear()} Quantromind Pvt. Ltd. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'mr' ? 'en' : 'mr');
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isMr = language === 'mr';

  const stats = [
    { num: '१००+', numEn: '100+', labelMr: 'नोंदणीकृत मंडळे व समित्या', labelEn: 'Registered Mandals & Trusts', icon: '🏛️' },
    { num: '२,०००+', numEn: '2,000+', labelMr: 'WhatsApp डिजिटल पावत्या', labelEn: 'WhatsApp Digital Receipts', icon: '🧾' },
    { num: '₹१ कोटी+', numEn: '₹1 Cr+', labelMr: 'सुरक्षित जमा-खर्च हिशोब', labelEn: 'Transparent Managed Funds', icon: '💰' },
    { num: '१००%', numEn: '100%', labelMr: 'पारदर्शक व ऑडिट-रेडी', labelEn: 'Transparent & Audit-Ready', icon: '🛡️' }
  ];

  const features = [
    {
      icon: '🧾',
      color: '#F97316',
      titleMr: 'WhatsApp डिजिटल देणगी पावत्या',
      titleEn: 'Instant WhatsApp Digital Receipts',
      descMr: 'देणगी किंवा वर्गणी स्वीकारताच देणगीदाराला मंडळाच्या अधिकृत लोगो, शिक्का व क्यूआर कोडसह थेट WhatsApp वर पावती पाठवा.',
      descEn: 'Generate instant receipts with custom Mandal logo, seal & QR code, delivered directly to the donor via WhatsApp.'
    },
    {
      icon: '💸',
      color: '#EF4444',
      titleMr: 'पारदर्शक खर्च व ऑनलाइन मंजुऱ्या',
      titleEn: 'Expense & Approval Workflows',
      descMr: 'खर्चाच्या बिलांचे फोटो जोडा. खजिनदार व अध्यक्षांकडून डिजिटल मंजुरी घ्या. प्रत्येक पैशाचा पारदर्शक हिशोब ठेवा.',
      descEn: 'Upload expense bills and receipts, request instant digital approvals from President & Treasurer, and eliminate audit leaks.'
    },
    {
      icon: '👥',
      color: '#3B82F6',
      titleMr: 'कार्यकारिणी व डिजिटल आयडी कार्ड',
      titleEn: 'Team Directory & Digital ID Cards',
      descMr: 'मंडळाचे पदाधिकारी, सदस्य व स्वयंसेवकांची यादी सांभाळा. एका क्लिकवर फोटोसहित अधिकृत डिजिटल ओळखपत्रे तयार करा.',
      descEn: 'Manage committee members & volunteers with custom roles. Generate and print official photo ID badges in one click.'
    },
    {
      icon: '🎪',
      color: '#8B5CF6',
      titleMr: 'उत्सव, कार्यक्रम व साहित्य साठा',
      titleEn: 'Events, Schedule & Inventory',
      descMr: 'गणेशोत्सव, नवरात्री, शिवजयंतीचे नियोजन करा. मंडप, लायटिंग व पूजा साहित्याची नोंद ठेवा जेणेकरून नुकसान टाळता येईल.',
      descEn: 'Plan festival schedules, assign tasks to volunteers, and track sound, lighting and decoration assets with asset management.'
    },
    {
      icon: '💬',
      color: '#10B981',
      titleMr: 'समिती लाइव्ह संवाद व तातडीच्या सूचना',
      titleEn: 'Committee Live Chat & Notices',
      descMr: 'मंडळातील पदाधिकाऱ्यांशी थेट अ‍ॅपमध्ये चर्चा करा. बैठकीचे इतिवृत्त, महत्त्वाचे ठराव व अपडेट्स एकाच सुरक्षित ठिकाणी मिळवा.',
      descEn: 'Dedicated secure group chatroom for committee members to share notices, meeting decisions, and urgent festival announcements.'
    },
    {
      icon: '📑',
      color: '#0EA5E9',
      titleMr: 'सीए व ऑडिट रेडी आर्थिक अहवाल',
      titleEn: 'CA & Audit-Ready Financial Reports',
      descMr: 'धर्मादाय आयुक्त व सीए साठी आवश्यक असलेले जमा-खर्च पत्रक, ताळेबंद व वर्गणी यादी एका क्लिकवर PDF व Excel मध्ये डाऊनलोड करा.',
      descEn: 'One-click export of Income-Expenditure balance sheets, donor rosters, and expense books in PDF and Excel format.'
    }
  ];

  const festivals = [
    { icon: '🐘', nameMr: 'गणेशोत्सव मंडळे', nameEn: 'Ganesh Utsav Mandals' },
    { icon: '🪔', nameMr: 'नवरात्री व गरबा मंडळे', nameEn: 'Navratri & Garba Groups' },
    { icon: '🚩', nameMr: 'शिवजयंती व जयंती समित्या', nameEn: 'Shiv Jayanti & Utsavs' },
    { icon: '✨', nameMr: 'दिवाळी व सामाजिक समित्या', nameEn: 'Diwali & Social Trusts' },
    { icon: '🏢', nameMr: 'गृहनिर्माण संस्था (Housing Societies)', nameEn: 'Housing Society Committees' },
    { icon: '🤝', nameMr: 'धार्मिक व चॅरिटेबल संस्था', nameEn: 'Charitable NGOs & Trusts' }
  ];

  const plans = [
    {
      id: 'silver',
      nameMr: 'सिल्व्हर योजना (Silver Plan)',
      nameEn: 'Silver Plan',
      badgeMr: '⚡ परवडणारी योजना',
      badgeEn: '⚡ AFFORDABLE',
      priceAnnual: '₹१९९',
      priceMonthly: '₹१९९',
      periodMr: '/महिना',
      periodEn: '/month',
      color: '#0EA5E9',
      popular: false,
      featuresMr: [
        '१ मंडळ संपूर्ण व्यवस्थापन',
        '१५ समिती सदस्य व स्वयंसेवक (Member Limit)',
        'अमर्यादित WhatsApp डिजिटल पावत्या',
        'खर्च आणि अंदाजपत्रक (Budget) ट्रॅकिंग',
        'समिती लाइव्ह ग्रुप चॅट',
        'डिजिटल सदस्य ओळखपत्रे (ID Cards)',
        'उत्सव ताळेबंद अहवाल'
      ],
      featuresEn: [
        '1 Complete Mandal Management',
        'Up to 15 Committee Members & Volunteers',
        'Unlimited WhatsApp Digital Receipts',
        'Expense & Budget Tracking',
        'Committee Live Chatroom',
        'Digital Member ID Card Generator',
        'Festival Balance Sheet'
      ],
      ctaMr: 'सिल्व्हर योजना निवडा (₹199)',
      ctaEn: 'Choose Silver Plan (₹199)'
    },
    {
      id: 'gold',
      nameMr: 'गोल्ड मेंबरशिप (Gold Membership)',
      nameEn: 'Gold Membership',
      badgeMr: '🔥 सर्वाधिक पसंती',
      badgeEn: '🔥 MOST POPULAR',
      priceAnnual: '₹२९९',
      priceMonthly: '₹२९९',
      periodMr: '/महिना',
      periodEn: '/month',
      color: '#F59E0B',
      popular: true,
      featuresMr: [
        '२ मंडळे / शाखा व्यवस्थापन',
        '२५ समिती सदस्य व स्वयंसेवक (Member Limit)',
        'अधिकृत शिक्का व लोगो असलेली WhatsApp पावती',
        'खर्च मंजुरी वर्कफ्लो व बिलांचे फोटो साठवणूक',
        'सीए ऑडिट-रेडी Excel व PDF ताळेबंद अहवाल',
        'व्हेरिफाइड मंडळ ट्रस्ट बॅज',
        '२४/७ प्राधान्य WhatsApp सहाय्य',
        'सर्व प्रगत फीचर्स समाविष्ट'
      ],
      featuresEn: [
        '2 Mandals / Branches',
        'Up to 25 Committee Members & Volunteers',
        'Official Logo & Seal Branded WhatsApp Receipts',
        'Expense Approval Workflow with Bill Photos',
        'CA & Audit Ready PDF/Excel Exports',
        'Verified Mandal Trust Badge',
        '24/7 Priority Support',
        'All Advanced Features Included'
      ],
      ctaMr: 'गोल्ड मेंबरशिप निवडा (₹299)',
      ctaEn: 'Choose Gold Membership (₹299)'
    }
  ];

  const testimonials = [
    {
      name: 'संजय कदम (अध्यक्ष)',
      nameEn: 'Sanjay Kadam (President)',
      mandalMr: 'श्री गणेश मित्र मंडळ, पुणे',
      mandalEn: 'Shree Ganesh Mitra Mandal, Pune',
      textMr: 'पूर्वी वह्यांमध्ये वर्गणी नोंदवणे आणि पावत्या फाडणे खूप त्रासाचे होते. आपला मंडळ (Apla Mandal) मुळे कार्यकर्त्यांनी थेट मोबाईलवरून पावत्या फाडल्या आणि देणगीदारांना लगेच WhatsApp वर पावती मिळाली. जमा-खर्चाचा हिशोब पारदर्शक झाला!',
      textEn: 'Recording vargani in physical paper books was exhausting. With Apla Mandal, our volunteers generated receipts from their phones and donors instantly received them on WhatsApp. Total transparency!'
    },
    {
      name: 'अमोल पाटील (खजिनदार)',
      nameEn: 'Amol Patil (Treasurer)',
      mandalMr: 'नवतरुण उत्सव समिती, ठाणे',
      mandalEn: 'Navtarun Utsav Samiti, Thane',
      textMr: 'खर्चाच्या बिलांचे फोटो अपलोड करून मंजुरी घेण्याची सोय अत्यंत उपयुक्त ठरली. उत्सवानंतर सीए ऑडिटसाठी अहवाल फक्त ५ मिनिटांत PDF मध्ये तयार झाला. सर्व मंडळांनी हे अ‍ॅप नक्की वापरावे.',
      textEn: 'Uploading bill photos and getting digital approvals saved us so much time. After the festival, CA audit reports were ready in just 5 minutes in PDF format. Highly recommended!'
    },
    {
      name: 'प्रशांत मोहिते (कार्यवाह)',
      nameEn: 'Prashant Mohite (Secretary)',
      mandalMr: 'शिवशक्ती सार्वजनिक मंडळ, कोल्हापूर',
      mandalEn: 'Shivshakti Sarvajanik Mandal, Kolhapur',
      textMr: 'मंडळातील कार्यकर्त्यांना डिजिटल ओळखपत्रे देणे आणि चॅटवर सूचना देणे खूप सोपे झाले. मराठी भाषेत असल्याने प्रत्येक सदस्याला वापरणे सहज शक्य झाले.',
      textEn: 'Creating digital member ID cards and sending announcements in Marathi made our entire volunteer team proud and organized.'
    }
  ];

  const faqs = [
    {
      qMr: 'Apla Mandal अ‍ॅप वापरणे किती सोपे आहे?',
      qEn: 'How easy is it to use Apla Mandal?',
      aMr: 'अतिशय सोपे! हे संपूर्ण अ‍ॅप मराठी व इंग्रजी दोन्ही भाषांमध्ये उपलब्ध आहे. स्मार्टफोन वापरणारा कोणताही कार्यकर्ता किंवा पदाधिकारी अवघ्या २ मिनिटांत हे अ‍ॅप वापरू शकतो.',
      aEn: 'Extremely easy! The platform is available in both Marathi and English. Any committee member with a smartphone can start issuing receipts and managing accounts within 2 minutes.'
    },
    {
      qMr: 'देणगीदारांना WhatsApp वर पावती कशी मिळते?',
      qEn: 'How do donors receive receipts on WhatsApp?',
      aMr: 'तुम्ही देणगीदाराचे नाव, मोबाईल नंबर व रक्कम टाकून जशी पावती सेव्ह करता, तशी थेट एका क्लिकवर त्यांच्या WhatsApp नंबरवर अधिकृत शिक्का व लोगो असलेली डिजिटल पावती जाते.',
      aEn: 'When you enter the donor name, mobile number, and amount, a single tap sends an official branded digital receipt with mandal seal directly to their WhatsApp number.'
    },
    {
      qMr: 'आमच्या मंडळाचा हिशोब व डेटा सुरक्षित राहील का?',
      qEn: 'Is our Mandal financial data safe and secure?',
      aMr: 'होय, १००%! तुमचा संपूर्ण डेटा एन्क्रिप्टेड क्लाउड सर्व्हरवर सुरक्षित साठवला जातो. फक्त तुमच्या अधिकृत मंडळाचे पदाधिकारीच हा डेटा पाहू आणि संपादित करू शकतात.',
      aEn: 'Yes, 100%! All data is safely stored on bank-grade encrypted cloud servers. Only your authorized committee members can access or manage the records.'
    },
    {
      qMr: 'आम्ही उत्सवाचा जमा-खर्च अहवाल (Audit Report) डाऊनलोड करू शकतो का?',
      qEn: 'Can we download full audit & balance sheet reports?',
      aMr: 'होय! उत्सवाच्या शेवटी किंवा कधीही एका क्लिकवर उत्पन्न-खर्च पत्रक, देणगीदारांची संपूर्ण यादी आणि खर्चाचा तपशील Excel किंवा PDF मध्ये मिळतो, जो थेट सीए किंवा धर्मादाय आयुक्तांकडे सादर करता येतो.',
      aEn: 'Yes! At any time, you can generate clean Income-Expenditure balance sheets, donor lists, and expense logs in Excel or PDF format, ready for CA and Charity Commissioner audits.'
    }
  ];

  return (
    <div className="landing-page-root">
      {/* ── 1. Top Navigation Bar ── */}
      <header className="landing-header">
        <div className="landing-header-container">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="landing-logo"
          >
            <img
              src="/logo.png"
              alt="Apla Mandal Logo"
              className="landing-logo-img"
            />
            <div>
              <div className="landing-logo-title">
                Apla<span>Mandal</span>
              </div>
              <div className="landing-logo-subtitle">
                Apla Mandal Platform
              </div>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="landing-desktop-nav">
            <a href="#features" className="landing-nav-link">
              {isMr ? 'वैशिष्ट्ये' : 'Features'}
            </a>
            <a href="#festivals" className="landing-nav-link">
              {isMr ? 'मंडळे' : 'Communities'}
            </a>
            <a href="#pricing" className="landing-nav-link">
              {isMr ? 'योजना' : 'Pricing'}
            </a>
            <a href="#reviews" className="landing-nav-link">
              {isMr ? 'विश्वास' : 'Reviews'}
            </a>
            <a href="#faq" className="landing-nav-link">
              {isMr ? 'प्रश्नोत्तरे' : 'FAQ'}
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="landing-header-actions">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="landing-lang-btn"
              title={isMr ? 'Switch to English' : 'मराठीत बदला'}
            >
              <span>🌐</span>
              <span>{isMr ? 'EN' : 'मराठी'}</span>
            </button>

            {user ? (
              <button
                className="landing-cta-btn"
                onClick={() => navigate('/')}
              >
                📊 {isMr ? 'डॅशबोर्ड' : 'Dashboard'}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="landing-login-btn"
                >
                  {isMr ? 'लॉगिन' : 'Login'}
                </Link>

                <Link
                  to="/register"
                  className="landing-cta-btn"
                >
                  🚀 {isMr ? 'नोंदणी करा' : 'Get Started'}
                </Link>
              </>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              className="landing-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7"></line>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="17" x2="20" y2="17"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div
          className="landing-mobile-drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="landing-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="landing-drawer-header">
              <div className="landing-logo">
                <img
                  src="/logo.png"
                  alt="Apla Mandal Logo"
                  className="landing-logo-img"
                />
                <div className="landing-logo-title">
                  Apla<span>Mandal</span>
                </div>
              </div>
              <button
                className="landing-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            <div className="landing-drawer-nav">
              <a
                href="#features"
                className="landing-drawer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>⚡</span>
                <span>{isMr ? 'प्रमुख वैशिष्ट्ये' : 'Features'}</span>
              </a>
              <a
                href="#festivals"
                className="landing-drawer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>🚩</span>
                <span>{isMr ? 'मंडळे व समित्या' : 'Communities'}</span>
              </a>
              <a
                href="#pricing"
                className="landing-drawer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>💎</span>
                <span>{isMr ? 'सदस्यत्व योजना' : 'Pricing Plans'}</span>
              </a>
              <a
                href="#reviews"
                className="landing-drawer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>❤️</span>
                <span>{isMr ? 'मंडळांचा विश्वास' : 'Customer Reviews'}</span>
              </a>
              <a
                href="#faq"
                className="landing-drawer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>❓</span>
                <span>{isMr ? 'प्रश्नोत्तरे (FAQ)' : 'Frequently Asked'}</span>
              </a>
            </div>

            <div className="landing-drawer-actions">
              {user ? (
                <button
                  className="landing-cta-btn"
                  style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                >
                  📊 {isMr ? 'डॅशबोर्डवर जा' : 'Go to Dashboard'}
                </button>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="landing-cta-btn"
                    style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🚀 {isMr ? 'मोफत नोंदणी करा' : 'Get Started Free'}
                  </Link>
                  <Link
                    to="/login"
                    className="landing-login-btn"
                    style={{ width: '100%', padding: '12px', fontSize: 14.5, justifyContent: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔑 {isMr ? 'मंडळ लॉगिन' : 'Mandal Login'}
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#CBD5E1',
                  background: 'transparent',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4
                }}
              >
                <span>🌐</span>
                <span>{isMr ? 'Switch to English' : 'मराठी भाषेत वापरा'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Hero Section ── */}
      <section className="landing-hero">
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* Saffron Trust Badge */}
          <div className="landing-hero-badge">
            <span>🚩</span>
            <span>{isMr ? 'महाराष्ट्रातील गणेशोत्सव व सार्वजनिक मंडळांचे #१ डिजिटल प्लॅटफॉर्म' : 'Maharashtra’s #1 Digital Platform for Festival & Mandal Management'}</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="landing-hero-h1">
            {isMr ? (
              <>
                गणेशोत्सव व सार्वजनिक मंडळांचे <br />
                <span className="landing-gradient-text">
                  पारदर्शक, डिजिटल व आधुनिक
                </span> व्यवस्थापन
              </>
            ) : (
              <>
                Modern, Transparent & Digital <br />
                <span className="landing-gradient-text">
                  Management for Community Festivals & Mandals
                </span>
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="landing-hero-p">
            {isMr
              ? 'पारंपरिक वह्या-खात्यांना द्या निरोप! आता थेट WhatsApp वर डिजिटल पावत्या, पारदर्शक जमा-खर्च हिशोब, ऑनलाइन मंजुऱ्या, कार्यकारिणी ओळखपत्रे आणि सीए ऑडिट-रेडी अहवाल — सर्वकाही एकाच अ‍ॅपमध्ये.'
              : 'Say goodbye to tedious manual receipt books! Issue branded WhatsApp receipts, track live inflows & expenses, generate member ID cards, and export CA audit-ready reports in one tap.'}
          </p>

          {/* CTA Buttons */}
          <div className="landing-hero-buttons">
            <Link
              to="/register"
              className="landing-hero-btn-primary"
            >
              🚀 {isMr ? 'मंडळाची मोफत नोंदणी करा' : 'Register Your Mandal Free'}
            </Link>

            <Link
              to="/login"
              className="landing-hero-btn-secondary"
            >
              🔑 {isMr ? 'थेट लॉगिन करा' : 'Mandal Login →'}
            </Link>
          </div>

          {/* ── Live Stats Row ── */}
          <div className="landing-stats-grid">
            {stats.map((st, i) => (
              <div
                key={i}
                className="landing-stat-card"
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{st.icon}</div>
                <div className="landing-stat-num">
                  {isMr ? st.num : st.numEn}
                </div>
                <div className="landing-stat-label">
                  {isMr ? st.labelMr : st.labelEn}
                </div>
              </div>
            ))}
          </div>

          {/* ── Hero Visual Banner with Glow Border ── */}
          <div className="landing-hero-banner-wrap">
            <img
              src="/hero-banner.jpg"
              alt="Apla Mandal Digital Platform Dashboard Preview"
              className="landing-hero-banner-img"
            />
          </div>
        </div>
      </section>

      {/* ── 3. Features Section ── */}
      <section id="features" className="landing-section" style={{ background: '#0F172A' }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#38BDF8' }}>
              ⚡ {isMr ? 'प्रमुख वैशिष्ट्ये' : 'POWERFUL FEATURES'}
            </span>
            <h2 className="landing-section-title">
              {isMr ? 'मंडळ व्यवस्थापनाची सर्व साधने, एकाच ठिकाणी' : 'Everything Your Mandal Needs to Run Professionally'}
            </h2>
            <p className="landing-section-desc">
              {isMr
                ? 'वर्गणी नोंदणीपासून ते अंतिम ऑडिट अहवालापर्यंत - सर्व प्रक्रिया आधुनिक आणि सुलभ.'
                : 'From donation collection to final audit reports — seamless, paperless, and fully digital.'}
            </p>
          </div>

          {/* Features Grid */}
          <div className="landing-features-grid">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="landing-feature-card"
              >
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: `${feat.color}20`,
                  border: `1px solid ${feat.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  {feat.icon}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {isMr ? feat.titleMr : feat.titleEn}
                </h3>

                <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                  {isMr ? feat.descMr : feat.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Showcase Banner Section ── */}
      <section className="landing-section" style={{ background: '#0B1120' }}>
        <div className="landing-container">
          <div className="landing-showcase-grid">
            <div>
              <span style={{ color: '#F97316', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                📱 {isMr ? 'डिजिटल क्रांती' : 'SMART FESTIVAL MANAGEMENT'}
              </span>
              <h2 className="landing-section-title" style={{ textAlign: 'left', margin: '12px 0 16px' }}>
                {isMr
                  ? 'कागदी वह्या आणि पावत्यांना पूर्णविराम, थेट डिजिटल व्हा!'
                  : 'Zero Paperwork, Zero Confusion, Instant WhatsApp Receipts'}
              </h2>
              <p style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                {isMr
                  ? 'Apla Mandal मुळे देणगीदार आणि मंडळ यांच्यातील विश्वास दृढ होतो. प्रत्येक वर्गणीदाराला अधिकृत डिजिटल पावती त्वरित मिळते, ज्यामुळे हिशोबात १००% पारदर्शकता राहते.'
                  : 'Build total trust with your donors and community. Instant receipts sent directly to donor phones ensure every single rupee is accounted for accurately.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#10B981', fontSize: 17, fontWeight: 900 }}>✓</span>
                  <span style={{ color: '#E2E8F0', fontSize: 14.5 }}>
                    {isMr ? 'स्मार्टफोनवरून १ सेकंदात पावती निर्मिती' : '1-Second Receipt Generation from Any Phone'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#10B981', fontSize: 17, fontWeight: 900 }}>✓</span>
                  <span style={{ color: '#E2E8F0', fontSize: 14.5 }}>
                    {isMr ? 'खर्च मंजुरी व पावत्यांचे फोटो क्लाउडवर सुरक्षित' : 'Expense Approvals with Cloud Bill Photos'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#10B981', fontSize: 17, fontWeight: 900 }}>✓</span>
                  <span style={{ color: '#E2E8F0', fontSize: 14.5 }}>
                    {isMr ? 'उत्सवानंतर १ क्लिकमध्ये ऑडिट ताळेबंद तयार' : 'One-Click CA Audit Balance Sheet Download'}
                  </span>
                </div>
              </div>

              <Link
                to="/register"
                className="landing-hero-btn-primary"
                style={{ padding: '13px 26px', fontSize: 14.5 }}
              >
                🚩 {isMr ? 'आताच मंडळ जोडा' : 'Start Managing Your Mandal'}
              </Link>
            </div>

            <div className="landing-showcase-img-wrap">
              <img
                src="/features-banner.jpg"
                alt="Apla Mandal WhatsApp Receipt & Finance Features"
                className="landing-showcase-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Suitable for All Mandals & Communities ── */}
      <section id="festivals" className="landing-section" style={{ background: '#0F172A' }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-section-title">
            {isMr ? 'सर्व प्रकारच्या उत्सव व सामाजिक मंडळांसाठी उपयुक्त' : 'Built for All Indian Festivals & Community Groups'}
          </h2>
          <p className="landing-section-desc" style={{ marginBottom: 36 }}>
            {isMr
              ? 'लहान गल्लीतील मंडळापासून ते मोठ्या नामांकित सार्वजनिक मंडळांपर्यंत सर्वांसाठी परिपूर्ण.'
              : 'From neighborhood gully mandals to large prestigious city trusts.'}
          </p>

          <div className="landing-festivals-grid">
            {festivals.map((fest, idx) => (
              <div
                key={idx}
                className="landing-festival-card"
              >
                <span style={{ fontSize: 28 }}>{fest.icon}</span>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#FFFFFF' }}>
                  {isMr ? fest.nameMr : fest.nameEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Pricing Section ── */}
      <section id="pricing" className="landing-section" style={{ background: '#0B1120' }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <span className="landing-section-badge" style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#FACC15' }}>
            💎 {isMr ? 'किफायतशीर योजना' : 'SIMPLE PRICING'}
          </span>
          <h2 className="landing-section-title">
            {isMr ? 'पारदर्शक व परवडणारे सदस्यत्व दर' : 'Transparent Plans for Every Size of Mandal'}
          </h2>
          <p className="landing-section-desc" style={{ marginBottom: 28 }}>
            {isMr ? 'कोणतेही छुपे शुल्क नाही. तुमच्या गरजेनुसार योजना निवडा.' : 'No hidden fees. Pick the plan that suits your festival needs.'}
          </p>

          {/* Billing Toggle */}
          <div className="landing-pricing-toggle-wrap">
            <button
              className={`landing-pricing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              {isMr ? 'वार्षिक योजना (२०% सूट)' : 'Annual Plan (Save 20%)'}
            </button>
            <button
              className={`landing-pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              {isMr ? 'मासिक (Monthly)' : 'Monthly'}
            </button>
          </div>

          {/* Pricing Grid */}
          <div className="landing-pricing-grid">
            {plans.map((p) => {
              const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;
              const period = isMr ? p.periodMr : p.periodEn;

              return (
                <div
                  key={p.id}
                  className={`landing-pricing-card ${p.popular ? 'popular' : ''}`}
                >
                  {(isMr ? p.badgeMr : p.badgeEn) && (
                    <div style={{
                      position: 'absolute',
                      top: -12,
                      right: 18,
                      background: '#F97316',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: 999,
                      boxShadow: '0 4px 10px rgba(249, 115, 22, 0.4)'
                    }}>
                      {isMr ? p.badgeMr : p.badgeEn}
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: p.color, margin: '0 0 10px' }}>
                      {isMr ? p.nameMr : p.nameEn}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                      <span style={{ fontSize: 34, fontWeight: 900, color: '#FFFFFF' }}>{price}</span>
                      <span style={{ fontSize: 13.5, color: '#94A3B8' }}>{period}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                      {(isMr ? p.featuresMr : p.featuresEn).map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5, color: '#CBD5E1' }}>
                          <span style={{ color: '#10B981', fontWeight: 900, flexShrink: 0 }}>✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className={`landing-hero-btn-primary`}
                    style={{
                      width: '100%',
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: 14,
                      background: p.popular ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'rgba(255, 255, 255, 0.08)',
                      border: p.popular ? 'none' : '1px solid rgba(255, 255, 255, 0.16)',
                      boxShadow: p.popular ? '0 4px 14px rgba(249, 115, 22, 0.35)' : 'none'
                    }}
                  >
                    {isMr ? p.ctaMr : p.ctaEn} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. Testimonials / Trust ── */}
      <section id="reviews" className="landing-section" style={{ background: '#0F172A' }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span style={{ color: '#F97316', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ❤️ {isMr ? 'मंडळांचा विश्वास' : 'TRUSTED BY MANDAL COMMITTEES'}
            </span>
            <h2 className="landing-section-title" style={{ marginTop: 8 }}>
              {isMr ? 'पदाधिकाऱ्यांचे अनुभव व अभिप्राय' : 'What Mandal Leaders Say'}
            </h2>
          </div>

          <div className="landing-testimonials-grid">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="landing-testimonial-card"
              >
                <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, fontStyle: 'italic' }}>
                  “{isMr ? t.textMr : t.textEn}”
                </div>

                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#FFFFFF' }}>
                    {isMr ? t.name : t.nameEn}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#F97316', fontWeight: 600, marginTop: 2 }}>
                    {isMr ? t.mandalMr : t.mandalEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ Section ── */}
      <section id="faq" className="landing-section" style={{ background: '#0B1120' }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">
              {isMr ? 'नेहमी विचारले जाणारे प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </h2>
            <p className="landing-section-desc">
              {isMr ? 'काही शंका आहेत? उत्तरे येथे मिळतील.' : 'Have questions? We have answers.'}
            </p>
          </div>

          <div className="landing-faq-container">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="landing-faq-item"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="landing-faq-btn"
                >
                  <span>{isMr ? faq.qMr : faq.qEn}</span>
                  <span style={{ fontSize: 18, color: '#F97316', flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="landing-faq-answer">
                    {isMr ? faq.aMr : faq.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA Banner ── */}
      <section className="landing-section" style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(99, 102, 241, 0.12) 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <img
            src="/logo.png"
            alt="Apla Mandal Logo"
            style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'contain', margin: '0 auto 16px', display: 'block', background: '#FFFFFF', padding: 3 }}
          />
          <h2 className="landing-section-title">
            {isMr ? 'आजच तुमच्या मंडळाला डिजिटल आणि पारदर्शक बनवा!' : 'Ready to Transform Your Mandal Management?'}
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: 15, marginBottom: 30, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 30px' }}>
            {isMr
              ? 'आता वह्यांचे झंझट सोडा. ५ मिनिटांत मोफत नोंदणी करा आणि डिजिटल पावत्या फाडण्यास सुरुवात करा.'
              : 'Join over 500+ active mandals across Maharashtra. Register in under 2 minutes.'}
          </p>

          <div className="landing-hero-buttons" style={{ marginBottom: 0 }}>
            <Link
              to="/register"
              className="landing-hero-btn-primary"
            >
              🚀 {isMr ? 'मोफत सुरुवात करा' : 'Register Now (Free)'}
            </Link>

            <Link
              to="/login"
              className="landing-hero-btn-secondary"
            >
              🔑 {isMr ? 'लॉगिन करा' : 'Login'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div>
            <div className="landing-logo" style={{ marginBottom: 12, cursor: 'default' }}>
              <img
                src="/logo.png"
                alt="Apla Mandal Logo"
                style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: '#FFFFFF', padding: 2 }}
              />
              <div className="landing-logo-title" style={{ fontSize: 18 }}>
                Apla<span>Mandal</span>
              </div>
            </div>
            <p style={{ lineHeight: 1.6, fontSize: 13, color: '#94A3B8' }}>
              {isMr
                ? 'महाराष्ट्रातील गणेशोत्सव, नवरात्री व सार्वजनिक मंडळांसाठी सर्वोत्कृष्ट डिजिटल व्यवस्थापन प्रणाली.'
                : 'The premier digital festival, donations, and operations platform for Indian community mandals and trusts.'}
            </p>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: 12 }}>{isMr ? 'महत्त्वाचे दुवे' : 'Quick Links'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/register" style={{ color: '#94A3B8', fontSize: 13 }}>{isMr ? 'मंडळ नोंदणी' : 'Register Mandal'}</Link>
              <Link to="/login" style={{ color: '#94A3B8', fontSize: 13 }}>{isMr ? 'लॉगिन' : 'Login'}</Link>
              <a href="#pricing" style={{ color: '#94A3B8', fontSize: 13 }}>{isMr ? 'सदस्यत्व योजना' : 'Subscription Plans'}</a>
              <a href="#features" style={{ color: '#94A3B8', fontSize: 13 }}>{isMr ? 'वैशिष्ट्ये' : 'Features'}</a>
            </div>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: 12 }}>{isMr ? 'कायदेशीर' : 'Legal & Support'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/privacy-policy" style={{ color: '#94A3B8', fontSize: 13 }}>{isMr ? 'गोपनीयता धोरण (Privacy)' : 'Privacy Policy'}</Link>
              <Link to="/terms-and-conditions" style={{ color: '#94A3B8', fontSize: 13 }}>{isMr ? 'नियम व अटी (Terms)' : 'Terms & Conditions'}</Link>
              <span style={{ color: '#94A3B8', fontSize: 13 }}>📧 contact@quantromind.com</span>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <div>© {new Date().getFullYear()} Apla Mandal. All Rights Reserved.</div>
          <div>Made with ❤️ for Mandals in Maharashtra, India 🇮🇳</div>
        </div>
      </footer>
    </div>
  );
}

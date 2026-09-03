import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Landing() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleLanguage = () => {
    setLanguage(language === 'mr' ? 'en' : 'mr');
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isMr = language === 'mr';

  const stats = [
    { num: '५००+', numEn: '500+', labelMr: 'नोंदणीकृत मंडळे व समित्या', labelEn: 'Registered Mandals & Trusts', icon: '🏛️' },
    { num: '५०,०००+', numEn: '50,000+', labelMr: 'WhatsApp डिजिटल पावत्या', labelEn: 'WhatsApp Digital Receipts', icon: '🧾' },
    { num: '₹१० कोटी+', numEn: '₹10 Cr+', labelMr: 'सुरक्षित जमा-खर्च हिशोब', labelEn: 'Transparent Managed Funds', icon: '💰' },
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
      id: 'free',
      nameMr: 'मोफत / ट्रायल (Free)',
      nameEn: 'Free / Trial',
      priceAnnual: '₹०',
      priceMonthly: '₹०',
      periodMr: '/कायमस्वरूपी',
      periodEn: '/forever',
      color: '#64748B',
      popular: false,
      featuresMr: ['१ मंडळ व्यवस्थापन', '१ उत्सव कार्यक्रम', 'मूलभूत देणगी पावत्या', '५ समिती सदस्य', 'मूलभूत डॅशबोर्ड'],
      featuresEn: ['1 Mandal Management', '1 Festival / Event per year', 'Basic Donation Receipts', 'Up to 5 Members', 'Standard Dashboard'],
      ctaMr: 'मोफत सुरू करा',
      ctaEn: 'Start Free'
    },
    {
      id: 'silver',
      nameMr: 'सिल्व्हर प्रो (Silver Pro)',
      nameEn: 'Silver Pro',
      badgeMr: '🔥 सर्वाधिक पसंती',
      badgeEn: '🔥 MOST POPULAR',
      priceAnnual: '₹४९९',
      priceMonthly: '₹७९',
      periodMr: billingCycle === 'annual' ? '/वर्ष' : '/महिना',
      periodEn: billingCycle === 'annual' ? '/year' : '/month',
      color: '#F97316',
      popular: true,
      featuresMr: [
        '१ मंडळ संपूर्ण व्यवस्थापन',
        '५ उत्सव व वर्षभरातील कार्यक्रम',
        'अमर्यादित WhatsApp डिजिटल पावत्या',
        'मंडळ लोगो व अधिकृत ब्रँडिंग',
        '२५ समिती सदस्य व स्वयंसेवक',
        'खर्च व डिजिटल मंजुरी वर्कफ्लो',
        'समिती लाइव्ह ग्रुप चॅट',
        'डिजिटल सदस्य ओळखपत्रे'
      ],
      featuresEn: [
        '1 Complete Mandal Management',
        'Up to 5 Festival Events per year',
        'Unlimited WhatsApp Digital Receipts',
        'Custom Logo & Header Branding',
        'Up to 25 Committee Members',
        'Expense & Digital Approvals',
        'Committee Live Chatroom',
        'Digital Member ID Card Generator'
      ],
      ctaMr: 'सिल्व्हर प्रो निवडा',
      ctaEn: 'Choose Silver Pro'
    },
    {
      id: 'gold',
      nameMr: 'गोल्ड उत्सव स्पेशल (Gold Utsav)',
      nameEn: 'Gold Utsav Special',
      badgeMr: '⭐ सर्वोत्तम मूल्य',
      badgeEn: '⭐ BEST VALUE',
      priceAnnual: '₹९९९',
      priceMonthly: '₹१४९',
      periodMr: billingCycle === 'annual' ? '/वर्ष' : '/महिना',
      periodEn: billingCycle === 'annual' ? '/year' : '/month',
      color: '#EAB308',
      popular: false,
      featuresMr: [
        '३ मंडळे / शाखा व्यवस्थापन',
        'अमर्यादित उत्सव आणि कार्यक्रम',
        'अमर्यादित WhatsApp पावत्या व SMS',
        'अमर्यादित समिती सदस्य व स्वयंसेवक',
        'सीए ऑडिट-रेडी Excel व PDF रिपोर्ट्स',
        'व्हेरिफाइड मंडळ ट्रस्ट बॅज',
        '२४/७ प्राधान्य ग्राहक सहाय्य'
      ],
      featuresEn: [
        '3 Mandals / Branches',
        'Unlimited Festivals & Events',
        'Unlimited WhatsApp Receipts & SMS',
        'Unlimited Committee Members',
        'CA & Audit Ready PDF/Excel Exports',
        'Verified Mandal Trust Badge',
        '24/7 Priority Support'
      ],
      ctaMr: 'गोल्ड स्पेशल निवडा',
      ctaEn: 'Choose Gold Special'
    }
  ];

  const testimonials = [
    {
      name: 'संजय कदम (अध्यक्ष)',
      nameEn: 'Sanjay Kadam (President)',
      mandalMr: 'श्री गणेश मित्र मंडळ, पुणे',
      mandalEn: 'Shree Ganesh Mitra Mandal, Pune',
      textMr: 'पूर्वी वह्यांमध्ये वर्गणी नोंदवणे आणि पावत्या फाडणे खूप त्रासाचे होते. MandalPro मुळे कार्यकर्त्यांनी थेट मोबाईलवरून पावत्या फाडल्या आणि देणगीदारांना लगेच WhatsApp वर पावती मिळाली. जमा-खर्चाचा हिशोब पारदर्शक झाला!',
      textEn: 'Recording vargani in physical paper books was exhausting. With MandalPro, our volunteers generated receipts from their phones and donors instantly received them on WhatsApp. Total transparency!'
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
      qMr: 'MandalPro अ‍ॅप वापरणे किती सोपे आहे?',
      qEn: 'How easy is it to use MandalPro?',
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
    <div className="landing-page-root" style={{ background: '#0B1120', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* ── 1. Top Navigation Bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 24px'
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          >
            <img
              src="/logo.png"
              alt="Apla Mandal Logo"
              style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain', background: '#FFFFFF', padding: 2 }}
            />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                Apla<span style={{ color: '#F97316' }}>Mandal</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                MandalPro Platform
              </div>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#features" style={{ color: '#CBD5E1', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              {isMr ? 'वैशिष्ट्ये' : 'Features'}
            </a>
            <a href="#festivals" style={{ color: '#CBD5E1', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              {isMr ? 'मंडळे' : 'Communities'}
            </a>
            <a href="#pricing" style={{ color: '#CBD5E1', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              {isMr ? 'योजना' : 'Pricing'}
            </a>
            <a href="#reviews" style={{ color: '#CBD5E1', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              {isMr ? 'विश्वास' : 'Reviews'}
            </a>
            <a href="#faq" style={{ color: '#CBD5E1', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              {isMr ? 'प्रश्नोत्तरे' : 'FAQ'}
            </a>
          </nav>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <span>🌐</span>
              <span>{isMr ? 'English' : 'मराठी'}</span>
            </button>

            {user ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/')}
                style={{ padding: '8px 18px', fontSize: 13.5 }}
              >
                📊 {isMr ? 'डॅशबोर्डवर जा' : 'Go to Dashboard'}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {isMr ? 'लॉगिन' : 'Login'}
                </Link>

                <Link
                  to="/register"
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: 13.5 }}
                >
                  🚀 {isMr ? 'नोंदणी करा' : 'Get Started'}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section style={{
        position: 'relative',
        padding: '70px 24px 80px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(249, 115, 22, 0.25), transparent 70%)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* Saffron Trust Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(249, 115, 22, 0.12)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            color: '#F97316',
            borderRadius: 999,
            padding: '6px 18px',
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 24,
            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.15)'
          }}>
            <span>🚩</span>
            <span>{isMr ? 'महाराष्ट्रातील गणेशोत्सव व सार्वजनिक मंडळांचे #१ डिजिटल प्लॅटफॉर्म' : 'Maharashtra’s #1 Digital Platform for Festival & Mandal Management'}</span>
          </div>

          {/* Main Hero Headline */}
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 54px)',
            fontWeight: 900,
            lineHeight: 1.2,
            color: '#FFFFFF',
            margin: '0 auto 20px',
            maxWidth: 960,
            fontFamily: "'Poppins', sans-serif"
          }}>
            {isMr ? (
              <>
                गणेशोत्सव व सार्वजनिक मंडळांचे <br />
                <span style={{
                  background: 'linear-gradient(135deg, #FF6B00 0%, #FBBF24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  पारदर्शक, डिजिटल व आधुनिक
                </span> व्यवस्थापन
              </>
            ) : (
              <>
                Modern, Transparent & Digital <br />
                <span style={{
                  background: 'linear-gradient(135deg, #FF6B00 0%, #FBBF24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Management for Community Festivals & Mandals
                </span>
              </>
            )}
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#94A3B8',
            maxWidth: 800,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            {isMr
              ? 'पारंपरिक वह्या-खात्यांना द्या निरोप! आता थेट WhatsApp वर डिजिटल पावत्या, पारदर्शक जमा-खर्च हिशोब, ऑनलाइन मंजुऱ्या, कार्यकारिणी ओळखपत्रे आणि सीए ऑडिट-रेडी अहवाल — सर्वकाही एकाच अ‍ॅपमध्ये.'
              : 'Say goodbye to tedious manual receipt books! Issue branded WhatsApp receipts, track live inflows & expenses, generate member ID cards, and export CA audit-ready reports in one tap.'}
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 50 }}>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: '16px 36px', fontSize: 16, borderRadius: 14, boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)' }}
            >
              🚀 {isMr ? 'मंडळाची मोफत नोंदणी करा' : 'Register Your Mandal Free'}
            </Link>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 28px',
                fontSize: 16,
                fontWeight: 600,
                color: '#FFFFFF',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              🔑 {isMr ? 'थेट लॉगिन करा' : 'Mandal Login →'}
            </Link>
          </div>

          {/* ── Live Stats Row ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            maxWidth: 1060,
            margin: '0 auto 50px'
          }}>
            {stats.map((st, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  padding: '20px 16px',
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{st.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#F97316', marginBottom: 4 }}>
                  {isMr ? st.num : st.numEn}
                </div>
                <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 600 }}>
                  {isMr ? st.labelMr : st.labelEn}
                </div>
              </div>
            ))}
          </div>

          {/* ── Hero Visual Banner with Glow Border ── */}
          <div style={{
            position: 'relative',
            maxWidth: 1080,
            margin: '0 auto',
            borderRadius: 24,
            padding: 6,
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.6), rgba(99, 102, 241, 0.3), rgba(249, 115, 22, 0.6))',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <img
              src="/hero-banner.jpg"
              alt="MandalPro Digital Platform Dashboard Preview"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 20,
                objectFit: 'cover'
              }}
            />
          </div>
        </div>
      </section>

      {/* ── 3. Features Section ── */}
      <section id="features" style={{ padding: '80px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <span style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#38BDF8',
              borderRadius: 999,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              ⚡ {isMr ? 'प्रमुख वैशिष्ट्ये' : 'POWERFUL FEATURES'}
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#FFFFFF', marginTop: 14, marginBottom: 12 }}>
              {isMr ? 'मंडळ व्यवस्थापनाची सर्व साधने, एकाच ठिकाणी' : 'Everything Your Mandal Needs to Run Professionally'}
            </h2>
            <p style={{ color: '#94A3B8', maxWidth: 680, margin: '0 auto', fontSize: 16 }}>
              {isMr
                ? 'वर्गणी नोंदणीपासून ते अंतिम ऑडिट अहवालापर्यंत - सर्व प्रक्रिया आधुनिक आणि सुलभ.'
                : 'From donation collection to final audit reports — seamless, paperless, and fully digital.'}
            </p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24
          }}>
            {features.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 20,
                  padding: '30px 24px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${feat.color}20`,
                  border: `1px solid ${feat.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26
                }}>
                  {feat.icon}
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {isMr ? feat.titleMr : feat.titleEn}
                </h3>

                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                  {isMr ? feat.descMr : feat.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Showcase Banner Section ── */}
      <section style={{ padding: '80px 24px', background: '#0B1120' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <span style={{ color: '#F97316', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              📱 {isMr ? 'डिजिटल क्रांती' : 'SMART FESTIVAL MANAGEMENT'}
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#FFFFFF', margin: '12px 0 16px' }}>
              {isMr
                ? 'कागदी वह्या आणि पावत्यांना पूर्णविराम, थेट डिजिटल व्हा!'
                : 'Zero Paperwork, Zero Confusion, Instant WhatsApp Receipts'}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 15.5, lineHeight: 1.6, marginBottom: 24 }}>
              {isMr
                ? 'MandalPro मुळे देणगीदार आणि मंडळ यांच्यातील विश्वास दृढ होतो. प्रत्येक वर्गणीदाराला अधिकृत डिजिटल पावती त्वरित मिळते, ज्यामुळे हिशोबात १००% पारदर्शकता राहते.'
                : 'Build total trust with your donors and community. Instant receipts sent directly to donor phones ensure every single rupee is accounted for accurately.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#10B981', fontSize: 18, fontWeight: 900 }}>✓</span>
                <span style={{ color: '#E2E8F0', fontSize: 15 }}>
                  {isMr ? 'स्मार्टफोनवरून १ सेकंदात पावती निर्मिती' : '1-Second Receipt Generation from Any Phone'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#10B981', fontSize: 18, fontWeight: 900 }}>✓</span>
                <span style={{ color: '#E2E8F0', fontSize: 15 }}>
                  {isMr ? 'खर्च मंजुरी व पावत्यांचे फोटो क्लाउडवर सुरक्षित' : 'Expense Approvals with Cloud Bill Photos'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#10B981', fontSize: 18, fontWeight: 900 }}>✓</span>
                <span style={{ color: '#E2E8F0', fontSize: 15 }}>
                  {isMr ? 'उत्सवानंतर १ क्लिकमध्ये ऑडिट ताळेबंद तयार' : 'One-Click CA Audit Balance Sheet Download'}
                </span>
              </div>
            </div>

            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: 15 }}
            >
              🚩 {isMr ? 'आताच मंडळ जोडा' : 'Start Managing Your Mandal'}
            </Link>
          </div>

          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <img
              src="/features-banner.jpg"
              alt="MandalPro WhatsApp Receipt & Finance Features"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ── 5. Suitable for All Mandals & Communities ── */}
      <section id="festivals" style={{ padding: '70px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 12 }}>
            {isMr ? 'सर्व प्रकारच्या उत्सव व सामाजिक मंडळांसाठी उपयुक्त' : 'Built for All Indian Festivals & Community Groups'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 15, marginBottom: 40 }}>
            {isMr
              ? 'लहान गल्लीतील मंडळापासून ते मोठ्या नामांकित सार्वजनिक मंडळांपर्यंत सर्वांसाठी परिपूर्ण.'
              : 'From neighborhood gully mandals to large prestigious city trusts.'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16
          }}>
            {festivals.map((fest, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: 30 }}>{fest.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                  {isMr ? fest.nameMr : fest.nameEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Pricing Section ── */}
      <section id="pricing" style={{ padding: '80px 24px', background: '#0B1120' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#FACC15',
            borderRadius: 999,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            💎 {isMr ? 'किफायतशीर योजना' : 'SIMPLE PRICING'}
          </span>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: '#FFFFFF', marginTop: 14, marginBottom: 12 }}>
            {isMr ? 'पारदर्शक व परवडणारे सदस्यत्व दर' : 'Transparent Plans for Every Size of Mandal'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 15, marginBottom: 28 }}>
            {isMr ? 'कोणतेही छुपे शुल्क नाही. तुमच्या गरजेनुसार योजना निवडा.' : 'No hidden fees. Pick the plan that suits your festival needs.'}
          </p>

          {/* Billing Toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(30, 41, 59, 0.8)',
            padding: 4,
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: 44
          }}>
            <button
              style={{
                border: 'none',
                background: billingCycle === 'annual' ? '#F97316' : 'transparent',
                color: '#FFFFFF',
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setBillingCycle('annual')}
            >
              {isMr ? 'वार्षिक योजना (Annual - २०% सूट)' : 'Annual Plan (Save 20%)'}
            </button>
            <button
              style={{
                border: 'none',
                background: billingCycle === 'monthly' ? '#F97316' : 'transparent',
                color: '#FFFFFF',
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setBillingCycle('monthly')}
            >
              {isMr ? 'मासिक (Monthly)' : 'Monthly'}
            </button>
          </div>

          {/* Pricing Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: 24,
            textAlign: 'left'
          }}>
            {plans.map((p) => {
              const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;
              const period = isMr ? p.periodMr : p.periodEn;

              return (
                <div
                  key={p.id}
                  style={{
                    background: p.popular ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.6)',
                    border: p.popular ? '2px solid #F97316' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 22,
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: p.popular ? '0 16px 40px rgba(249, 115, 22, 0.2)' : 'none'
                  }}
                >
                  {(isMr ? p.badgeMr : p.badgeEn) && (
                    <div style={{
                      position: 'absolute',
                      top: -13,
                      right: 20,
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
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: p.color, margin: '0 0 12px' }}>
                      {isMr ? p.nameMr : p.nameEn}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF' }}>{price}</span>
                      <span style={{ fontSize: 14, color: '#94A3B8' }}>{period}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                      {(isMr ? p.featuresMr : p.featuresEn).map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#CBD5E1' }}>
                          <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className={`btn ${p.popular ? 'btn-primary' : 'btn-outline'}`}
                    style={{ width: '100%', padding: '13px', textAlign: 'center', fontSize: 14.5, color: '#FFFFFF' }}
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
      <section id="reviews" style={{ padding: '80px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ color: '#F97316', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ❤️ {isMr ? 'मंडळांचा विश्वास' : 'TRUSTED BY MANDAL COMMITTEES'}
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#FFFFFF', marginTop: 10 }}>
              {isMr ? 'पदाधिकाऱ्यांचे अनुभव व अभिप्राय' : 'What Mandal Leaders Say'}
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 20,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontSize: 14.5, color: '#CBD5E1', lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' }}>
                  “{isMr ? t.textMr : t.textEn}”
                </div>

                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                    {isMr ? t.name : t.nameEn}
                  </div>
                  <div style={{ fontSize: 13, color: '#F97316', fontWeight: 600 }}>
                    {isMr ? t.mandalMr : t.mandalEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ Section ── */}
      <section id="faq" style={{ padding: '80px 24px', background: '#0B1120' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 12 }}>
              {isMr ? 'नेहमी विचारले जाणारे प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>
              {isMr ? 'काही शंका आहेत? उत्तरे येथे मिळतील.' : 'Have questions? We have answers.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span>{isMr ? faq.qMr : faq.qEn}</span>
                  <span style={{ fontSize: 20, color: '#F97316' }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', color: '#94A3B8', fontSize: 14.5, lineHeight: 1.6 }}>
                    {isMr ? faq.aMr : faq.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA Banner ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <img
            src="/logo.png"
            alt="Apla Mandal Logo"
            style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'contain', margin: '0 auto 16px', display: 'block', background: '#FFFFFF', padding: 4 }}
          />
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#FFFFFF', marginBottom: 16 }}>
            {isMr ? 'आजच तुमच्या मंडळाला डिजिटल आणि पारदर्शक बनवा!' : 'Ready to Transform Your Mandal Management?'}
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            {isMr
              ? 'आता वह्यांचे झंझट सोडा. ५ मिनिटांत मोफत नोंदणी करा आणि डिजिटल पावत्या फाडण्यास सुरुवात करा.'
              : 'Join over 500+ active mandals across Maharashtra. Register in under 2 minutes.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: '16px 36px', fontSize: 16, borderRadius: 14 }}
            >
              🚀 {isMr ? 'मोफत सुरुवात करा' : 'Register Now (Free)'}
            </Link>

            <Link
              to="/login"
              style={{
                padding: '16px 28px',
                fontSize: 16,
                fontWeight: 600,
                color: '#FFFFFF',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              🔑 {isMr ? 'लॉगिन करा' : 'Login'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. Footer ── */}
      <footer style={{
        background: '#070C18',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '50px 24px 30px',
        color: '#64748B',
        fontSize: 13.5
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FFFFFF', fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              <img
                src="/logo.png"
                alt="Apla Mandal Logo"
                style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain', background: '#FFFFFF', padding: 2 }}
              />
              <div>
                Apla<span style={{ color: '#F97316' }}>Mandal</span>
              </div>
            </div>
            <p style={{ lineHeight: 1.6 }}>
              {isMr
                ? 'महाराष्ट्रातील गणेशोत्सव, नवरात्री व सार्वजनिक मंडळांसाठी सर्वोत्कृष्ट डिजिटल व्यवस्थापन प्रणाली.'
                : 'The premier digital festival, donations, and operations platform for Indian community mandals and trusts.'}
            </p>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: 12 }}>{isMr ? 'महत्त्वाचे दुवे' : 'Quick Links'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/register" style={{ color: '#94A3B8' }}>{isMr ? 'मंडळ नोंदणी' : 'Register Mandal'}</Link>
              <Link to="/login" style={{ color: '#94A3B8' }}>{isMr ? 'लॉगिन' : 'Login'}</Link>
              <a href="#pricing" style={{ color: '#94A3B8' }}>{isMr ? 'सदस्यत्व योजना' : 'Subscription Plans'}</a>
              <a href="#features" style={{ color: '#94A3B8' }}>{isMr ? 'वैशिष्ट्ये' : 'Features'}</a>
            </div>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: 12 }}>{isMr ? 'कायदेशीर' : 'Legal & Support'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/privacy-policy" style={{ color: '#94A3B8' }}>{isMr ? 'गोपनीयता धोरण (Privacy)' : 'Privacy Policy'}</Link>
              <Link to="/terms-and-conditions" style={{ color: '#94A3B8' }}>{isMr ? 'नियम व अटी (Terms)' : 'Terms & Conditions'}</Link>
              <span style={{ color: '#94A3B8' }}>📧 contact@quantromind.com</span>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          paddingTop: 24,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>© {new Date().getFullYear()} MandalPro (Apla Mandal). All Rights Reserved.</div>
          <div>Made with ❤️ for Mandals in Maharashtra, India 🇮🇳</div>
        </div>
      </footer>
    </div>
  );
}

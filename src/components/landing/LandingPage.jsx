import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLSLHills } from '../ui/glsl-hills';
import './Landing.css';

// ─── SVG Icons (memoised so they never re-render) ─────────
const WalletIcon = React.memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
));
const MenuIcon = React.memo(() => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
));
const CloseIcon = React.memo(() => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
));

const FeatureIcons = {
  LayoutGrid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/>
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      <polyline points="16,8 21,8 21,3"/><polyline points="8,16 3,16 3,21"/>
    </svg>
  ),
  BarChart2: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Activity: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  ),
};

// ─── Hero Background — GLSLHills Three.js effect ──────────
const HeroBg = React.memo(() => (
  <div className="lp-hero-bg" aria-hidden="true">
    <GLSLHills />
  </div>
));

// ─── Single shared IntersectionObserver ──────────────────
// Instead of one observer per card, one global observer watches all elements.
const observerCallbacks = new Map();
let sharedObserver = null;

function getSharedObserver() {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cb = observerCallbacks.get(entry.target);
          if (cb) {
            cb();
            sharedObserver.unobserve(entry.target);
            observerCallbacks.delete(entry.target);
          }
        }
      });
    }, { threshold: 0.12 });
  }
  return sharedObserver;
}

function useInView() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = getSharedObserver();
    observerCallbacks.set(el, () => setVisible(true));
    obs.observe(el);
    return () => {
      obs.unobserve(el);
      observerCallbacks.delete(el);
    };
  }, [visible]);

  return [ref, visible];
}

// ─── CountUp ─────────────────────────────────────────────
function CountUp({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  const rafRef = useRef(null);

  useEffect(() => {
    if (!inView || target === null) return;
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, target]);

  if (target === null) return <span ref={ref}>Real-time</span>;
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Navbar ───────────────────────────────────────────────
const Navbar = React.memo(function Navbar({ onSignIn, onGetStarted }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(o => !o), []);
  const close  = useCallback(() => setOpen(false), []);

  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <div className="lp-nav-logo">
          <span className="lp-nav-logo-icon"><WalletIcon /></span>
          <span className="lp-nav-logo-text">SpendSmart</span>
        </div>
        <div className="lp-nav-links">
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={onSignIn}>Sign In</button>
          <button className="lp-btn-primary" onClick={onGetStarted}>Get Started</button>
        </div>
        <button className="lp-nav-hamburger" onClick={toggle} aria-label="Toggle menu">
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && (
        <div className="lp-nav-mobile">
          <div className="lp-nav-mobile-btns">
            <button className="lp-btn-ghost" onClick={onSignIn}>Sign In</button>
            <button className="lp-btn-primary" onClick={onGetStarted}>Get Started</button>
          </div>
        </div>
      )}
    </nav>
  );
});

// ─── Hero ─────────────────────────────────────────────────
const HeroSection = React.memo(function HeroSection({ onGetStarted }) {
  const words = ['Track.', 'Visualize.', 'Save.', 'Grow.'];
  return (
    <section className="lp-hero">
      <HeroBg />
      <div className="lp-hero-content">
        <h1 className="lp-hero-title">
          {words.map((w, i) => (
            <span key={i} className="lp-word" style={{ animationDelay: `${0.05 + i * 0.1}s` }}>
              {w}{' '}
            </span>
          ))}
        </h1>
        <p className="lp-hero-subtitle">
          Intelligent personal finance tracking built for the modern era.
          Experience real-time insights, beautiful visual analytics, and
          absolute control over your wealth.
        </p>
        <div className="lp-hero-cta-wrap">
          <button className="lp-hero-cta" onClick={onGetStarted}>
            <span>Get Started Free</span>
            <span className="lp-hero-cta-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
});

// ─── Features ─────────────────────────────────────────────
const featureCards = [
  { icon: 'LayoutGrid', title: 'Expense Tracking',       description: 'Automatically categorize and monitor every transaction in real-time.' },
  { icon: 'TrendingUp', title: 'Income Management',      description: 'Track multiple revenue streams and project future earnings easily.' },
  { icon: 'Bell',       title: 'Budget Alerts',          description: 'Get instant notifications when approaching custom spending thresholds.' },
  { icon: 'RefreshCw',  title: 'Recurring Transactions', description: 'Identify and manage subscriptions and regular bills in one place.' },
  { icon: 'BarChart2',  title: 'Visual Analytics',       description: 'Beautiful, interactive charts that make your financial data clear.' },
  { icon: 'Activity',   title: 'Financial Health Score', description: 'A comprehensive metric assessing your overall financial stability.' },
];

const FeatureCard = React.memo(function FeatureCard({ card, delay }) {
  const [ref, visible] = useInView();
  const Icon = FeatureIcons[card.icon];
  return (
    <div
      ref={ref}
      className={`lp-feature-card${visible ? ' lp-feature-card--visible' : ''}`}
      style={visible ? { animationDelay: `${delay}s` } : undefined}
    >
      <div className="lp-feature-icon"><Icon /></div>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
    </div>
  );
});

const FeaturesSection = React.memo(function FeaturesSection() {
  return (
    <section className="lp-features" id="features">
      <div className="lp-section-inner">
        <div className="lp-section-badge-wrap">
          <span className="lp-badge">Features</span>
        </div>
        <h2 className="lp-section-title">Everything you need to manage money</h2>
        <p className="lp-section-sub">Powerful tools encased in a seamless, high-performance interface.</p>
        <div className="lp-features-grid">
          {featureCards.map((card, i) => (
            <FeatureCard key={card.title} card={card} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
});

// ─── Stats ────────────────────────────────────────────────
const statsData = [
  { value: 500,  suffix: '+', label: 'ACTIVE USERS' },
  { value: 100,  suffix: '%', label: 'DATA PRIVACY' },
  { value: null, suffix: '',  label: 'BUDGET TRACKING' },
];

const StatItem = React.memo(function StatItem({ stat, bordered }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`lp-stat-item${bordered ? ' lp-stat-item--bordered' : ''}${visible ? ' lp-stat-item--visible' : ''}`}
    >
      <div className="lp-stat-bar" />
      <div className="lp-stat-value">
        <CountUp target={stat.value} suffix={stat.suffix} />
      </div>
      <p className="lp-stat-label">{stat.label}</p>
    </div>
  );
});

const StatsSection = React.memo(function StatsSection() {
  return (
    <section className="lp-stats">
      <div className="lp-stats-inner">
        {statsData.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} bordered={i > 0} />
        ))}
      </div>
    </section>
  );
});

// ─── Footer ───────────────────────────────────────────────
const Footer = React.memo(function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-footer-brand-icon"><WalletIcon /></span>
            <span>SpendSmart</span>
            <span className="lp-footer-sep">|</span>
            <span className="lp-footer-tagline">Sophisticated Futurist Finance.</span>
          </div>

        </div>
        <p className="lp-footer-copy">© 2026 SpendSmart. All rights reserved.</p>
      </div>
    </footer>
  );
});

// ─── Landing Page ─────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const goLogin    = useCallback(() => navigate('/login'),    [navigate]);
  const goRegister = useCallback(() => navigate('/register'), [navigate]);

  return (
    <div className="landing-root">
      <Navbar onSignIn={goLogin} onGetStarted={goRegister} />
      <HeroSection onGetStarted={goRegister} />
      <FeaturesSection />
      <StatsSection />
      <Footer />
    </div>
  );
}

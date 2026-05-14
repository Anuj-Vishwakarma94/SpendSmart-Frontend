import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Auth.css';

// ─── Brand icon — matches sidebar & landing ───────────────
const WalletIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

// ─── Google "G" coloured logo ─────────────────────────────
const GoogleG = () => (
  <svg width="17" height="17" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.4-4H43.6z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.6 5.1C9.7 39.7 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.7-4.8 6.2l6.2 5.2C40.6 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
);

// ─── Eye with white sclera ────────────────────────────────
const EyeBall = ({
  size = 16, pupilSize = 6, maxDistance = 4,
  eyeColor = 'white', pupilColor = '#0d0d0d',
  isBlinking = false, forceLookX, forceLookY,
}) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const h = e => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2);
    const dy = mouse.y - (r.top + r.height / 2);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
  })();

  return (
    <div ref={ref} style={{
      width: size, height: isBlinking ? 2 : size,
      backgroundColor: eyeColor, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', transition: 'height 0.12s ease',
      flexShrink: 0,
    }}>
      {!isBlinking && (
        <div style={{
          width: pupilSize, height: pupilSize, backgroundColor: pupilColor, borderRadius: '50%',
          transform: `translate(${pos.x}px,${pos.y}px)`,
          transition: 'transform 0.1s ease-out',
        }} />
      )}
    </div>
  );
};

// ─── Plain pupil (no white) ───────────────────────────────
const Pupil = ({ size = 10, maxDistance = 4, pupilColor = '#0d0d0d', forceLookX, forceLookY }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const h = e => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2);
    const dy = mouse.y - (r.top + r.height / 2);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
  })();

  return (
    <div ref={ref} style={{
      width: size, height: size, backgroundColor: pupilColor, borderRadius: '50%',
      transform: `translate(${pos.x}px,${pos.y}px)`,
      transition: 'transform 0.1s ease-out', flexShrink: 0,
    }} />
  );
};

// ─── Characters scene ─────────────────────────────────────
const CharactersScene = ({ isTyping, password, showPassword }) => {
  const [purpleBlink, setPurpleBlink] = useState(false);
  const [blackBlink,  setBlackBlink]  = useState(false);
  const [gazeEachOther, setGazeEachOther] = useState(false);
  const [purplePeek, setPurplePeek] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const purpleRef = useRef(null);
  const blackRef  = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  // Mouse tracking
  useEffect(() => {
    const h = e => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  // Randomised blink helper
  const useBlink = setter => {
    useEffect(() => {
      let t;
      const schedule = () => {
        t = setTimeout(() => {
          setter(true);
          setTimeout(() => { setter(false); schedule(); }, 150);
        }, 3000 + Math.random() * 4000);
      };
      schedule();
      return () => clearTimeout(t);
    }, []);
  };
  useBlink(setPurpleBlink);
  useBlink(setBlackBlink);

  // Gaze-at-each-other on typing focus
  useEffect(() => {
    if (!isTyping) { setGazeEachOther(false); return; }
    setGazeEachOther(true);
    const t = setTimeout(() => setGazeEachOther(false), 900);
    return () => clearTimeout(t);
  }, [isTyping]);

  // Purple sneaky peek when password is revealed
  useEffect(() => {
    if (!(password.length > 0 && showPassword)) { setPurplePeek(false); return; }
    const t = setTimeout(() => {
      setPurplePeek(true);
      setTimeout(() => setPurplePeek(false), 850);
    }, 2000 + Math.random() * 3000);
    return () => clearTimeout(t);
  }, [password, showPassword, purplePeek]);

  // Per-character body lean + face tracking
  const track = ref => {
    if (!ref.current) return { fx: 0, fy: 0, skew: 0 };
    const r = ref.current.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2);
    const dy = mouse.y - (r.top + r.height / 3);
    return {
      fx:   Math.max(-14, Math.min(14, dx / 22)),
      fy:   Math.max(-9,  Math.min(9,  dy / 32)),
      skew: Math.max(-6,  Math.min(6, -dx / 120)),
    };
  };

  const pp = track(purpleRef);
  const bp = track(blackRef);
  const yp = track(yellowRef);
  const op = track(orangeRef);

  const pwdHidden  = password.length > 0 && !showPassword;
  const pwdVisible = password.length > 0 &&  showPassword;

  // Shared transition
  const T = 'all 0.65s cubic-bezier(0.4,0,0.2,1)';

  return (
    /* Fixed container — characters sit on an invisible floor line */
    <div style={{ position: 'relative', width: 420, height: 380 }}>

      {/* ── Purple — tallest, back-left ── */}
      <div ref={purpleRef} style={{
        position: 'absolute', bottom: 0, left: 44,
        width: 148,
        height: (isTyping || pwdHidden) ? 420 : 370,
        backgroundColor: '#6C3FF5',
        borderRadius: '12px 12px 0 0',
        zIndex: 1, transition: T,
        transform: pwdVisible
          ? 'skewX(0deg)'
          : (isTyping || pwdHidden)
            ? `skewX(${pp.skew - 11}deg) translateX(26px)`
            : `skewX(${pp.skew}deg)`,
        transformOrigin: 'bottom center',
      }}>
        {/* Subtle inner highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'rgba(255,255,255,0.18)', borderRadius: '12px 12px 0 0',
        }} />
        {/* Eyes */}
        <div style={{
          position: 'absolute', display: 'flex', gap: 22,
          transition: T,
          left:  pwdVisible ? 16 : gazeEachOther ? 48 : `${38 + pp.fx}px`,
          top:   pwdVisible ? 32 : gazeEachOther ? 54 : `${36 + pp.fy}px`,
        }}>
          <EyeBall size={19} pupilSize={8} isBlinking={purpleBlink}
            forceLookX={pwdVisible ? (purplePeek ? 4 : -4) : gazeEachOther ? 4 : undefined}
            forceLookY={pwdVisible ? (purplePeek ? 5 : -4) : gazeEachOther ? 3 : undefined} />
          <EyeBall size={19} pupilSize={8} isBlinking={purpleBlink}
            forceLookX={pwdVisible ? (purplePeek ? 4 : -4) : gazeEachOther ? 4 : undefined}
            forceLookY={pwdVisible ? (purplePeek ? 5 : -4) : gazeEachOther ? 3 : undefined} />
        </div>
      </div>

      {/* ── Black — medium, just behind centre ── */}
      <div ref={blackRef} style={{
        position: 'absolute', bottom: 0, left: 188,
        width: 104, height: 268,
        backgroundColor: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '10px 10px 0 0',
        zIndex: 2, transition: T,
        transform: pwdVisible
          ? 'skewX(0deg)'
          : gazeEachOther
            ? `skewX(${bp.skew * 1.4 + 9}deg) translateX(14px)`
            : `skewX(${bp.skew}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'rgba(255,255,255,0.12)', borderRadius: '10px 10px 0 0',
        }} />
        <div style={{
          position: 'absolute', display: 'flex', gap: 18,
          transition: T,
          left: pwdVisible ? 8  : gazeEachOther ? 28 : `${20 + bp.fx}px`,
          top:  pwdVisible ? 24 : gazeEachOther ? 10 : `${26 + bp.fy}px`,
        }}>
          <EyeBall size={17} pupilSize={7} isBlinking={blackBlink}
            forceLookX={pwdVisible ? -4 : gazeEachOther ?  0 : undefined}
            forceLookY={pwdVisible ? -4 : gazeEachOther ? -4 : undefined} />
          <EyeBall size={17} pupilSize={7} isBlinking={blackBlink}
            forceLookX={pwdVisible ? -4 : gazeEachOther ?  0 : undefined}
            forceLookY={pwdVisible ? -4 : gazeEachOther ? -4 : undefined} />
        </div>
      </div>

      {/* ── Orange — semicircle, front-left ── */}
      <div ref={orangeRef} style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 196, height: 168,
        backgroundColor: '#FF9B6B',
        borderRadius: '100px 100px 0 0',
        zIndex: 3, transition: T,
        transform: pwdVisible ? 'skewX(0deg)' : `skewX(${op.skew}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div style={{
          position: 'absolute', display: 'flex', gap: 22,
          transition: 'all 0.18s ease-out',
          left: pwdVisible ? 38 : `${66 + op.fx}px`,
          top:  pwdVisible ? 68 : `${72 + op.fy}px`,
        }}>
          <Pupil size={12} forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
          <Pupil size={12} forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
        </div>
      </div>

      {/* ── Yellow — rounded pillar, front-right ── */}
      <div ref={yellowRef} style={{
        position: 'absolute', bottom: 0, left: 290,
        width: 124, height: 198,
        backgroundColor: '#E8D754',
        borderRadius: '62px 62px 0 0',
        zIndex: 4, transition: T,
        transform: pwdVisible ? 'skewX(0deg)' : `skewX(${yp.skew}deg)`,
        transformOrigin: 'bottom center',
      }}>
        <div style={{
          position: 'absolute', display: 'flex', gap: 18,
          transition: 'all 0.18s ease-out',
          left: pwdVisible ? 14 : `${43 + yp.fx}px`,
          top:  pwdVisible ? 32 : `${34 + yp.fy}px`,
        }}>
          <Pupil size={12} forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
          <Pupil size={12} forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
        </div>
        {/* Mouth line */}
        <div style={{
          position: 'absolute', height: 4, borderRadius: 2,
          backgroundColor: '#0d0d0d',
          transition: 'all 0.18s ease-out',
          width: pwdVisible ? 52 : 62,
          left: pwdVisible ? 10 : `${31 + yp.fx}px`,
          top:  pwdVisible ? 76 : `${76 + yp.fy}px`,
        }} />
      </div>

    </div>
  );
};


// ─── Login Page ───────────────────────────────────────────
export const LoginPage = () => {
  const { login, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Hidden GoogleLogin ref — we trigger it via our custom button
  const googleRef = useRef(null);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = async cr => {
    try {
      await loginWithGoogle(cr.credential);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Google login failed');
    }
  };

  // Trigger the hidden GoogleLogin button
  const handleGoogleClick = () => {
    const btn = googleRef.current?.querySelector('div[role="button"], button');
    if (btn) btn.click();
  };

  return (
    <div className="auth-split">

      {/* ── Left: animated characters ── */}
      <div className="auth-split__left">
        <div className="auth-split__brand">
          <div className="auth-logo">
            <WalletIcon size={16} />
          </div>
          <span className="auth-split__brand-name">SpendSmart</span>
        </div>

        <div className="auth-split__stage">
          <CharactersScene isTyping={isTyping} password={form.password} showPassword={showPwd} />
        </div>

        <p className="auth-split__tagline">Track. Visualize. Save. Grow.</p>
      </div>

      {/* ── Right: form ── */}
      <div className="auth-split__right">
        <div className="auth-split__form-wrap fade-in">

          {/* Mobile-only brand header */}
          <div className="auth-split__mobile-brand auth-brand">
            <div className="auth-logo"><WalletIcon /></div>
            <h1 className="auth-title">SpendSmart</h1>
            <p className="auth-subtitle">Track. Visualize. Save. Grow.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <h2 className="form-heading">Welcome back</h2>
              <p className="form-subheading">Sign in to your account</p>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email" type="email" required
                className="form-control"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                autoComplete="off"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="auth-label-row">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
              </div>
              <div className="auth-pwd-wrap">
                <input
                  name="password" type={showPwd ? 'text' : 'password'} required
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                />
                <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                  {showPwd
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="auth-divider"><span>or</span></div>

            {/* Custom dark Google button */}
            <button type="button" className="btn-google" onClick={handleGoogleClick}>
              <GoogleG />
              Continue with Google
            </button>

            {/* Hidden real GoogleLogin — triggered by the button above */}
            <div ref={googleRef} className="auth-google-hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google login failed')}
              />
            </div>

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};


// ─── Register Page ────────────────────────────────────────
export const RegisterPage = () => {
  const { register, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const googleRef = useRef(null);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', currency: 'INR', timezone: 'Asia/Kolkata',
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Registration failed');
    }
  };

  const handleGoogleSuccess = async cr => {
    try {
      await loginWithGoogle(cr.credential);
      toast.success('Account linked/created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Google signup failed');
    }
  };

  const handleGoogleClick = () => {
    const btn = googleRef.current?.querySelector('div[role="button"], button');
    if (btn) btn.click();
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <div className="auth-logo"><WalletIcon /></div>
          <h1 className="auth-title">SpendSmart</h1>
          <p className="auth-subtitle">Start your financial journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-heading">Create account</h2>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="fullName" type="text" required className="form-control"
              placeholder="Jane Doe" value={form.fullName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" required className="form-control"
              placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" required minLength={8} className="form-control"
              placeholder="Min. 8 characters" value={form.password} onChange={handleChange} />
          </div>

          <div className="auth-row">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select name="currency" className="form-control" value={form.currency} onChange={handleChange}>
                <option value="INR">INR ₹</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select name="timezone" className="form-control" value={form.timezone} onChange={handleChange}>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button type="button" className="btn-google" onClick={handleGoogleClick}>
            <GoogleG />
            Sign up with Google
          </button>

          <div ref={googleRef} className="auth-google-hidden">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google signup failed')}
              text="signup_with"
            />
          </div>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

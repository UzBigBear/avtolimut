import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth();
  const { t, lang, changeLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logoGrad)"/>
              <path d="M5 18L8 10h12l3 8H5z" fill="white" opacity="0.9"/>
              <circle cx="9" cy="20" r="2" fill="white"/>
              <circle cx="19" cy="20" r="2" fill="white"/>
              <path d="M8 10L10 6h8l2 4" fill="white" opacity="0.6"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop offset="0%" stopColor="#0057A8"/>
                  <stop offset="100%" stopColor="#00c6ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-brand">UzAvto</span>
            <span className="logo-sub">Online Navbat</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home')}</Link>
          {isLoggedIn && (
            <Link to="/my-queue" className={`nav-link ${isActive('/my-queue') ? 'active' : ''}`}>{t('nav.myQueue')}</Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={`nav-link nav-link-admin ${isActive('/admin') ? 'active' : ''}`}>
              <span className="admin-dot" />
              {t('nav.admin')}
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="nav-right">
          {/* Language Switcher */}
          <div className="lang-switcher">
            <button
              className={`lang-btn ${lang === 'uz' ? 'lang-active' : ''}`}
              onClick={() => changeLang('uz')}
              id="lang-uz"
            >
              🇺🇿 UZ
            </button>
            <button
              className={`lang-btn ${lang === 'ru' ? 'lang-active' : ''}`}
              onClick={() => changeLang('ru')}
              id="lang-ru"
            >
              🇷🇺 RU
            </button>
          </div>

          {/* Auth Buttons */}
          {isLoggedIn ? (
            <div className="nav-user">
              <div className="user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name?.split(' ')[0]}</span>
              <button className="btn-logout" onClick={handleLogout} id="btn-logout">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn-nav-login" id="btn-nav-login">{t('nav.login')}</Link>
              <Link to="/register" className="btn-nav-register" id="btn-nav-register">{t('nav.register')}</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            id="hamburger-btn"
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu-open' : ''}`}>
        <Link to="/" className="mobile-link">{t('nav.home')}</Link>
        {isLoggedIn && <Link to="/my-queue" className="mobile-link">{t('nav.myQueue')}</Link>}
        {isLoggedIn && <Link to="/book" className="mobile-link">{t('home.book_now')}</Link>}
        {isAdmin && <Link to="/admin" className="mobile-link">{t('nav.admin')}</Link>}
        <div className="mobile-lang">
          <button className={`lang-btn ${lang === 'uz' ? 'lang-active' : ''}`} onClick={() => changeLang('uz')}>🇺🇿 UZ</button>
          <button className={`lang-btn ${lang === 'ru' ? 'lang-active' : ''}`} onClick={() => changeLang('ru')}>🇷🇺 RU</button>
        </div>
        {!isLoggedIn && (
          <div className="mobile-auth">
            <Link to="/login" className="btn-nav-login" style={{display:'block', textAlign:'center'}}>{t('nav.login')}</Link>
            <Link to="/register" className="btn-nav-register" style={{display:'block', textAlign:'center', marginTop:'8px'}}>{t('nav.register')}</Link>
          </div>
        )}
        {isLoggedIn && (
          <button className="btn-logout mobile-logout" onClick={handleLogout}>{t('nav.logout')}</button>
        )}
      </div>
    </nav>
  );
}

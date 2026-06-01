import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CAR_EMOJIS = { onix: '🚗', cobalt: '🚙', damas: '🚐' };
const CAR_TAGS_UZ = { onix: 'Premium', cobalt: 'Mashhur', damas: 'Tijorat' };
const CAR_TAGS_RU = { onix: 'Премиум', cobalt: 'Популярный', damas: 'Коммерческий' };

export default function Home() {
  const { t, lang } = useLang();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/cars')
      .then(res => { setCars(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleBook = (carId) => {
    navigate(isLoggedIn ? `/book?car=${carId}` : '/register');
  };

  const steps = [
    { icon: '👤', step: '01', uz: t('home.step1'), ru: t('home.step1') },
    { icon: '🚗', step: '02', uz: t('home.step2'), ru: t('home.step2') },
    { icon: '📋', step: '03', uz: t('home.step3'), ru: t('home.step3') },
    { icon: '🎉', step: '04', uz: t('home.step4'), ru: t('home.step4') },
  ];

  return (
    <div className="home">
      {/* ─── Hero ──────────────────────────────────── */}
      <section className="hero">
        <div className="hero-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="container">
          <div className="hero-content">
            <span className="hero-badge">🇺🇿 {t('home.hero_badge')}</span>
            <h1 className="hero-title">{t('home.hero_title')}</h1>
            <p className="hero-subtitle">{t('home.hero_subtitle')}</p>
            <div className="hero-actions">
              <button
                className="btn-primary btn-hero"
                onClick={() => navigate(isLoggedIn ? '/book' : '/register')}
                id="hero-book-btn"
              >
                {t('home.book_now')} <span className="btn-arrow">→</span>
              </button>
              {isLoggedIn && (
                <button
                  className="btn-ghost btn-hero"
                  onClick={() => navigate('/my-queue')}
                  id="hero-myqueue-btn"
                >
                  {t('queue.my_queue')}
                </button>
              )}
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">3</span>
                <span className="hero-stat-label">{t('home.stat_models')}</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">1000+</span>
                <span className="hero-stat-label">{t('home.stat_delivered')}</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">24/7</span>
                <span className="hero-stat-label">{t('home.stat_service')}</span>
              </div>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="hero-car-showcase">
              <div className="showcase-ring showcase-ring-1" />
              <div className="showcase-ring showcase-ring-2" />
              <div className="showcase-ring showcase-ring-3" />
              <div className="showcase-car">🚗</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Cars Section ─────────────────────────── */}
      <section className="section cars-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.cars_title')}</h2>
            <p>{t('home.cars_subtitle')}</p>
          </div>

          <div className="cars-grid">
            {loading
              ? [1, 2, 3].map(i => <div key={i} className="car-card skeleton-card" />)
              : cars.map((car, idx) => (
                <div
                  key={car.id}
                  className={`car-card ${idx === 1 ? 'car-card-featured' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {idx === 1 && (
                    <div className="car-featured-label">
                      ⭐ {lang === 'uz' ? 'Eng ko\'p tanlanadi' : 'Самый популярный'}
                    </div>
                  )}
                  <div className="car-tag">{lang === 'uz' ? CAR_TAGS_UZ[car.id] : CAR_TAGS_RU[car.id]}</div>
                  <div className="car-emoji">{CAR_EMOJIS[car.id]}</div>
                  <h3 className="car-model">{car.model}</h3>
                  <p className="car-desc">
                    {lang === 'uz' ? car.description_uz : car.description_ru}
                  </p>
                  <div className="car-price-row">
                    <span className="price-label">{t('home.price')}</span>
                    <span className="price-value">${car.price.toLocaleString()}</span>
                  </div>
                  <div className="car-colors-row">
                    {car.colors.map(c => (
                      <div
                        key={c.value}
                        className="color-dot"
                        style={{ backgroundColor: c.hex }}
                        title={lang === 'uz' ? c.uz : c.ru}
                      />
                    ))}
                    <span className="colors-count">{car.colors.length} {lang === 'uz' ? 'rang' : 'цвет'}</span>
                  </div>
                  <div className="car-meta">
                    <div className="meta-item">
                      <span className="meta-icon">⏱</span>
                      <span>{car.waitingMonthsMin}–{car.waitingMonthsMax} {t('home.months')}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📦</span>
                      <span>{car.availableCount} {t('home.available')}</span>
                    </div>
                  </div>
                  <button
                    className="btn-primary car-book-btn"
                    onClick={() => handleBook(car.id)}
                    id={`book-${car.id}`}
                  >
                    {t('home.book_now')}
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.how_title')}</h2>
          </div>
          <div className="steps-grid">
            {steps.map((item) => (
              <div key={item.step} className="step-card">
                <div className="step-number">{item.step}</div>
                <div className="step-icon">{item.icon}</div>
                <p className="step-label">{lang === 'uz' ? item.uz : item.ru}</p>
                {item.step !== '04' && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🚗 UzAvto</span>
              <p>{lang === 'uz' ? 'Online navbat tizimi' : 'Система онлайн-очереди'}</p>
            </div>
            <div className="footer-links">
              <a href="#" className="footer-link">
                {lang === 'uz' ? 'Foydalanish shartlari' : 'Условия использования'}
              </a>
              <a href="#" className="footer-link">
                {lang === 'uz' ? 'Maxfiylik siyosati' : 'Политика конфиденциальности'}
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 UzAvto. {t('common.copyright')}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

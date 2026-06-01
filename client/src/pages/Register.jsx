import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Register() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Ism kiritilmadi';
    if (!form.phone.trim()) return 'Telefon raqam kiritilmadi';
    if (form.password.length < 6) return 'Parol kamida 6 ta belgi bo\'lishi kerak';
    if (form.password !== form.confirmPassword) return 'Parollar mos kelmaydi';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name: form.name,
        phone: form.phone,
        password: form.password
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <div className="auth-card auth-card-register">
        <div className="auth-header">
          <div className="auth-logo">🚗</div>
          <h1>{t('auth.register_title')}</h1>
          <p>{t('auth.register_subtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="form-group">
            <label className="form-label">{t('auth.full_name')}</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="name"
                id="reg-name"
                className="form-input"
                placeholder={t('auth.full_name_placeholder')}
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.phone')}</label>
            <div className="input-wrapper">
              <span className="input-icon">📞</span>
              <input
                type="tel"
                name="phone"
                id="reg-phone"
                className="form-input"
                placeholder={t('auth.phone_placeholder')}
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                id="reg-password"
                className="form-input"
                placeholder={t('auth.password_placeholder')}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.confirm_password')}</label>
            <div className="input-wrapper">
              <span className="input-icon">🔐</span>
              <input
                type="password"
                name="confirmPassword"
                id="reg-confirm-password"
                className="form-input"
                placeholder={t('auth.confirm_password_placeholder')}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            id="register-submit"
            className="btn-primary btn-auth"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : t('auth.register_btn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="auth-link" id="go-login">
            {t('auth.login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}

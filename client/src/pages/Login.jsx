import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      setError(t('auth.phone') + ' ' + t('auth.password'));
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
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
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🚗</div>
          <h1>{t('auth.login_title')}</h1>
          <p>{t('auth.login_subtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className="form-group">
            <label className="form-label">{t('auth.phone')}</label>
            <div className="input-wrapper">
              <span className="input-icon">📞</span>
              <input
                type="tel"
                name="phone"
                id="login-phone"
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
                id="login-password"
                className="form-input"
                placeholder={t('auth.password_placeholder')}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn-primary btn-auth"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : t('auth.login_btn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="auth-link" id="go-register">
            {t('auth.register_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}

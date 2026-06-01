import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const PAYMENT_TYPES = ['cash', 'credit', 'installment'];

export default function BookQueue() {
  const { token } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [selected, setSelected] = useState({
    carId: searchParams.get('car') || '',
    colorValue: '',
    paymentType: '',
    notes: ''
  });

  useEffect(() => {
    axios.get('/api/cars').then(res => {
      setCars(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectedCar = cars.find(c => c.id === selected.carId);
  const selectedColor = selectedCar?.colors.find(c => c.value === selected.colorValue);

  const paymentLabel = {
    cash: t('queue.payment_cash'),
    credit: t('queue.payment_credit'),
    installment: t('queue.payment_installment')
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !selected.carId) {
      setError(lang === 'uz' ? 'Mashina tanlang' : 'Выберите автомобиль');
      return;
    }
    if (step === 2) {
      if (!selected.colorValue) {
        setError(lang === 'uz' ? 'Rang tanlang' : 'Выберите цвет');
        return;
      }
      if (!selected.paymentType) {
        setError(lang === 'uz' ? 'To\'lov turini tanlang' : 'Выберите способ оплаты');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post('/api/queue/book', {
        carId: selected.carId,
        colorValue: selected.colorValue,
        paymentType: selected.paymentType,
        notes: selected.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen"><div className="spinner" /></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h2>{t('queue.success_title')}</h2>
          <p>{t('queue.success_msg')}</p>
          <div className="success-details">
            <div className="success-info-row">
              <span>{t('queue.queue_number')}</span>
              <strong className="queue-num-large">#{success.queueNumber}</strong>
            </div>
            <div className="success-info-row">
              <span>{t('queue.car_model')}</span>
              <strong>{success.carModel}</strong>
            </div>
            <div className="success-info-row">
              <span>{t('queue.color')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="color-dot" style={{ backgroundColor: success.color?.hex, width: '16px', height: '16px' }} />
                {lang === 'uz' ? success.color?.uz : success.color?.ru}
              </span>
            </div>
            <div className="success-info-row">
              <span>{t('queue.payment')}</span>
              <strong>{paymentLabel[success.paymentType]}</strong>
            </div>
          </div>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => navigate('/my-queue')} id="goto-myqueue">
              {t('queue.my_queue')}
            </button>
            <button className="btn-ghost" onClick={() => navigate('/')} id="goto-home">
              {lang === 'uz' ? 'Bosh sahifaga' : 'На главную'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container book-page">
      <div className="page-header">
        <h1>{t('queue.title')}</h1>
        <p>{t('queue.subtitle')}</p>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {[1, 2, 3].map(s => (
          <div key={s} className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
            <div className="progress-step-circle">
              {step > s ? '✓' : s}
            </div>
            <span className="progress-step-label">
              {s === 1 ? t('queue.step1_title') : s === 2 ? t('queue.step2_title') : t('queue.step3_title')}
            </span>
            {s < 3 && <div className={`progress-line ${step > s ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="book-form-card">
        {/* ── Step 1: Select Car ── */}
        {step === 1 && (
          <div className="step-content">
            <h2 className="step-title">{t('queue.step1_title')}</h2>
            <div className="car-select-grid">
              {cars.map(car => (
                <div
                  key={car.id}
                  className={`car-select-card ${selected.carId === car.id ? 'car-selected' : ''}`}
                  onClick={() => setSelected(prev => ({ ...prev, carId: car.id, colorValue: '' }))}
                  id={`select-car-${car.id}`}
                >
                  <div className="car-select-emoji">
                    {car.id === 'onix' ? '🚗' : car.id === 'cobalt' ? '🚙' : '🚐'}
                  </div>
                  <h3>{car.model}</h3>
                  <p className="car-select-price">${car.price.toLocaleString()}</p>
                  <p className="car-select-wait">
                    ⏱ {car.waitingMonthsMin}–{car.waitingMonthsMax} {t('home.months')}
                  </p>
                  {selected.carId === car.id && <div className="selected-check">✓</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && selectedCar && (
          <div className="step-content">
            <h2 className="step-title">{t('queue.step2_title')}</h2>

            <div className="form-section">
              <label className="form-label">{t('queue.select_color')}</label>
              <div className="color-options">
                {selectedCar.colors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`color-option ${selected.colorValue === color.value ? 'color-option-selected' : ''}`}
                    onClick={() => setSelected(prev => ({ ...prev, colorValue: color.value }))}
                    id={`color-${color.value}`}
                  >
                    <span className="color-swatch-lg" style={{ backgroundColor: color.hex }} />
                    <span>{lang === 'uz' ? color.uz : color.ru}</span>
                    {selected.colorValue === color.value && <span className="option-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">{t('queue.select_payment')}</label>
              <div className="payment-options">
                {PAYMENT_TYPES.map(pt => (
                  <button
                    key={pt}
                    type="button"
                    className={`payment-option ${selected.paymentType === pt ? 'payment-selected' : ''}`}
                    onClick={() => setSelected(prev => ({ ...prev, paymentType: pt }))}
                    id={`payment-${pt}`}
                  >
                    <span className="payment-icon">
                      {pt === 'cash' ? '💵' : pt === 'credit' ? '🏦' : '📆'}
                    </span>
                    <span>{paymentLabel[pt]}</span>
                    {selected.paymentType === pt && <span className="option-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">{t('queue.notes')}</label>
              <textarea
                className="form-textarea"
                id="queue-notes"
                placeholder={t('queue.notes_placeholder')}
                value={selected.notes}
                onChange={e => setSelected(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && selectedCar && (
          <div className="step-content">
            <h2 className="step-title">{t('queue.confirm_title')}</h2>
            <div className="confirm-card">
              <div className="confirm-car-emoji">
                {selected.carId === 'onix' ? '🚗' : selected.carId === 'cobalt' ? '🚙' : '🚐'}
              </div>
              <h3 className="confirm-car-name">{selectedCar.model}</h3>

              <div className="confirm-details">
                <div className="confirm-row">
                  <span className="confirm-key">{t('home.price')}</span>
                  <span className="confirm-val price-highlight">${selectedCar.price.toLocaleString()}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">{t('queue.color')}</span>
                  <span className="confirm-val">
                    <span className="color-dot" style={{ backgroundColor: selectedColor?.hex, display: 'inline-block', marginRight: '6px' }} />
                    {lang === 'uz' ? selectedColor?.uz : selectedColor?.ru}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">{t('queue.payment')}</span>
                  <span className="confirm-val">{paymentLabel[selected.paymentType]}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-key">
                    {lang === 'uz' ? 'Kutish muddati' : 'Срок ожидания'}
                  </span>
                  <span className="confirm-val">
                    {selectedCar.waitingMonthsMin}–{selectedCar.waitingMonthsMax} {t('home.months')}
                  </span>
                </div>
                {selected.notes && (
                  <div className="confirm-row">
                    <span className="confirm-key">{lang === 'uz' ? 'Izoh' : 'Заметка'}</span>
                    <span className="confirm-val">{selected.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="step-actions">
          {step > 1 && (
            <button
              className="btn-ghost"
              onClick={() => { setStep(s => s - 1); setError(''); }}
              id="step-back"
            >
              ← {t('queue.back')}
            </button>
          )}
          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext} id="step-next">
              {t('queue.next')} →
            </button>
          ) : (
            <button
              className="btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={submitting}
              id="submit-queue"
            >
              {submitting ? <span className="btn-spinner" /> : `✅ ${t('queue.submit')}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

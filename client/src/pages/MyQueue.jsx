import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import StatusBadge from '../components/StatusBadge';

export default function MyQueue() {
  const { token } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const fetchQueues = useCallback(async () => {
    try {
      const res = await axios.get('/api/queue/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueues(res.data);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => { fetchQueues(); }, [fetchQueues]);

  const handleCancel = async (queueId) => {
    if (!window.confirm(t('queue.cancel_confirm'))) return;
    setCancelling(queueId);
    try {
      await axios.delete(`/api/queue/${queueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQueues();
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const paymentLabel = {
    cash: t('queue.payment_cash'),
    credit: t('queue.payment_credit'),
    installment: t('queue.payment_installment')
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t('queue.my_queue')}</h1>
        <p>{t('queue.my_queue_subtitle')}</p>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {queues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>{t('queue.no_queues')}</h3>
          <p>{t('queue.no_queues_sub')}</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/book')}
            id="empty-book-btn"
          >
            {t('queue.go_book')}
          </button>
        </div>
      ) : (
        <div className="queue-list">
          {queues.map(q => (
            <div key={q.id} className={`queue-card status-card-${q.status}`}>
              <div className="queue-card-header">
                <div className="queue-number-box">
                  <span className="queue-num-label">{t('queue.queue_number')}</span>
                  <span className="queue-num-value">#{q.queueNumber}</span>
                </div>
                <StatusBadge status={q.status} />
              </div>

              <div className="queue-card-body">
                <div className="queue-car-info">
                  <span className="queue-car-emoji">
                    {q.carId === 'onix' ? '🚗' : q.carId === 'cobalt' ? '🚙' : '🚐'}
                  </span>
                  <div>
                    <h3 className="queue-car-model">{q.carModel}</h3>
                    <div className="queue-color-row">
                      <span className="color-dot" style={{ backgroundColor: q.color?.hex }} />
                      <span>{lang === 'uz' ? q.color?.uz : q.color?.ru}</span>
                    </div>
                  </div>
                </div>

                <div className="queue-details-grid">
                  <div className="queue-detail-item">
                    <span className="detail-label">{t('queue.payment')}</span>
                    <span className="detail-value">{paymentLabel[q.paymentType]}</span>
                  </div>
                  <div className="queue-detail-item">
                    <span className="detail-label">{t('queue.created_at')}</span>
                    <span className="detail-value">{formatDate(q.createdAt)}</span>
                  </div>
                  {q.car && (
                    <div className="queue-detail-item">
                      <span className="detail-label">{lang === 'uz' ? 'Kutish muddati' : 'Срок ожидания'}</span>
                      <span className="detail-value">
                        {q.car.waitingMonthsMin}–{q.car.waitingMonthsMax} {t('home.months')}
                      </span>
                    </div>
                  )}
                  <div className="queue-detail-item">
                    <span className="detail-label">{t('queue.position')}</span>
                    <span className="detail-value">#{q.queueNumber}</span>
                  </div>
                </div>

                {q.notes && (
                  <div className="queue-notes">
                    <span className="notes-icon">📝</span>
                    <span>{q.notes}</span>
                  </div>
                )}
              </div>

              {q.status === 'waiting' && (
                <div className="queue-card-footer">
                  <button
                    className="btn-danger-sm"
                    onClick={() => handleCancel(q.id)}
                    disabled={cancelling === q.id}
                    id={`cancel-${q.id}`}
                  >
                    {cancelling === q.id ? '...' : `✕ ${t('queue.cancel_queue')}`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="page-actions">
        <button className="btn-primary" onClick={() => navigate('/book')} id="new-queue-btn">
          + {lang === 'uz' ? 'Yangi navbat olish' : 'Новая очередь'}
        </button>
      </div>
    </div>
  );
}

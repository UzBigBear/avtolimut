import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import StatusBadge from '../components/StatusBadge';

const TABS = ['queues', 'cars', 'users'];

const EMPTY_CAR = {
  id: '', model: '', year: new Date().getFullYear(), price: '',
  availableCount: '', waitingMonthsMin: 1, waitingMonthsMax: 3,
  description_uz: '', description_ru: '',
  colors: []
};
const EMPTY_COLOR = { value: '', uz: '', ru: '', hex: '#ffffff' };

// ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { token } = useAuth();
  const { t, lang } = useLang();

  const [tab, setTab] = useState('queues');
  const [stats, setStats] = useState(null);
  const [queues, setQueues] = useState([]);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updating, setUpdating] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', carId: 'all', search: '' });

  // Car modal state
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null); // null = add, object = edit
  const [carForm, setCarForm] = useState(EMPTY_CAR);
  const [colorForm, setColorForm] = useState(EMPTY_COLOR);
  const [carSaving, setCarSaving] = useState(false);
  const [carError, setCarError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Fetchers ─────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const res = await axios.get('/api/admin/stats', { headers });
    setStats(res.data);
  }, [token]);

  const fetchQueues = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.carId !== 'all') params.append('carId', filters.carId);
    if (filters.search) params.append('search', filters.search);
    const res = await axios.get(`/api/admin/queues?${params}`, { headers });
    setQueues(res.data);
  }, [token, filters]);

  const fetchUsers = useCallback(async () => {
    const res = await axios.get('/api/admin/users', { headers });
    setUsers(res.data);
  }, [token]);

  const fetchCars = useCallback(async () => {
    const res = await axios.get('/api/cars');
    setCars(res.data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      await Promise.all([fetchStats(), fetchQueues(), fetchUsers(), fetchCars()]);
    } catch { setError(t('common.error')); }
    finally { setLoading(false); }
  }, [fetchStats, fetchQueues, fetchUsers, fetchCars, t]);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { fetchQueues(); }, [filters]);

  // ── Queue actions ─────────────────────────────────────────
  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await axios.put(`/api/admin/queue/${id}`, { status }, { headers });
      await Promise.all([fetchQueues(), fetchStats()]);
    } catch { setError(t('common.error')); }
    finally { setUpdating(null); }
  };

  // ── Car modal helpers ─────────────────────────────────────
  const openAddCar = () => {
    setEditingCar(null);
    setCarForm(EMPTY_CAR);
    setColorForm(EMPTY_COLOR);
    setCarError('');
    setShowCarModal(true);
  };

  const openEditCar = (car) => {
    setEditingCar(car);
    setCarForm({ ...car });
    setColorForm(EMPTY_COLOR);
    setCarError('');
    setShowCarModal(true);
  };

  const closeCarModal = () => {
    setShowCarModal(false);
    setCarError('');
  };

  const handleCarFormChange = (field, value) => {
    setCarForm(prev => ({ ...prev, [field]: value }));
  };

  const addColorToForm = () => {
    if (!colorForm.value || !colorForm.uz || !colorForm.ru || !colorForm.hex) {
      setCarError(lang === 'uz' ? 'Barcha rang maydonlarini to\'ldiring' : 'Заполните все поля цвета');
      return;
    }
    if (carForm.colors.find(c => c.value === colorForm.value)) {
      setCarError(lang === 'uz' ? 'Bu rang allaqachon qo\'shilgan' : 'Этот цвет уже добавлен');
      return;
    }
    setCarForm(prev => ({ ...prev, colors: [...prev.colors, { ...colorForm }] }));
    setColorForm(EMPTY_COLOR);
    setCarError('');
  };

  const removeColor = (value) => {
    setCarForm(prev => ({ ...prev, colors: prev.colors.filter(c => c.value !== value) }));
  };

  const saveCar = async () => {
    setCarError('');
    if (!carForm.model.trim()) {
      setCarError(lang === 'uz' ? 'Model nomi kiritilmadi' : 'Введите название модели');
      return;
    }
    if (!carForm.price || Number(carForm.price) <= 0) {
      setCarError(lang === 'uz' ? 'Narx kiritilmadi' : 'Введите цену');
      return;
    }
    if (carForm.colors.length === 0) {
      setCarError(lang === 'uz' ? 'Kamida bitta rang qo\'shing' : 'Добавьте хотя бы один цвет');
      return;
    }
    setCarSaving(true);
    try {
      const payload = {
        ...carForm,
        price: Number(carForm.price),
        year: Number(carForm.year),
        availableCount: Number(carForm.availableCount) || 0,
        waitingMonthsMin: Number(carForm.waitingMonthsMin),
        waitingMonthsMax: Number(carForm.waitingMonthsMax),
      };
      if (editingCar) {
        await axios.put(`/api/cars/${editingCar.id}`, payload, { headers });
        showSuccess(t('admin.car_saved'));
      } else {
        await axios.post('/api/cars', payload, { headers });
        showSuccess(t('admin.car_saved'));
      }
      await fetchCars();
      closeCarModal();
    } catch (err) {
      setCarError(err.response?.data?.message || t('common.error'));
    } finally {
      setCarSaving(false);
    }
  };

  const deleteCar = async (car) => {
    if (!window.confirm(`${t('admin.delete_car_confirm')}\n"${car.model}"`)) return;
    try {
      await axios.delete(`/api/cars/${car.id}`, { headers });
      showSuccess(t('admin.car_deleted'));
      await fetchCars();
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

  const paymentLabel = {
    cash: t('queue.payment_cash'),
    credit: t('queue.payment_credit'),
    installment: t('queue.payment_installment')
  };

  const statCards = stats ? [
    { label: t('admin.total_queues'), value: stats.total, icon: '📋', color: 'blue' },
    { label: t('admin.waiting_queues'), value: stats.waiting, icon: '⏳', color: 'yellow' },
    { label: t('admin.confirmed_queues'), value: stats.confirmed, icon: '✅', color: 'green' },
    { label: t('admin.rejected_queues'), value: stats.rejected, icon: '❌', color: 'red' },
    { label: t('admin.completed_queues'), value: stats.completed, icon: '🎉', color: 'purple' },
    { label: t('admin.total_users'), value: stats.totalUsers, icon: '👥', color: 'cyan' },
  ] : [];

  if (loading) return (
    <div className="page-container"><div className="loading-screen"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-container admin-page">
      <div className="page-header">
        <h1>⚙️ {t('admin.title')}</h1>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {successMsg && <div className="alert alert-success">✅ {successMsg}</div>}

      {/* ── Stats ── */}
      <div className="stats-grid">
        {statCards.map(card => (
          <div key={card.label} className={`stat-card stat-card-${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Model Stats ── */}
      {stats && (
        <div className="model-stats-row">
          <h3>{t('admin.by_model')}</h3>
          <div className="model-bars">
            {[
              { id: 'onix', label: 'Onix', emoji: '🚗' },
              { id: 'cobalt', label: 'Cobalt', emoji: '🚙' },
              { id: 'damas', label: 'Damas', emoji: '🚐' },
            ].map(m => {
              const count = stats.byModel[m.id] || 0;
              const maxCount = Math.max(...Object.values(stats.byModel)) || 1;
              return (
                <div key={m.id} className="model-bar-item">
                  <span className="model-bar-label">{m.emoji} {m.label}</span>
                  <div className="model-bar-track">
                    <div className="model-bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className="model-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="admin-tabs">
        {TABS.map(tb => (
          <button
            key={tb}
            className={`admin-tab ${tab === tb ? 'admin-tab-active' : ''}`}
            onClick={() => setTab(tb)}
            id={`tab-${tb}`}
          >
            {tb === 'queues' ? `📋 ${t('admin.all_queues')}`
              : tb === 'cars' ? `🚗 ${t('admin.cars')}`
              : `👥 ${t('admin.users')}`}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: QUEUES
         ══════════════════════════════════════════════════════ */}
      {tab === 'queues' && (
        <div className="admin-content">
          <div className="filter-bar">
            <input type="text" className="filter-input" id="admin-search"
              placeholder={t('admin.search')} value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
            <select className="filter-select" id="filter-status"
              value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="all">{t('admin.filter_status')}: {t('admin.all')}</option>
              <option value="waiting">{t('queue.waiting')}</option>
              <option value="confirmed">{t('queue.confirmed')}</option>
              <option value="rejected">{t('queue.rejected')}</option>
              <option value="completed">{t('queue.completed')}</option>
            </select>
            <select className="filter-select" id="filter-car"
              value={filters.carId} onChange={e => setFilters(p => ({ ...p, carId: e.target.value }))}>
              <option value="all">{t('admin.filter_car')}: {t('admin.all')}</option>
              {cars.map(c => (
                <option key={c.id} value={c.id}>{c.model}</option>
              ))}
            </select>
            <button className="btn-ghost btn-sm" id="clear-filters"
              onClick={() => setFilters({ status: 'all', carId: 'all', search: '' })}>
              ✕ {lang === 'uz' ? 'Tozalash' : 'Сбросить'}
            </button>
          </div>

          {queues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{t('admin.no_results')}</h3>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.queue_no')}</th>
                    <th>{t('admin.customer')}</th>
                    <th>{t('admin.phone')}</th>
                    <th>{lang === 'uz' ? 'Mashina' : 'Автомобиль'}</th>
                    <th>{t('queue.color')}</th>
                    <th>{t('queue.payment')}</th>
                    <th>{t('admin.date')}</th>
                    <th>{t('queue.status')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map(q => (
                    <tr key={q.id} className={`table-row status-row-${q.status}`}>
                      <td><strong className="queue-no-badge">#{q.queueNumber}</strong></td>
                      <td>{q.userName}</td>
                      <td><a href={`tel:${q.userPhone}`} className="phone-link">{q.userPhone}</a></td>
                      <td>
                        {q.carId === 'onix' ? '🚗' : q.carId === 'cobalt' ? '🚙' : '🚐'} {q.carModel}
                      </td>
                      <td>
                        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span className="color-dot" style={{ backgroundColor: q.color?.hex }} />
                          {lang === 'uz' ? q.color?.uz : q.color?.ru}
                        </span>
                      </td>
                      <td>{paymentLabel[q.paymentType]}</td>
                      <td>{formatDate(q.createdAt)}</td>
                      <td><StatusBadge status={q.status} /></td>
                      <td>
                        <div className="action-btns">
                          {q.status !== 'confirmed' && q.status !== 'completed' && (
                            <button className="action-btn action-confirm" title={t('admin.approve')}
                              onClick={() => updateStatus(q.id,'confirmed')} disabled={updating===q.id} id={`confirm-${q.id}`}>✓</button>
                          )}
                          {q.status !== 'rejected' && q.status !== 'completed' && (
                            <button className="action-btn action-reject" title={t('admin.reject')}
                              onClick={() => updateStatus(q.id,'rejected')} disabled={updating===q.id} id={`reject-${q.id}`}>✕</button>
                          )}
                          {q.status === 'confirmed' && (
                            <button className="action-btn action-complete" title={t('admin.complete')}
                              onClick={() => updateStatus(q.id,'completed')} disabled={updating===q.id} id={`complete-${q.id}`}>🎉</button>
                          )}
                          {q.status !== 'waiting' && q.status !== 'completed' && (
                            <button className="action-btn action-reset" title={t('admin.reset')}
                              onClick={() => updateStatus(q.id,'waiting')} disabled={updating===q.id} id={`reset-${q.id}`}>↺</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CARS
         ══════════════════════════════════════════════════════ */}
      {tab === 'cars' && (
        <div className="admin-content">
          <div className="cars-tab-header">
            <p className="cars-count">
              {lang === 'uz' ? `Jami ${cars.length} ta model` : `Всего моделей: ${cars.length}`}
            </p>
            <button className="btn-primary" onClick={openAddCar} id="add-car-btn">
              + {t('admin.add_car')}
            </button>
          </div>

          <div className="admin-cars-grid">
            {cars.map(car => (
              <div key={car.id} className="admin-car-card">
                <div className="admin-car-header">
                  <div className="admin-car-emoji">
                    {car.id === 'onix' ? '🚗' : car.id === 'cobalt' ? '🚙' : '🚐'}
                  </div>
                  <div>
                    <h3 className="admin-car-model">{car.model}</h3>
                    <span className="admin-car-id">ID: {car.id}</span>
                  </div>
                </div>

                <div className="admin-car-details">
                  <div className="admin-car-detail-row">
                    <span>{lang === 'uz' ? 'Narx' : 'Цена'}</span>
                    <strong className="price-highlight">${car.price.toLocaleString()}</strong>
                  </div>
                  <div className="admin-car-detail-row">
                    <span>{lang === 'uz' ? 'Mavjud' : 'В наличии'}</span>
                    <strong>{car.availableCount}</strong>
                  </div>
                  <div className="admin-car-detail-row">
                    <span>{lang === 'uz' ? 'Kutish' : 'Ожидание'}</span>
                    <strong>{car.waitingMonthsMin}–{car.waitingMonthsMax} {t('home.months')}</strong>
                  </div>
                  <div className="admin-car-detail-row">
                    <span>{lang === 'uz' ? 'Yil' : 'Год'}</span>
                    <strong>{car.year}</strong>
                  </div>
                </div>

                <div className="admin-car-colors">
                  {car.colors.map(c => (
                    <div key={c.value} className="color-dot" style={{ backgroundColor: c.hex }}
                      title={lang === 'uz' ? c.uz : c.ru} />
                  ))}
                  <span className="colors-count">{car.colors.length} {lang === 'uz' ? 'rang' : 'цвет'}</span>
                </div>

                <p className="admin-car-desc">
                  {lang === 'uz' ? car.description_uz : car.description_ru}
                </p>

                <div className="admin-car-actions">
                  <button className="action-btn-lg action-edit" onClick={() => openEditCar(car)} id={`edit-car-${car.id}`}>
                    ✏️ {lang === 'uz' ? 'Tahrirlash' : 'Редактировать'}
                  </button>
                  <button className="action-btn-lg action-del" onClick={() => deleteCar(car)} id={`delete-car-${car.id}`}>
                    🗑 {lang === 'uz' ? 'O\'chirish' : 'Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: USERS
         ══════════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="admin-content">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{lang === 'uz' ? 'Ism' : 'Имя'}</th>
                  <th>{t('admin.phone')}</th>
                  <th>{lang === 'uz' ? 'Ro\'yxat sanasi' : 'Дата регистрации'}</th>
                  <th>{lang === 'uz' ? 'Navbatlar soni' : 'Кол-во очередей'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="user-row">
                        <div className="user-avatar-sm">{u.name?.charAt(0)?.toUpperCase()}</div>
                        {u.name}
                      </div>
                    </td>
                    <td><a href={`tel:${u.phone}`} className="phone-link">{u.phone}</a></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td><span className="queue-count-badge">{u.queueCount}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>{lang === 'uz' ? 'Foydalanuvchilar yo\'q' : 'Пользователи не найдены'}</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CAR MODAL (Add / Edit)
         ══════════════════════════════════════════════════════ */}
      {showCarModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeCarModal()}>
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <h2>{editingCar ? `✏️ ${t('admin.edit_car')}` : `➕ ${t('admin.add_car')}`}</h2>
              <button className="modal-close" onClick={closeCarModal} id="modal-close">✕</button>
            </div>

            {carError && <div className="alert alert-error" style={{margin:'0 0 16px'}}>⚠️ {carError}</div>}

            <div className="modal-body">
              <div className="modal-two-col">
                {/* Left column */}
                <div className="modal-col">
                  {!editingCar && (
                    <div className="form-group">
                      <label className="form-label">{t('admin.car_id')} *</label>
                      <input className="form-input" id="car-id"
                        placeholder="onix, cobalt, my_car..."
                        value={carForm.id}
                        onChange={e => handleCarFormChange('id', e.target.value.toLowerCase().replace(/\s+/g,'_'))} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">{t('admin.car_model')} *</label>
                    <input className="form-input" id="car-model"
                      placeholder="Chevrolet Onix"
                      value={carForm.model}
                      onChange={e => handleCarFormChange('model', e.target.value)} />
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label className="form-label">{t('admin.car_price')} *</label>
                      <input className="form-input" type="number" id="car-price"
                        placeholder="18900"
                        value={carForm.price}
                        onChange={e => handleCarFormChange('price', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('admin.car_year')}</label>
                      <input className="form-input" type="number" id="car-year"
                        placeholder={new Date().getFullYear()}
                        value={carForm.year}
                        onChange={e => handleCarFormChange('year', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label className="form-label">{t('admin.car_wait_min')}</label>
                      <input className="form-input" type="number" id="car-wait-min"
                        value={carForm.waitingMonthsMin}
                        onChange={e => handleCarFormChange('waitingMonthsMin', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('admin.car_wait_max')}</label>
                      <input className="form-input" type="number" id="car-wait-max"
                        value={carForm.waitingMonthsMax}
                        onChange={e => handleCarFormChange('waitingMonthsMax', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.car_available')}</label>
                    <input className="form-input" type="number" id="car-available"
                      value={carForm.availableCount}
                      onChange={e => handleCarFormChange('availableCount', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.car_desc_uz')}</label>
                    <textarea className="form-textarea" id="car-desc-uz" rows={2}
                      placeholder="O'zbek tilida ta'rif..."
                      value={carForm.description_uz}
                      onChange={e => handleCarFormChange('description_uz', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.car_desc_ru')}</label>
                    <textarea className="form-textarea" id="car-desc-ru" rows={2}
                      placeholder="Описание на русском..."
                      value={carForm.description_ru}
                      onChange={e => handleCarFormChange('description_ru', e.target.value)} />
                  </div>
                </div>

                {/* Right column — Colors */}
                <div className="modal-col">
                  <div className="colors-section">
                    <label className="form-label">{t('admin.car_colors')} *</label>

                    {/* Existing colors */}
                    <div className="colors-list">
                      {carForm.colors.length === 0 ? (
                        <p className="no-colors-msg">
                          {lang === 'uz' ? 'Hech qanday rang yo\'q' : 'Нет цветов'}
                        </p>
                      ) : carForm.colors.map(c => (
                        <div key={c.value} className="color-list-item">
                          <span className="color-swatch-lg" style={{ backgroundColor: c.hex }} />
                          <div className="color-list-info">
                            <span>{c.uz} / {c.ru}</span>
                            <span className="color-list-meta">{c.value} · {c.hex}</span>
                          </div>
                          <button className="remove-color-btn" onClick={() => removeColor(c.value)}
                            id={`remove-color-${c.value}`}>✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Add new color */}
                    <div className="add-color-form">
                      <p className="add-color-title">+ {t('admin.add_color')}</p>
                      <div className="form-row-two">
                        <div className="form-group">
                          <label className="form-label">{t('admin.color_value')}</label>
                          <input className="form-input form-input-sm" id="color-value"
                            placeholder="black"
                            value={colorForm.value}
                            onChange={e => setColorForm(p => ({ ...p, value: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('admin.color_hex')}</label>
                          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                            <input type="color" className="color-picker" id="color-hex"
                              value={colorForm.hex}
                              onChange={e => setColorForm(p => ({ ...p, hex: e.target.value }))} />
                            <input className="form-input form-input-sm" placeholder="#1c1c1e"
                              value={colorForm.hex}
                              onChange={e => setColorForm(p => ({ ...p, hex: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      <div className="form-row-two">
                        <div className="form-group">
                          <label className="form-label">{t('admin.color_name_uz')}</label>
                          <input className="form-input form-input-sm" id="color-name-uz"
                            placeholder="Qora"
                            value={colorForm.uz}
                            onChange={e => setColorForm(p => ({ ...p, uz: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('admin.color_name_ru')}</label>
                          <input className="form-input form-input-sm" id="color-name-ru"
                            placeholder="Чёрный"
                            value={colorForm.ru}
                            onChange={e => setColorForm(p => ({ ...p, ru: e.target.value }))} />
                        </div>
                      </div>
                      <button className="btn-ghost btn-sm" onClick={addColorToForm} id="add-color-btn">
                        + {t('admin.add_color')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeCarModal} id="cancel-car">
                {t('common.cancel')}
              </button>
              <button className="btn-primary" onClick={saveCar} disabled={carSaving} id="save-car-btn">
                {carSaving ? <span className="btn-spinner" /> : `💾 ${t('admin.save_car')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

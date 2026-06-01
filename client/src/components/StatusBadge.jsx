import { useLang } from '../context/LangContext';

const statusConfig = {
  waiting:   { uz: 'Kutmoqda',     ru: 'Ожидание',       class: 'status-waiting' },
  confirmed: { uz: 'Tasdiqlangan', ru: 'Подтверждено',   class: 'status-confirmed' },
  rejected:  { uz: 'Rad etilgan',  ru: 'Отклонено',      class: 'status-rejected' },
  completed: { uz: 'Bajarilgan',   ru: 'Завершено',      class: 'status-completed' },
  cancelled: { uz: 'Bekor qilindi',ru: 'Отменено',       class: 'status-cancelled' },
};

export default function StatusBadge({ status }) {
  const { lang } = useLang();
  const config = statusConfig[status] || statusConfig.waiting;

  return (
    <span className={`status-badge ${config.class}`}>
      {lang === 'uz' ? config.uz : config.ru}
    </span>
  );
}

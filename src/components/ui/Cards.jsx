import { Icon } from "./Icon";

export function SummaryCard({ icon, label, value, tone = "neutral" }) {
  return (
    <article className={`summary-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {icon && <Icon name={icon} size={28} />}
    </article>
  );
}

export function MetricCard({ icon, label, value, note, tone }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
      <Icon name={icon} size={28} />
    </article>
  );
}

export function ActivityItem({ icon, title, time }) {
  return (
    <article className="activity-item">
      <span>
        <Icon name={icon} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{time}</p>
      </div>
    </article>
  );
}

export function MetaRow({ icon, label, value, danger }) {
  return (
    <div className="meta-row">
      <span>
        <Icon name={icon} />
        {label}
      </span>
      <strong className={danger ? "danger-text" : ""}>{value}</strong>
    </div>
  );
}

export function SectionBlock({ title, icon, action, children }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <h2>
          {icon && <Icon name={icon} size={20} />} {title}
        </h2>
        {action && <button type="button">{action}</button>}
      </div>
      {children}
    </section>
  );
}

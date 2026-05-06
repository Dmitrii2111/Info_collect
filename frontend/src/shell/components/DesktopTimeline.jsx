import { HistoryOutlined } from "@ant-design/icons";

export function DesktopTimeline({ title, items = [], action }) {
  if (!title || items.length === 0) {
    return null;
  }

  return (
    <section className="desktop-data-card desktop-timeline-card">
      <div className="desktop-data-card-header">
        <h2>{title}</h2>
        <HistoryOutlined aria-hidden="true" />
      </div>
      <div className="desktop-timeline-list">
        {items.map((item) => (
          <article className={`desktop-timeline-item tone-${item.tone ?? "blue"}`} key={`${item.time}-${item.text}`}>
            <span className="desktop-timeline-dot" aria-hidden="true" />
            <small>{item.time}</small>
            <strong>{item.actor}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      {action ? <button className="desktop-panel-action" type="button">{action}</button> : null}
    </section>
  );
}

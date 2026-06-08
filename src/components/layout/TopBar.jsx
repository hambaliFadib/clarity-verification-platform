import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

export function TopBar({ notifications, unreadCount, isNotificationsOpen, onToggleNotifications }) {
  return (
    <header className="top-bar">
      <button className="brand-button" type="button">
        <Icon name="verified" size={24} className="logo-icon" />
        <span>Clarity Platform</span>
      </button>

      <div className="top-spacer" />

      <div className="top-actions">
        <div className="notification-shell">
          <button
            className={`top-icon ${isNotificationsOpen ? "is-active" : ""}`}
            onClick={onToggleNotifications}
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Icon name="bell" size={24} />
            {unreadCount > 0 && <span className="alert-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <section className="notification-panel" aria-label="Recent notifications">
              <header>
                <div>
                  <strong>Notifications</strong>
                  <span>{unreadCount} new update{unreadCount === 1 ? "" : "s"}</span>
                </div>
                <span className="notification-count">{notifications.length}</span>
              </header>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <p className="notification-empty">No team updates yet.</p>
                ) : (
                  notifications.map((notification) => (
                    <article
                      className={`notification-item ${notification.read ? "" : "is-unread"}`}
                      key={notification.id}
                    >
                      <span className={`notification-marker tone-${notification.tone || "info"}`} />
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.body}</p>
                        <time>{notification.time}</time>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        <button className="top-icon" type="button" aria-label="Help">
          <Icon name="help" size={24} />
        </button>
        <div className="top-divider" />
        <div className="user-block">
          <strong>Hambali Fadib</strong>
        </div>
        <Avatar initials="HF" photo />
      </div>
    </header>
  );
}

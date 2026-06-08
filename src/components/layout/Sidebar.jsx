import { navGroups, settingItems } from "../../config/navigation";
import { Icon } from "../ui/Icon";

export function Sidebar({ activeNavId, onNavigate }) {
  return (
    <aside className="side-bar">
      <div className="project-hub">
        <span className="hub-icon">
          <Icon name="token" size={24} />
        </span>
        <div>
          <strong>Project Hub</strong>
          <span>Governance and delivery</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Workspace navigation">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => (
              <button
                className={`nav-item ${activeNavId === item.id ? "is-active" : ""}`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <Icon name={item.icon} size={23} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="side-settings">
        <p>Settings</p>
        {settingItems.map((item) => (
          <button
            className={`nav-item ${activeNavId === item.id ? "is-active" : ""}`}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <Icon name={item.icon} size={23} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

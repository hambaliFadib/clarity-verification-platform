import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

export function TopBar({ searchQuery, onSearch }) {
  return (
    <header className="top-bar">
      <button className="brand-button" type="button">
        <span className="brand-badge">
          <Icon name="check" size={18} />
        </span>
        <span>NexQA</span>
      </button>

      <label className="global-search">
        <Icon name="search" size={22} />
        <input
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search requirements, defects..."
          type="search"
        />
      </label>

      <div className="top-actions">
        <button className="top-icon" type="button" aria-label="Notifications">
          <Icon name="bell" size={24} />
          <span className="alert-dot" />
        </button>
        <button className="top-icon" type="button" aria-label="Help">
          <Icon name="help" size={24} />
        </button>
        <div className="top-divider" />
        <div className="user-block">
          <strong>Hambali Fadib</strong>
          <span>ADMIN</span>
        </div>
        <Avatar initials="HF" photo />
      </div>
    </header>
  );
}

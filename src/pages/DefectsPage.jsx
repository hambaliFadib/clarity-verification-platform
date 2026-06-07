import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ActivityItem, SummaryCard } from "../components/ui/Cards";
import { Icon } from "../components/ui/Icon";

export function DefectsPage({ defects, allDefects, filter, onFilterChange, onReportDefect }) {
  const filters = ["Open", "In Progress", "Resolved", "Closed", "Blocked", "All"];
  const grouped = defects.reduce((acc, defect) => {
    acc[defect.group] = acc[defect.group] || [];
    acc[defect.group].push(defect);
    return acc;
  }, {});

  return (
    <section className="page defects-layout">
      <div className="defects-main">
        <div className="page-heading-row">
          <div>
            <h1>Defects</h1>
            <p>Track and manage bugs found during testing</p>
          </div>
          <Button icon="add" onClick={onReportDefect}>
            Report Defect
          </Button>
        </div>

        <div className="defect-stats">
          <SummaryCard label="Critical" value="0" tone="red" />
          <SummaryCard label="High" value="7" />
          <SummaryCard label="Medium" value="8" />
          <SummaryCard label="Low" value="0" />
        </div>

        <div className="filter-tabs">
          {filters.map((item) => (
            <button
              className={`${filter === item ? "is-active" : ""} ${item === "Blocked" ? "danger" : ""}`}
              key={item}
              onClick={() => onFilterChange(item)}
              type="button"
            >
              {item}{" "}
              <span>
                {item === "All" ? allDefects.length : allDefects.filter((defect) => defect.status === item).length}
              </span>
            </button>
          ))}
        </div>

        <div className="defect-search-row">
          <label>
            <Icon name="filter" size={22} />
            <input placeholder="Search defects..." />
          </label>
          <button className="outline-button" type="button">
            <Icon name="filter" />
            Add filter
          </button>
        </div>

        <div className="defect-groups">
          {Object.entries(grouped).map(([group, groupDefects]) => (
            <section className="defect-group" key={group}>
              <header>
                <span>
                  <Icon name="briefcase" />
                  {group}
                </span>
                <Badge>{groupDefects.length}</Badge>
                <Icon name="chevronDown" />
              </header>
              {groupDefects.map((defect) => (
                <article className="defect-row" key={defect.id}>
                  <div>
                    <Badge tone={defect.severity}>{defect.severity}</Badge>
                    <Badge tone={defect.status}>{defect.status}</Badge>
                    {defect.id === "DEF-402" && <Badge tone="extension">Extension</Badge>}
                  </div>
                  <time>{defect.age}</time>
                  <h3>{defect.title}</h3>
                  <p>{defect.description}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
        <div className="page-footer">
          Showing {defects.length} of {allDefects.length} entries <span className="system-dot">System Operational</span>
        </div>
      </div>

      <aside className="activity-rail">
        <ActivityItem icon="add" title="Hambali Fadib reported a new defect #DEF-402" time="2 hours ago" />
        <ActivityItem icon="check" title="Jane Smith resolved #DEF-389" time="4 hours ago" />
      </aside>
    </section>
  );
}

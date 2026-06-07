import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Checkbox, DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";

export function RequirementsPage({ filter, requirements, total, onCreate, onFilterChange }) {
  const filters = ["All", "In Review", "Draft"];

  return (
    <section className="page">
      <div className="page-heading-row">
        <div>
          <h1>Requirements</h1>
          <p>Manage and track system requirements for your current projects.</p>
        </div>
        <Button icon="add" onClick={onCreate}>
          Create Requirement
        </Button>
      </div>

      <div className="panel table-panel">
        <div className="panel-toolbar">
          <button className="outline-button" type="button">
            <Icon name="filter" size={19} />
            Filter
          </button>
          <div className="vertical-rule" />
          <div className="filter-pills">
            {filters.map((item) => (
              <button
                className={`filter-pill ${filter === item ? "is-active" : ""}`}
                key={item}
                onClick={() => onFilterChange(item)}
                type="button"
              >
                {item} {item === "All" ? `(${total})` : ""}
              </button>
            ))}
          </div>
        </div>

        <DataTable>
          <thead>
            <tr>
              <th>
                <Checkbox />
              </th>
              <th>ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Creator</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((requirement) => (
              <tr key={requirement.id}>
                <td>
                  <Checkbox />
                </td>
                <td className="mono">{requirement.id}</td>
                <td className="strong-cell">{requirement.title}</td>
                <td>
                  <Badge tone={requirement.priority}>{requirement.priority}</Badge>
                </td>
                <td>
                  <Badge tone={requirement.status}>{requirement.status}</Badge>
                </td>
                <td>
                  <span className="person-cell">
                    <Avatar initials={requirement.initials} />
                    {requirement.creator}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <div className="table-footer">
          <span>
            Showing 1 to {requirements.length} of {total} results
          </span>
          <div className="pager">
            <button type="button">
              <Icon name="chevronRight" size={17} />
            </button>
            <button type="button">
              <Icon name="chevronRight" size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { MetricCard } from "../components/ui/Cards";
import { Checkbox, DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { classNameFor } from "../utils/format";

export function TestCasesPage({
  projects,
  menuProjectId,
  onCreateProject,
  onExport,
  onOpenTestCase,
  onProjectAction,
  onToggleMenu,
}) {
  return (
    <section className="page">
      <div className="breadcrumb-line">
        <span>Projects</span>
        <Icon name="chevronRight" size={16} />
        <strong>Active Projects</strong>
      </div>
      <div className="page-heading-row">
        <h1>Project Portfolio</h1>
        <div className="button-row">
          <button className="muted-button" onClick={onExport} type="button">
            <Icon name="download" size={19} />
            Export
          </button>
          <Button icon="add" onClick={onCreateProject}>
            Create Project
          </Button>
        </div>
      </div>

      <div className="portfolio-metrics">
        <MetricCard label="Active Projects" value="24" note="+12% from last month" icon="folder" tone="green" />
        <MetricCard label="At Risk" value="03" note="High severity issues" icon="warning" tone="red" />
        <article className="efficiency-card">
          <span>System Efficiency</span>
          <div>
            <strong>94.2%</strong>
            <div className="wide-progress">
              <span style={{ width: "94.2%" }} />
            </div>
          </div>
        </article>
      </div>

      <div className="panel portfolio-table">
        <div className="panel-toolbar is-spread">
          <div className="button-row">
            <button className="outline-button" type="button">
              <Icon name="filter" size={18} />
              All Projects
              <Icon name="chevronDown" size={17} />
            </button>
            <button className="outline-button" type="button">
              <Icon name="calendar" size={18} />
              Date Range
            </button>
          </div>
          <div className="view-switch">
            <span>Showing 1-10 of 24 cases</span>
            <button className="is-active" type="button">
              <Icon name="table" size={20} />
            </button>
            <button type="button">
              <Icon name="grid" size={20} />
            </button>
          </div>
        </div>

        <DataTable>
          <thead>
            <tr>
              <th>
                <Checkbox />
              </th>
              <th>Project Name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Owner</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>
                  <Checkbox />
                </td>
                <td>
                  <button className="project-link" onClick={() => onOpenTestCase("general")} type="button">
                    <strong>
                      {project.id}: {project.name}
                    </strong>
                    <span>Last sync: {project.sync}</span>
                  </button>
                </td>
                <td>
                  <Badge tone={project.status}>{project.status}</Badge>
                </td>
                <td>
                  <div className="progress-cell">
                    <strong>{project.progress}%</strong>
                    <div className={`mini-progress tone-${classNameFor(project.status)}`}>
                      <span style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </td>
                <td>
                  <span className="person-cell">
                    <Avatar initials={project.ownerInitials} />
                    {project.owner}
                  </span>
                </td>
                <td>
                  <span className={`priority-text tone-${classNameFor(project.priority)}`}>{project.priority}</span>
                </td>
                <td className="actions-cell">
                  <button
                    className="icon-only"
                    onClick={() => onToggleMenu(menuProjectId === project.id ? null : project.id)}
                    type="button"
                  >
                    <Icon name="more" size={20} />
                  </button>
                  {menuProjectId === project.id && (
                    <div className="action-menu">
                      <button onClick={() => onProjectAction("open")} type="button">
                        <Icon name="edit" />
                        Edit
                      </button>
                      <button onClick={() => onProjectAction("clone")} type="button">
                        <Icon name="clone" />
                        Clone
                      </button>
                      <button onClick={() => onProjectAction("archive")} type="button">
                        <Icon name="download" />
                        Archive
                      </button>
                      <button className="danger" onClick={() => onProjectAction("delete")} type="button">
                        <Icon name="delete" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <div className="table-footer">
          <span>
            Rows per page: <strong>10</strong>
          </span>
          <span>1-10 of 24</span>
        </div>
      </div>
    </section>
  );
}

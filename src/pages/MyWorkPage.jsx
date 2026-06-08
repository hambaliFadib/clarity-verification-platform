import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { SummaryCard } from "../components/ui/Cards";
import { Icon } from "../components/ui/Icon";

export function MyWorkPage({ groupedWorkItems, onCreateWork, onEditWork, onMoveWorkItem, onOpenTestCase }) {
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [activeDropLane, setActiveDropLane] = useState(null);
  const totalItems = groupedWorkItems.reduce((sum, lane) => sum + lane.items.length, 0);
  const activeItems = groupedWorkItems.find((lane) => lane.title === "Active")?.items.length || 0;
  const needsAttention = groupedWorkItems.find((lane) => lane.title === "Needs Attention")?.items.length || 0;

  function handleDragStart(event, itemId) {
    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragEnd() {
    setDraggedItemId(null);
    setActiveDropLane(null);
  }

  function handleLaneDragOver(event, laneTitle) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropLane(laneTitle);
  }

  function handleLaneDrop(event, laneTitle) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain") || draggedItemId;

    if (itemId) {
      onMoveWorkItem(itemId, laneTitle);
    }

    handleDragEnd();
  }

  return (
    <section className="page page-my-work">
      <div className="eyebrow">Workspace</div>
      <h1>My Work</h1>

      <div className="summary-grid">
        <SummaryCard icon="folder" label="Total Projects" value="12" />
        <SummaryCard icon="table" label="Active Tasks" value={String(activeItems + totalItems + 14)} tone="blue" />
        <SummaryCard icon="warning" label="Needs Attention" value={`0${needsAttention}`} tone="red" />
        <SummaryCard icon="team" label="Team Load" value="85%" />
      </div>

      <div className="kanban-grid">
        {groupedWorkItems.map((lane) => (
          <section className={`kanban-lane tone-${lane.tone}`} key={lane.title}>
            <div className="lane-header">
              <div>
                <h2>{lane.title}</h2>
                <p>{lane.description}</p>
              </div>
              <strong>{lane.items.length}</strong>
            </div>
            <div
              className={`lane-cards ${activeDropLane === lane.title ? "is-drop-target" : ""}`}
              onDragOver={(event) => handleLaneDragOver(event, lane.title)}
              onDrop={(event) => handleLaneDrop(event, lane.title)}
            >
              {lane.items.map((item) => (
                <article className={`work-card ${draggedItemId === item.id ? "is-dragging" : ""}`} key={item.id}>
                  <div className="card-actions">
                    <Badge>{item.type}</Badge>
                    <Badge tone={item.status}>{item.status}</Badge>
                    <button onClick={onOpenTestCase} type="button" aria-label="View work item">
                      <Icon name="eye" size={21} />
                    </button>
                    <button onClick={onEditWork} type="button" aria-label="Edit work item">
                      <Icon name="edit" size={20} />
                    </button>
                  </div>
                  <h3>{item.title}</h3>
                  <div className="work-meta">
                    <Badge tone={item.priority}>{item.priority}</Badge>
                    {item.days && <Badge tone="blue">{item.days}</Badge>}
                    <Badge tone={item.progress === 100 ? "success" : "info"}>{item.progress}% progress</Badge>
                  </div>
                  <p>Scope: {item.scope}</p>
                  <footer>{item.owner}</footer>
                  <button
                    className="drag-handle"
                    draggable
                    onDragEnd={handleDragEnd}
                    onDragStart={(event) => handleDragStart(event, item.id)}
                    type="button"
                    aria-label={`Move ${item.title}`}
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span key={index} />
                    ))}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button className="floating-button" onClick={onCreateWork} type="button" aria-label="Create work item">
        <Icon name="add" size={34} />
      </button>
      <div className="page-footer">Menampilkan 1-1 dari 1 work item</div>
    </section>
  );
}

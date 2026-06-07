import { testCaseTabs } from "../config/navigation";
import { changeHistory, testCase, testSteps } from "../data/mockData";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { MetaRow, SectionBlock } from "../components/ui/Cards";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";

export function TestCaseDetailPage({
  activeTab,
  comments,
  commentDraft,
  defects,
  expandedSteps,
  testCaseTitle,
  testRuns,
  onAction,
  onChangeComment,
  onEdit,
  onManageTeam,
  onPostComment,
  onReportDefect,
  onTabChange,
  onToggleStep,
}) {
  return (
    <section className="page test-case-page">
      <div className="test-case-top">
        <div>
          <div className="breadcrumb-line">
            <span>Test Cases</span>
            <Icon name="chevronRight" size={16} />
            <Icon name="folder" size={17} />
            <strong>{testCase.suite}</strong>
          </div>
          <div className="test-title-row">
            <span className="test-code">
              AWA-
              <br />
              TC-014
            </span>
            <h1>{testCaseTitle}</h1>
          </div>
        </div>
        <div className="button-row">
          <button className="outline-button strong" onClick={onEdit} type="button">
            <Icon name="edit" />
            Edit
          </button>
          <button className="outline-button strong" onClick={() => onAction("clone")} type="button">
            <Icon name="clone" />
            Clone
          </button>
          <button className="delete-button" onClick={() => onAction("delete")} type="button">
            <Icon name="delete" />
          </button>
        </div>
      </div>

      <div className="detail-tabs" role="tablist" aria-label="Test case details">
        {testCaseTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "is-active" : ""}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <Icon name={tab.icon} size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          {activeTab === "general" && <GeneralTab expandedSteps={expandedSteps} onToggleStep={onToggleStep} />}
          {activeTab === "run-history" && <RunHistoryTab testRuns={testRuns} />}
          {activeTab === "change-history" && <ChangeHistoryTab />}
          {activeTab === "defects" && <LinkedDefectsTab defects={defects} onReportDefect={onReportDefect} />}
          {activeTab === "comments" && (
            <CommentsTab comments={comments} draft={commentDraft} onChange={onChangeComment} onPost={onPostComment} />
          )}
        </div>

        <aside className="detail-side">
          <TestCaseMetaCard />
          <AssigneesCard onManageTeam={onManageTeam} />
        </aside>
      </div>
    </section>
  );
}

function GeneralTab({ expandedSteps, onToggleStep }) {
  return (
    <div className="tab-content">
      <SectionBlock title="Description">
        <div className="content-box">{testCase.description}</div>
      </SectionBlock>
      <SectionBlock title="Pre-conditions" icon="check">
        <div className="content-box dashed">{testCase.preconditions}</div>
      </SectionBlock>
      <SectionBlock title="Steps (5)" icon="list" action="Expand all">
        <div className="steps-list">
          {testSteps.map((step) => {
            const isExpanded = expandedSteps.includes(step.id);
            return (
              <article className={`step-card ${isExpanded ? "is-expanded" : ""}`} key={step.id}>
                <button className="step-summary" onClick={() => onToggleStep(step.id)} type="button">
                  <span>{step.id}</span>
                  <strong>{step.title}</strong>
                  <Icon name={isExpanded ? "chevronDown" : "chevronRight"} />
                </button>
                {isExpanded && (
                  <div className="step-details">
                    <div>
                      <span>Data Input</span>
                      <code>{step.input || "No input required"}</code>
                    </div>
                    <div>
                      <span>Expected Interaction</span>
                      <p>{step.expected || "System continues to the next step."}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </SectionBlock>
      <SectionBlock title="Post-conditions" icon="clipboard">
        <div className="content-box">{testCase.postconditions}</div>
      </SectionBlock>
      <SectionBlock title="Linked Requirements" icon="clone">
        <div className="linked-requirement">
          <Icon name="clipboard" />
          <strong>{testCase.linkedRequirement}</strong>
          <Badge tone="teal">REQ-102</Badge>
        </div>
      </SectionBlock>
    </div>
  );
}

function RunHistoryTab({ testRuns }) {
  return (
    <div className="run-history-card">
      <DataTable>
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Date & Time</th>
            <th>Environment</th>
            <th>Tester</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {testRuns.slice(0, 4).map((run) => (
            <tr key={run.id}>
              <td className="run-id">{run.id}</td>
              <td>
                {run.date}
                <br />- {run.time}
              </td>
              <td>{run.environment}</td>
              <td>{run.tester}</td>
              <td>
                <Badge tone={run.status}>{run.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function ChangeHistoryTab() {
  return (
    <div>
      <div className="section-heading is-inline">
        <h2>Change History</h2>
        <button type="button">Export Log</button>
      </div>
      <div className="history-list">
        {changeHistory.map((item) => (
          <article className="history-item" key={item.id}>
            <span className="history-icon">
              <Icon name={item.id === 1 ? "edit" : item.id === 2 ? "warning" : "team"} />
            </span>
            <div>
              <h3>{item.type}</h3>
              <p>{item.body}</p>
            </div>
            <time>{item.time}</time>
          </article>
        ))}
      </div>
    </div>
  );
}

function LinkedDefectsTab({ defects, onReportDefect }) {
  return (
    <div>
      <div className="section-heading is-inline">
        <h2>Linked Defects ({defects.length})</h2>
        <Button icon="add" onClick={onReportDefect}>
          Report Defect
        </Button>
      </div>
      <div className="linked-defects">
        {defects.slice(0, 3).map((defect) => (
          <article className="linked-defect" key={defect.id}>
            <div>
              <Badge tone="danger-soft">{defect.id.replace("DEF", "BUG")}</Badge>
              <h3>{defect.title}</h3>
              <p>
                {defect.owner} - {defect.age}
              </p>
            </div>
            <div>
              <Badge tone={defect.severity}>{defect.severity}</Badge>
              <strong>{defect.status}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function CommentsTab({ comments, draft, onChange, onPost }) {
  return (
    <div className="comments-tab">
      <div className="comment-composer">
        <Avatar initials="HF" photo />
        <div>
          <textarea value={draft} onChange={(event) => onChange(event.target.value)} placeholder="Add a comment..." rows={4} />
          <Button onClick={onPost}>Post Comment</Button>
        </div>
      </div>
      <div className="comment-list">
        {comments.map((comment) => (
          <article className="comment" key={comment.id}>
            <Avatar initials={comment.initials} photo={comment.initials === "HF"} />
            <div>
              <header>
                <strong>{comment.author}</strong>
                <span>{comment.time}</span>
              </header>
              <p>{comment.body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TestCaseMetaCard() {
  return (
    <article className="meta-card">
      <header>
        <span className="meta-avatar">
          <Icon name="briefcase" />
        </span>
        <div>
          <strong>{testCase.createdBy}</strong>
          <p>Created on {testCase.createdAt}</p>
        </div>
      </header>
      <div className="meta-status">
        <div>
          <span>Status</span>
          <Badge tone={testCase.status}>{testCase.status}</Badge>
        </div>
        <div>
          <span>Priority</span>
          <Badge tone={testCase.priority}>! {testCase.priority}</Badge>
        </div>
      </div>
      <div className="meta-list">
        <MetaRow icon="folder" label="Test Suite" value={testCase.suite} />
        <MetaRow icon="eye" label="Severity" value={testCase.severity} />
        <MetaRow icon="bug" label="Behavior" value={`x ${testCase.behavior}`} danger />
        <MetaRow icon="grid" label="Type" value={testCase.type} />
        <MetaRow icon="clone" label="Layer" value={testCase.layer} />
      </div>
      <div className="automation-box">
        <span>Automation Status</span>
        <strong>AI Generated</strong>
        <p>
          Is Flaky? <b>{testCase.flaky}</b>
        </p>
      </div>
    </article>
  );
}

function AssigneesCard({ onManageTeam }) {
  return (
    <article className="assignees-card">
      <h2>Assignees</h2>
      <div className="avatar-stack">
        <Avatar initials="HF" photo />
        <Avatar initials="SC" />
        <Avatar initials="+2" />
      </div>
      <button className="outline-button full" onClick={onManageTeam} type="button">
        Manage Team
      </button>
    </article>
  );
}

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SummaryCard } from "../components/ui/Cards";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { classNameFor } from "../utils/format";

export function TestRunsPage({ testRuns, onCreateRun }) {
  return (
    <section className="page">
      <div className="page-heading-row">
        <div>
          <h1>Test Runs</h1>
          <p>Overview of test execution batches and progress.</p>
        </div>
        <Button icon="add" onClick={onCreateRun}>
          New Test Run
        </Button>
      </div>

      <div className="summary-grid runs-summary">
        <SummaryCard icon="play" label="Total Runs (Active)" value="24" tone="blue" />
        <SummaryCard icon="check" label="Avg. Pass Rate" value="92.4%" tone="green" />
        <SummaryCard icon="bug" label="Open Defects" value="18" tone="red" />
        <SummaryCard icon="calendar" label="Scheduled" value="5" />
      </div>

      <div className="panel table-panel">
        <div className="panel-title-row">
          <h2>Recent Test Runs</h2>
          <div className="button-row">
            <button className="small-square" type="button">
              <Icon name="filter" />
            </button>
            <button className="small-square" type="button">
              <Icon name="list" />
            </button>
          </div>
        </div>

        <DataTable>
          <thead>
            <tr>
              <th>Run Name</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Pass / Fail</th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testRuns.map((run) => (
              <tr key={run.id}>
                <td>
                  <strong>{run.name}</strong>
                  <span className="subline">
                    Env: {run.environment} | {run.module}
                  </span>
                </td>
                <td>
                  <div className="progress-cell">
                    <div className={`mini-progress tone-${classNameFor(run.status)}`}>
                      <span style={{ width: `${run.progress}%` }} />
                    </div>
                    <span>{run.progress}%</span>
                  </div>
                </td>
                <td>
                  <Badge tone={run.status}>{run.status}</Badge>
                </td>
                <td>
                  <span className="pass-fail">
                    <strong>{run.pass}</strong> / <b>{run.fail}</b>
                  </span>
                </td>
                <td>
                  {run.date}, {run.time}
                </td>
                <td>
                  <button className="icon-only" type="button">
                    <Icon name="more" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </section>
  );
}

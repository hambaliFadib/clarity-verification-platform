import { testCase } from "../../data/mockData";
import { Button } from "../ui/Button";
import { Field, SelectField, TextAreaField } from "../ui/FormFields";

export function ActionModal({ modal, onClose, onSubmit }) {
  const titleMap = {
    "create-project": "Create Project",
    "create-requirement": "Create Requirement",
    "new-run": "New Test Run",
    "report-defect": "Report Defect",
    "create-work": "Create Work Item",
    "edit-testcase": "Edit Test Case",
    "manage-team": "Manage Team",
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card" onSubmit={onSubmit}>
        <header>
          <h2>{titleMap[modal.type]}</h2>
          <button onClick={onClose} type="button">
            x
          </button>
        </header>

        {modal.type === "create-project" && (
          <>
            <Field label="Project name" name="name" defaultValue="New QA Demo Project" />
            <Field label="Owner" name="owner" defaultValue="Hambali Fadib" />
            <Field label="Progress" name="progress" type="number" defaultValue="0" />
            <SelectField label="Priority" name="priority" options={["Critical", "Major", "Minor"]} />
          </>
        )}

        {modal.type === "create-requirement" && (
          <>
            <Field label="Requirement title" name="title" defaultValue="Demo requirement for release sign-off" />
            <SelectField label="Priority" name="priority" options={["High", "Medium", "Low"]} />
            <SelectField label="Status" name="status" options={["Draft", "In Review", "Approved"]} />
          </>
        )}

        {modal.type === "new-run" && (
          <>
            <Field label="Run name" name="name" defaultValue="Demo Regression Run" />
            <Field label="Environment" name="environment" defaultValue="Staging" />
            <Field label="Module" name="module" defaultValue="Auth Module" />
          </>
        )}

        {modal.type === "report-defect" && (
          <>
            <Field label="Defect title" name="title" defaultValue="Demo defect from UI flow" />
            <TextAreaField label="Description" name="description" defaultValue="Describe the issue found during testing." />
            <SelectField label="Severity" name="severity" options={["High", "Medium", "Low"]} />
          </>
        )}

        {modal.type === "create-work" && (
          <>
            <Field label="Work title" name="title" defaultValue="Prepare demo test evidence" />
            <SelectField label="Lane" name="lane" options={["Not Started", "Active", "Needs Attention", "Done"]} />
            <SelectField label="Priority" name="priority" options={["High", "Medium", "Low"]} />
            <Field label="Scope" name="scope" defaultValue="ENERGY / Migration" />
          </>
        )}

        {modal.type === "edit-testcase" && (
          <>
            <Field label="Test case title" name="title" defaultValue={testCase.title} />
            <SelectField label="Priority" name="priority" options={["High", "Medium", "Low"]} />
          </>
        )}

        {modal.type === "manage-team" && (
          <>
            <SelectField label="Reviewer" name="reviewer" options={["Sarah Chen", "Mike Ross", "Jane Doe"]} />
            <SelectField label="Assignee role" name="role" options={["Reviewer", "Executor", "Owner"]} />
          </>
        )}

        <footer>
          <button className="outline-button" onClick={onClose} type="button">
            Cancel
          </button>
          <Button type="submit">Save for Demo</Button>
        </footer>
      </form>
    </div>
  );
}

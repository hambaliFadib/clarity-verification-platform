import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { ActionModal } from "./components/modals/ActionModal";
import { Toast } from "./components/ui/Toast";
import { useClarityDemo } from "./hooks/useClarityDemo";
import { DefectsPage } from "./pages/DefectsPage";
import { MyWorkPage } from "./pages/MyWorkPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RequirementsPage } from "./pages/RequirementsPage";
import { TestCaseDetailPage } from "./pages/TestCaseDetailPage";
import { TestCasesPage } from "./pages/TestCasesPage";
import { TestRunsPage } from "./pages/TestRunsPage";

function App() {
  const { state, actions } = useClarityDemo();

  return (
    <div className="clarity-app">
      <TopBar
        notifications={state.notifications}
        unreadCount={state.unreadNotificationCount}
        isNotificationsOpen={state.isNotificationsOpen}
        onToggleNotifications={actions.toggleNotifications}
      />
      <Sidebar activeNavId={state.activeNavId} onNavigate={actions.navigate} />

      <main className="main-panel">
        {state.activePage === "my-work" && (
          <MyWorkPage
            groupedWorkItems={state.groupedWorkItems}
            onCreateWork={() => actions.openModal("create-work")}
            onEditWork={() => actions.openModal("create-work")}
            onMoveWorkItem={actions.handleMoveWorkItem}
            onOpenTestCase={() => actions.openTestCase("general")}
          />
        )}

        {state.activePage === "requirements" && (
          <RequirementsPage
            filter={state.requirementFilter}
            requirements={state.filteredRequirements}
            total={state.requirements.length}
            onCreate={() => actions.openModal("create-requirement")}
            onFilterChange={actions.setRequirementFilter}
          />
        )}

        {state.activePage === "test-cases" && (
          <TestCasesPage
            projects={state.projects}
            menuProjectId={state.menuProjectId}
            onCreateProject={() => actions.openModal("create-project")}
            onExport={() => actions.handleQuickAction("export")}
            onOpenTestCase={actions.openTestCase}
            onToggleMenu={actions.setMenuProjectId}
            onProjectAction={(action) => {
              if (action === "open") actions.openTestCase("general");
              if (action === "clone") actions.handleQuickAction("clone");
              if (action === "delete") actions.handleQuickAction("delete");
              if (action === "archive") actions.handleQuickAction("archive");
            }}
          />
        )}

        {state.activePage === "test-runs" && (
          <TestRunsPage testRuns={state.testRuns} onCreateRun={() => actions.openModal("new-run")} />
        )}

        {state.activePage === "defects" && (
          <DefectsPage
            defects={state.filteredDefects}
            allDefects={state.defects}
            filter={state.defectFilter}
            onFilterChange={actions.setDefectFilter}
            onReportDefect={() => actions.openModal("report-defect")}
          />
        )}

        {state.activePage === "test-case" && (
          <TestCaseDetailPage
            activeTab={state.activeTab}
            comments={state.comments}
            commentDraft={state.commentDraft}
            defects={state.defects}
            expandedSteps={state.expandedSteps}
            testCaseTitle={state.testCaseTitle}
            testRuns={state.testRuns}
            onAction={actions.handleQuickAction}
            onChangeComment={actions.setCommentDraft}
            onEdit={() => actions.openModal("edit-testcase")}
            onManageTeam={() => actions.openModal("manage-team")}
            onPostComment={actions.handlePostComment}
            onReportDefect={() => actions.openModal("report-defect")}
            onTabChange={actions.setActiveTab}
            onToggleStep={actions.toggleStep}
          />
        )}

        {["environments", "releases", "settings"].includes(state.activePage) && (
          <PlaceholderPage activePage={state.activePage} />
        )}
      </main>

      <Toast message={state.toast} visible={state.isToastVisible} />
      {state.modal && (
        <ActionModal modal={state.modal} onClose={actions.closeModal} onSubmit={actions.handleModalSubmit} />
      )}
    </div>
  );
}

export default App;

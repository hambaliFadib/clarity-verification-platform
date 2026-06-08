import { useEffect, useMemo, useRef, useState } from "react";
import { lanes } from "../config/navigation";
import { testCase } from "../data/mockData";
import {
  createCommentDraft,
  createDefectDraft,
  createProjectDraft,
  createRequirementDraft,
  createTestRunDraft,
  createWorkItemDraft,
  getInitialDemoState,
} from "../services/clarityRepository";

const laneStatusByTitle = {
  "Not Started": "To Do",
  Active: "In Progress",
  "Needs Attention": "Blocked",
  Done: "Completed",
};

function getProgressForLane(lane, currentProgress) {
  if (lane === "Not Started") return 0;
  if (lane === "Active") return currentProgress === 0 ? 30 : currentProgress;
  if (lane === "Done") return 100;
  return currentProgress;
}

export function useClarityDemo() {
  const initialState = getInitialDemoState();
  const [activePage, setActivePage] = useState("my-work");
  const [activeTab, setActiveTab] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [requirementFilter, setRequirementFilter] = useState("All");
  const [defectFilter, setDefectFilter] = useState("Open");
  const [projects, setProjects] = useState(initialState.projects);
  const [requirements, setRequirements] = useState(initialState.requirements);
  const [workItems, setWorkItems] = useState(initialState.workItems);
  const [testRuns, setTestRuns] = useState(initialState.testRuns);
  const [defects, setDefects] = useState(initialState.defects);
  const [comments, setComments] = useState(initialState.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [expandedSteps, setExpandedSteps] = useState(["03"]);
  const [menuProjectId, setMenuProjectId] = useState(null);
  const [modal, setModal] = useState(null);
  const [notifications, setNotifications] = useState(initialState.notifications);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [testCaseTitle, setTestCaseTitle] = useState(testCase.title);
  const toastTimer = useRef(null);

  const activeNavId = activePage === "test-case" ? "test-cases" : activePage;

  const filteredRequirements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return requirements.filter((requirement) => {
      const matchesFilter = requirementFilter === "All" || requirement.status === requirementFilter;
      const matchesSearch =
        !query ||
        requirement.id.toLowerCase().includes(query) ||
        requirement.title.toLowerCase().includes(query) ||
        requirement.creator.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [requirements, requirementFilter, searchQuery]);

  const filteredDefects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return defects.filter((defect) => {
      const matchesFilter = defectFilter === "All" || defect.status === defectFilter;
      const matchesSearch =
        !query ||
        defect.id.toLowerCase().includes(query) ||
        defect.title.toLowerCase().includes(query) ||
        defect.description.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [defects, defectFilter, searchQuery]);

  const groupedWorkItems = useMemo(
    () =>
      lanes.map((lane) => ({
        ...lane,
        items: workItems.filter((item) => item.lane === lane.title),
      })),
    [workItems],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  function addNotification(title, body, tone = "info") {
    setNotifications((current) => [
      {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        body,
        time: "Just now",
        tone,
        read: false,
      },
      ...current,
    ]);
  }

  function showToast(message) {
    setToast(message);
    setIsToastVisible(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setIsToastVisible(false), 2800);
  }

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  function navigate(page) {
    setActivePage(page);
    setMenuProjectId(null);
    setIsNotificationsOpen(false);
  }

  function toggleNotifications() {
    setIsNotificationsOpen((current) => !current);
  }

  function openTestCase(tab = "general") {
    setActivePage("test-case");
    setActiveTab(tab);
    setMenuProjectId(null);
    setIsNotificationsOpen(false);
  }

  function openModal(type, payload = {}) {
    setModal({ type, payload });
    setMenuProjectId(null);
  }

  function closeModal() {
    setModal(null);
  }

  function toggleStep(stepId) {
    setExpandedSteps((current) =>
      current.includes(stepId) ? current.filter((id) => id !== stepId) : [...current, stepId],
    );
  }

  function handleMoveWorkItem(itemId, targetLane) {
    const movedItem = workItems.find((item) => item.id === itemId);

    if (!movedItem || movedItem.lane === targetLane) return;

    setWorkItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              lane: targetLane,
              status: laneStatusByTitle[targetLane] || item.status,
              progress: getProgressForLane(targetLane, item.progress),
            }
          : item,
      ),
    );

    addNotification(
      `${movedItem.title} moved`,
      `Hambali Fadib moved this task from ${movedItem.lane} to ${targetLane}.`,
      "workflow",
    );
    showToast(`Task moved to ${targetLane}`);
  }

  function handlePostComment() {
    if (!commentDraft.trim()) {
      showToast("Tulis komentar dulu sebelum post.");
      return;
    }

    setComments((current) => [createCommentDraft(commentDraft.trim()), ...current]);
    setCommentDraft("");
    addNotification(
      "New comment posted",
      "Hambali Fadib added a new comment to the selected test case.",
      "comment",
    );
    showToast("Comment posted successfully");
  }

  function handleQuickAction(action) {
    if (action === "clone") {
      addNotification("Test case cloned", "Hambali Fadib cloned the selected test case for review.", "success");
      showToast("Test case cloned for demo");
      return;
    }

    if (action === "delete") {
      addNotification("Delete simulated", "Hambali Fadib triggered a delete action in the demo.", "danger");
      showToast("Delete simulated. Backend will handle persistence later.");
      return;
    }

    if (action === "export") {
      showToast("Export prepared for demo");
      return;
    }

    addNotification("Test case updated", `Hambali Fadib completed the ${action} action.`, "info");
    showToast("Action completed");
  }

  function handleModalSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());

    if (modal.type === "create-project") {
      setProjects((current) => [createProjectDraft(data, current.length), ...current]);
      addNotification("Project created", `${data.name || "New Demo Project"} was added to the portfolio.`, "success");
      showToast("Project created locally for demo");
    }

    if (modal.type === "create-requirement") {
      setRequirements((current) => [createRequirementDraft(data, current.length), ...current]);
      addNotification("Requirement created", `${data.title || "New demo requirement"} is ready for review.`, "info");
      showToast("Requirement created locally");
    }

    if (modal.type === "new-run") {
      setTestRuns((current) => [createTestRunDraft(data), ...current]);
      addNotification("Test run scheduled", `${data.name || "New Test Run"} was scheduled locally.`, "workflow");
      showToast("Test run scheduled locally");
    }

    if (modal.type === "report-defect") {
      setDefects((current) => [createDefectDraft(data), ...current]);
      addNotification("Defect reported", `${data.title || "New reported defect"} was added by the team.`, "danger");
      showToast("Defect reported locally");
    }

    if (modal.type === "create-work") {
      setWorkItems((current) => [createWorkItemDraft(data, current.length), ...current]);
      addNotification("Work item added", `${data.title || "New demo work item"} was added to My Work.`, "success");
      showToast("Work item added locally");
    }

    if (modal.type === "edit-testcase") {
      setTestCaseTitle(data.title || testCaseTitle);
      addNotification("Test case updated", "Hambali Fadib updated the test case title.", "info");
      showToast("Test Case updated successfully");
    }

    if (modal.type === "manage-team") {
      addNotification("Team assignment updated", "The assigned review team was updated locally.", "workflow");
      showToast("Team assignment updated locally");
    }

    closeModal();
  }

  return {
    actions: {
      closeModal,
      handleModalSubmit,
      handleMoveWorkItem,
      handlePostComment,
      handleQuickAction,
      navigate,
      openModal,
      openTestCase,
      setActiveTab,
      setCommentDraft,
      setDefectFilter,
      setMenuProjectId,
      setRequirementFilter,
      setSearchQuery,
      toggleStep,
      toggleNotifications,
    },
    state: {
      activeNavId,
      activePage,
      activeTab,
      commentDraft,
      comments,
      defectFilter,
      defects,
      expandedSteps,
      filteredDefects,
      filteredRequirements,
      groupedWorkItems,
      isToastVisible,
      isNotificationsOpen,
      menuProjectId,
      modal,
      notifications,
      projects,
      requirementFilter,
      requirements,
      searchQuery,
      testCaseTitle,
      testRuns,
      toast,
      unreadNotificationCount,
    },
  };
}

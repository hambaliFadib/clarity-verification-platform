import { useMemo, useRef, useState } from "react";
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
} from "../services/nexqaRepository";

export function useNexqaDemo() {
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
  const [toast, setToast] = useState("Test Case updated successfully");
  const [isToastVisible, setIsToastVisible] = useState(true);
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

  function showToast(message) {
    setToast(message);
    setIsToastVisible(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setIsToastVisible(false), 2800);
  }

  function navigate(page) {
    setActivePage(page);
    setMenuProjectId(null);
  }

  function openTestCase(tab = "general") {
    setActivePage("test-case");
    setActiveTab(tab);
    setMenuProjectId(null);
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

  function handlePostComment() {
    if (!commentDraft.trim()) {
      showToast("Tulis komentar dulu sebelum post.");
      return;
    }

    setComments((current) => [createCommentDraft(commentDraft.trim()), ...current]);
    setCommentDraft("");
    showToast("Comment posted successfully");
  }

  function handleQuickAction(action) {
    if (action === "clone") {
      showToast("Test case cloned for demo");
      return;
    }

    if (action === "delete") {
      showToast("Delete simulated. Backend will handle persistence later.");
      return;
    }

    if (action === "export") {
      showToast("Export prepared for demo");
      return;
    }

    showToast("Action completed");
  }

  function handleModalSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());

    if (modal.type === "create-project") {
      setProjects((current) => [createProjectDraft(data, current.length), ...current]);
      showToast("Project created locally for demo");
    }

    if (modal.type === "create-requirement") {
      setRequirements((current) => [createRequirementDraft(data, current.length), ...current]);
      showToast("Requirement created locally");
    }

    if (modal.type === "new-run") {
      setTestRuns((current) => [createTestRunDraft(data), ...current]);
      showToast("Test run scheduled locally");
    }

    if (modal.type === "report-defect") {
      setDefects((current) => [createDefectDraft(data), ...current]);
      showToast("Defect reported locally");
    }

    if (modal.type === "create-work") {
      setWorkItems((current) => [createWorkItemDraft(data, current.length), ...current]);
      showToast("Work item added locally");
    }

    if (modal.type === "edit-testcase") {
      setTestCaseTitle(data.title || testCaseTitle);
      showToast("Test Case updated successfully");
    }

    if (modal.type === "manage-team") {
      showToast("Team assignment updated locally");
    }

    closeModal();
  }

  return {
    actions: {
      closeModal,
      handleModalSubmit,
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
      menuProjectId,
      modal,
      projects,
      requirementFilter,
      requirements,
      searchQuery,
      testCaseTitle,
      testRuns,
      toast,
    },
  };
}

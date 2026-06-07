export const navGroups = [
  {
    title: "Workspace",
    items: [
      { id: "my-work", label: "My Work", icon: "briefcase" },
      { id: "requirements", label: "Requirements", icon: "clipboard" },
    ],
  },
  {
    title: "Testing",
    items: [
      { id: "test-cases", label: "Test Cases", icon: "cube" },
      { id: "test-runs", label: "Test Runs", icon: "play" },
    ],
  },
  {
    title: "Issues",
    items: [{ id: "defects", label: "Defects", icon: "bug" }],
  },
];

export const settingItems = [
  { id: "environments", label: "Environments", icon: "cloud" },
  { id: "releases", label: "Releases", icon: "rocket" },
  { id: "settings", label: "Project Settings", icon: "gear" },
];

export const testCaseTabs = [
  { id: "general", label: "General", icon: "list" },
  { id: "run-history", label: "Run History", icon: "history" },
  { id: "change-history", label: "Change History", icon: "table" },
  { id: "defects", label: "Defects", icon: "bug" },
  { id: "comments", label: "Comments", icon: "message" },
];

export const lanes = [
  {
    title: "Not Started",
    description: "Belum dimulai atau masih draft.",
    tone: "muted",
  },
  {
    title: "Active",
    description: "Sedang berjalan atau sudah siap.",
    tone: "blue",
  },
  {
    title: "Needs Attention",
    description: "Gagal, blocked, rejected, overdue.",
    tone: "red",
  },
  {
    title: "Done",
    description: "Selesai atau passed.",
    tone: "green",
  },
];

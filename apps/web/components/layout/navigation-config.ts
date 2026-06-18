import {
  Bug,
  ClipboardList,
  Cloud,
  FileText,
  FlaskConical,
  PlayCircle,
  Rocket,
  Settings,
  LineChart,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const projectNavGroups: NavGroupConfig[] = [
  {
    title: "Workspace",
    items: [
      { label: "My Work", href: "/my-work", icon: ClipboardList },
      { label: "Requirements", href: "/requirements", icon: FileText },
      { label: "Approvals", href: "/approvals", icon: Shield },
      { label: "Analytics", href: "/analytics", icon: LineChart },
    ],
  },
  {
    title: "Testing",
    items: [
      { label: "Test Cases", href: "/test-cases", icon: FlaskConical },
      { label: "Test Runs", href: "/test-runs", icon: PlayCircle },
    ],
  },
  {
    title: "Issues",
    items: [{ label: "Defects", href: "/defects", icon: Bug }],
  },
  {
    title: "Project",
    items: [
      { label: "Environments", href: "/settings/environments", icon: Cloud },
      { label: "Releases", href: "/settings/releases", icon: Rocket },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const platformNavGroups: NavGroupConfig[] = [
  {
    title: "Platform",
    items: [
      { label: "General", href: "/settings/general", icon: Settings },
    ],
  },
];

export const navGroups = projectNavGroups.filter(g => g.title !== "Project");
export const settingsGroup = projectNavGroups.find(g => g.title === "Project")!;

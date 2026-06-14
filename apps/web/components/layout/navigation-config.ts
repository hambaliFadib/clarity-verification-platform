import {
  Bug,
  ClipboardList,
  Cloud,
  FileText,
  FlaskConical,
  PlayCircle,
  Rocket,
  Settings,
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

export const navGroups: NavGroupConfig[] = [
  {
    title: "Workspace",
    items: [
      { label: "My Work", href: "/my-work", icon: ClipboardList },
      { label: "Requirements", href: "/requirements", icon: FileText },
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
];

export const settingsGroup: NavGroupConfig = {
  title: "Settings",
  items: [
    { label: "Environments", href: "/settings/environments", icon: Cloud },
    { label: "Releases", href: "/settings/releases", icon: Rocket },
    { label: "Project Settings", href: "/settings/project", icon: Settings },
  ],
};

import {
  Activity,
  BadgeAlert,
  Ban,
  CircleDollarSign,
  LayoutDashboard,
  Map,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/auth/types";

export interface NavItem {
  to: string;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  roles?: Role[];
}

// Mirrors docs/design/information-architecture.md §1–2.
export const navItems: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    shortcut: "d",
    icon: LayoutDashboard,
  },
  {
    to: "/kyc",
    label: "KYC queue",
    shortcut: "k",
    icon: ShieldCheck,
    roles: ["kyc.reviewer", "superuser"],
  },
  {
    to: "/disputes",
    label: "Disputes",
    shortcut: "p",
    icon: BadgeAlert,
    roles: ["disputes.agent", "superuser"],
  },
  {
    to: "/finance",
    label: "Finance",
    shortcut: "f",
    icon: CircleDollarSign,
    roles: ["finance.viewer", "finance.ops", "superuser"],
  },
  {
    to: "/ops",
    label: "Operations",
    shortcut: "o",
    icon: Map,
    roles: ["ops.viewer", "superuser"],
  },
  {
    to: "/users",
    label: "Users",
    shortcut: "u",
    icon: Users,
    roles: ["users.admin", "superuser"],
  },
  {
    to: "/prohibited-items",
    label: "Prohibited items",
    shortcut: "b",
    icon: Ban,
    roles: ["ops.viewer", "superuser"],
  },
  {
    to: "/audit",
    label: "Audit log",
    shortcut: "l",
    icon: ScrollText,
    roles: ["superuser"],
  },
];

export const placeholderIcon = Activity;

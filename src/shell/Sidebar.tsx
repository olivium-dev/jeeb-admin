import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { navItems, type NavItem } from "./navItems";
import { env } from "@/lib/env";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { hasAnyRole } = useAuth();
  const width = collapsed
    ? "var(--nav-width-collapsed)"
    : "var(--nav-width-expanded)";

  return (
    <aside
      aria-label="Primary"
      style={{ width }}
      className="flex h-screen flex-col border-r border-border-subtle bg-surface transition-[width] duration-200"
    >
      <Brand collapsed={collapsed} />
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Sections">
        <ul className="space-y-0.5">
          {navItems
            .filter((item) => !item.roles || hasAnyRole(item.roles))
            .map((item) => (
              <li key={item.to}>
                <SidebarLink item={item} collapsed={collapsed} />
              </li>
            ))}
        </ul>
      </nav>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
        className="m-2 flex h-9 items-center gap-2 rounded-md px-2 text-fg-muted hover:bg-hover hover:text-fg"
      >
        {collapsed ? (
          <PanelLeftOpen size={18} strokeWidth={1.5} />
        ) : (
          <>
            <PanelLeftClose size={18} strokeWidth={1.5} />
            <span className="text-sm">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-[var(--header-height)] items-center gap-2 border-b border-border-subtle px-3">
      <div
        aria-hidden
        className="grid size-8 place-items-center rounded-md bg-brand font-bold text-fg-inverse"
      >
        J
      </div>
      {!collapsed && (
        <div className="flex flex-1 items-baseline justify-between">
          <span className="text-sm font-semibold text-fg">JEEB · Admin</span>
          <EnvBadge env={env.env} />
        </div>
      )}
    </div>
  );
}

function EnvBadge({ env: e }: { env: typeof env.env }) {
  const tone =
    e === "production"
      ? "bg-success/12 text-success"
      : e === "staging"
        ? "bg-warning/12 text-warning"
        : "bg-info/12 text-info";
  return (
    <span
      className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {e}
    </span>
  );
}

function SidebarLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
      className={({ isActive }) =>
        [
          "group flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors",
          isActive
            ? "bg-selected text-brand"
            : "text-fg-muted hover:bg-hover hover:text-fg",
        ].join(" ")
      }
    >
      <Icon size={18} strokeWidth={1.5} aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          <kbd className="rounded border border-border-subtle bg-surface-2 px-1.5 text-[10px] font-mono text-fg-faint group-hover:text-fg-muted">
            {item.shortcut}
          </kbd>
        </>
      )}
    </NavLink>
  );
}

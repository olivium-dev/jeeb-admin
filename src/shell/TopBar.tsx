import { useState } from "react";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export function TopBar() {
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  if (!session) return null;

  const initials = session.user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      role="banner"
      className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-5"
    >
      <div className="text-sm text-fg-muted">
        Signed in as <span className="text-fg">{session.user.email}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          className="grid size-9 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
        >
          {theme === "light" ? (
            <Moon size={18} strokeWidth={1.5} />
          ) : (
            <Sun size={18} strokeWidth={1.5} />
          )}
        </button>
        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-hover"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-full bg-brand text-xs font-semibold text-fg-inverse"
            >
              {initials || "?"}
            </span>
            <span className="hidden md:inline">{session.user.name}</span>
            <ChevronDown size={14} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-48 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-elev-2"
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-hover"
              >
                <LogOut size={16} strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

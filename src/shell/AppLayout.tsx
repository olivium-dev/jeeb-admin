import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { navItems } from "./navItems";
import { useAuth } from "@/auth/AuthContext";

const COLLAPSE_KEY = "jeeb-admin:sidebar-collapsed";
const SMALL_SCREEN_BREAKPOINT = 1024;

export function AppLayout() {
  const navigate = useNavigate();
  const { hasAnyRole, noteActivity } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const [smallScreen, setSmallScreen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth < SMALL_SCREEN_BREAKPOINT,
  );

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const onResize = () =>
      setSmallScreen(window.innerWidth < SMALL_SCREEN_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let prefix = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    function onKey(e: KeyboardEvent) {
      noteActivity();
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
      if (e.key === "[") {
        e.preventDefault();
        setCollapsed((c) => !c);
        return;
      }
      if (!prefix && e.key === "g") {
        prefix = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          prefix = false;
        }, 1_000);
        return;
      }
      if (prefix) {
        prefix = false;
        if (timer) clearTimeout(timer);
        const match = navItems.find(
          (i) => i.shortcut === e.key && (!i.roles || hasAnyRole(i.roles)),
        );
        if (match) {
          e.preventDefault();
          navigate(match.to);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [navigate, hasAnyRole, noteActivity]);

  if (smallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main"
          className="min-h-0 flex-1 overflow-auto"
          onMouseDown={noteActivity}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SmallScreenNotice() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold text-fg">
          Use a larger screen
        </h1>
        <p className="text-fg-muted">
          The Jeeb admin panel is built for desktop and tablet (≥ 1024px). It
          is not designed to work on phones. Please switch to a larger device.
        </p>
      </div>
    </div>
  );
}

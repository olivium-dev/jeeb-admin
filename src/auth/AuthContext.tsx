import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api";
import type { Role, Session } from "./types";

// Session lives in memory only — per docs/design/information-architecture.md §5,
// auth state never goes to localStorage. Refresh is via http-only cookie.

interface AuthContextValue {
  session: Session | null;
  status: "loading" | "anonymous" | "authenticated";
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  startLogin: typeof api.startLogin;
  verifyTotp: (input: {
    challengeToken: string;
    code: string;
  }) => Promise<Session>;
  logout: () => Promise<void>;
  noteActivity: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const IDLE_STEP_UP_MS = 30 * 60 * 1000; // 30 minutes — NFR-7.4
const ACCESS_REFRESH_LEEWAY_MS = 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((s: Session) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delay = Math.max(
      5_000,
      s.accessExpiresAt - Date.now() - ACCESS_REFRESH_LEEWAY_MS,
    );
    refreshTimer.current = setTimeout(() => {
      api
        .refresh()
        .then((next) => {
          setSession(next);
          scheduleRefresh(next);
        })
        .catch(() => {
          setSession(null);
          setStatus("anonymous");
        });
    }, delay);
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .refresh()
      .then((s) => {
        if (!mounted) return;
        setSession(s);
        setStatus("authenticated");
        scheduleRefresh(s);
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("anonymous");
      });
    return () => {
      mounted = false;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [scheduleRefresh]);

  const verifyTotp: AuthContextValue["verifyTotp"] = useCallback(
    async (input) => {
      const next = await api.verifyTotp(input);
      setSession(next);
      setStatus("authenticated");
      scheduleRefresh(next);
      return next;
    },
    [scheduleRefresh],
  );

  const logout = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    try {
      await api.logout();
    } finally {
      setSession(null);
      setStatus("anonymous");
    }
  }, []);

  const noteActivity = useCallback(() => {
    setSession((prev) =>
      prev ? { ...prev, lastActivityAt: Date.now() } : prev,
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      hasRole: (role) => !!session?.user.roles.includes(role),
      hasAnyRole: (roles) =>
        !!session && roles.some((r) => session.user.roles.includes(r)),
      startLogin: api.startLogin,
      verifyTotp,
      logout,
      noteActivity,
    }),
    [session, status, verifyTotp, logout, noteActivity],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function isStepUpRequired(session: Session | null): boolean {
  if (!session) return false;
  return Date.now() - session.lastActivityAt > IDLE_STEP_UP_MS;
}

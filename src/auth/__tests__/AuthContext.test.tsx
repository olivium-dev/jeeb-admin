import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";
import * as api from "../api";
import type { Session } from "../types";

function FakeConsumer() {
  const { status, session, hasRole } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{session?.user.email ?? "—"}</span>
      <span data-testid="is-superuser">
        {hasRole("superuser") ? "yes" : "no"}
      </span>
    </div>
  );
}

const sampleSession: Session = {
  accessToken: "tok",
  accessExpiresAt: Date.now() + 60 * 60 * 1000,
  sessionExpiresAt: Date.now() + 12 * 60 * 60 * 1000,
  lastActivityAt: Date.now(),
  user: {
    id: "u1",
    email: "ada@jeeb.io",
    name: "Ada Lovelace",
    roles: ["superuser"],
  },
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("transitions loading → authenticated when refresh succeeds", async () => {
    vi.spyOn(api, "refresh").mockResolvedValue(sampleSession);
    render(
      <AuthProvider>
        <FakeConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("email")).toHaveTextContent("ada@jeeb.io");
    expect(screen.getByTestId("is-superuser")).toHaveTextContent("yes");
  });

  it("falls back to anonymous when refresh fails", async () => {
    vi.spyOn(api, "refresh").mockRejectedValue(new Error("no session"));
    render(
      <AuthProvider>
        <FakeConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous"),
    );
  });

  it("logs out and clears session", async () => {
    vi.spyOn(api, "refresh").mockResolvedValue(sampleSession);
    vi.spyOn(api, "logout").mockResolvedValue();

    function WithLogout() {
      const { status, logout } = useAuth();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => void logout()}>Sign out</button>
        </div>
      );
    }
    render(
      <AuthProvider>
        <WithLogout />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(
      screen.getByRole("button", { name: /sign out/i }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous"),
    );
  });
});

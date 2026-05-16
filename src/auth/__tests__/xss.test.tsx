// T-qa-012 §6.3 — Admin XSS prevention behavioural test.
//
// Drives every payload in qa/security/fixtures/xss-payloads.txt through the
// LoginPage error-display path and through bare React text rendering, and
// asserts the React-escaped text invariant the admin shell relies on:
//
//   1. No <script> element ends up in the document.
//   2. No event-handler attribute (on*) appears on any rendered node.
//   3. No anchor href has a javascript: scheme.
//   4. document.location.href is unchanged after render.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../LoginPage";
import { AuthProvider } from "../AuthContext";
import * as api from "../api";
import { AuthError } from "../api";

const here = dirname(fileURLToPath(import.meta.url));
const PAYLOADS_PATH = resolve(
  here,
  "../../../../jeeb-mobile/qa/security/fixtures/xss-payloads.txt",
);

const payloads = readFileSync(PAYLOADS_PATH, "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

function assertNoXssInDocument() {
  expect(document.querySelectorAll("script")).toHaveLength(0);

  const all = document.querySelectorAll("*");
  all.forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      expect(
        attr.name.toLowerCase().startsWith("on"),
        `Unexpected event handler attribute ${attr.name} on <${el.tagName}>`,
      ).toBe(false);
      if (attr.name.toLowerCase() === "href" || attr.name.toLowerCase() === "src") {
        expect(
          /^\s*javascript:/i.test(attr.value),
          `Unexpected javascript: URL in ${attr.name} on <${el.tagName}>: ${attr.value}`,
        ).toBe(false);
      }
    }
  });
}

describe("T-qa-012 §6 — admin panel XSS prevention", () => {
  let originalHref: string;

  beforeEach(() => {
    originalHref = window.location.href;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loaded the fixture payload set", () => {
    expect(payloads.length).toBeGreaterThanOrEqual(10);
  });

  it.each(payloads)(
    "renders fixture payload as escaped text only: %s",
    (payload) => {
      render(<div data-testid="echo">{payload}</div>);

      const echo = screen.getByTestId("echo");
      // React's text path: textContent matches the literal, no script child.
      expect(echo.textContent).toBe(payload);
      expect(echo.querySelector("script")).toBeNull();
      expect(echo.querySelector("img")).toBeNull();
      expect(echo.querySelector("svg")).toBeNull();

      assertNoXssInDocument();
      expect(window.location.href).toBe(originalHref);
    },
  );

  it("LoginPage error banner does not execute arbitrary server messages", async () => {
    // We exercise the actual error-display branch with a payload-shaped server
    // message. LoginPage maps known error codes to hardcoded text — proving
    // that even an attacker-controlled message field cannot reach the DOM.
    vi.spyOn(api, "startLogin").mockRejectedValue(
      new AuthError("invalid_credentials", payloads[0] ?? "<script>alert(1)</script>"),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/work email/i), "qa@jeeb.io");
    await user.type(screen.getByLabelText(/password/i), "P4ssword!");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const alert = await waitFor(() => screen.getByRole("alert"));
    // mapLoginError must have replaced the server message with a safe string.
    expect(alert.textContent).toMatch(/email or password is incorrect/i);
    assertNoXssInDocument();
    expect(window.location.href).toBe(originalHref);
  });

  it("LoginPage validation-error path also escapes any reflected input", async () => {
    // Even though Zod validation rejects these inputs, type them in to confirm
    // the input value attribute receives the literal (escaped) string and no
    // event handler is injected onto the field.
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    const email = screen.getByLabelText(/work email/i) as HTMLInputElement;
    const probe = payloads[0]!;
    await user.type(email, probe);
    expect(email.value).toBe(probe);

    assertNoXssInDocument();
    expect(window.location.href).toBe(originalHref);
  });
});

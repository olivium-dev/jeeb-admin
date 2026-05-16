import { env } from "@/lib/env";
import type { LoginChallenge, LoginErrorBody, Session } from "./types";

const json = { "Content-Type": "application/json" };

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers: json,
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as LoginErrorBody | null;
    throw new AuthError(
      err?.code ?? "server_error",
      err?.message ?? `Request failed (${res.status})`,
    );
  }
  return (await res.json()) as T;
}

export class AuthError extends Error {
  constructor(
    public code: LoginErrorBody["code"],
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Step 1: exchange email+password for a 2FA challenge ticket. */
export function startLogin(input: {
  email: string;
  password: string;
}): Promise<LoginChallenge> {
  return postJson<LoginChallenge>("/v1/admin/auth/login", input);
}

/** Step 2: exchange challenge + TOTP for a session. */
export function verifyTotp(input: {
  challengeToken: string;
  code: string;
}): Promise<Session> {
  return postJson<Session>("/v1/admin/auth/2fa", input);
}

/** Refresh the access token using the http-only refresh cookie. */
export function refresh(): Promise<Session> {
  return postJson<Session>("/v1/admin/auth/refresh", {});
}

export async function logout(): Promise<void> {
  await fetch(`${env.apiBaseUrl}/v1/admin/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export type Role =
  | "kyc.reviewer"
  | "disputes.agent"
  | "finance.viewer"
  | "finance.ops"
  | "ops.viewer"
  | "users.admin"
  | "superuser";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: Role[];
}

export interface Session {
  accessToken: string;
  /** Epoch ms when the access token expires. */
  accessExpiresAt: number;
  /** Epoch ms when the session as a whole (refresh) expires. */
  sessionExpiresAt: number;
  /** Epoch ms of last user interaction; used for idle step-up (NFR-7.4). */
  lastActivityAt: number;
  user: AdminUser;
}

export interface LoginChallenge {
  /** Opaque ticket returned from password step, consumed by 2FA step. */
  challengeToken: string;
  /** Seconds until the 2FA challenge expires. */
  expiresInSeconds: number;
}

export interface LoginErrorBody {
  code:
    | "invalid_credentials"
    | "account_locked"
    | "rate_limited"
    | "totp_invalid"
    | "totp_expired"
    | "server_error";
  message: string;
}

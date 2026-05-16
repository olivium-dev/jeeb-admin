import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthError } from "./api";
import { useAuth } from "./AuthContext";
import { AuthShell } from "./LoginPage";

interface LocationState {
  challengeToken?: string;
  expiresInSeconds?: number;
  from?: string;
}

export function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const { verifyTotp } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    state.expiresInSeconds ?? 300,
  );

  useEffect(() => {
    if (!state.challengeToken) return;
    const i = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1_000);
    return () => clearInterval(i);
  }, [state.challengeToken]);

  if (!state.challengeToken) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator.");
      return;
    }
    if (!state.challengeToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await verifyTotp({
        challengeToken: state.challengeToken,
        code,
      });
      navigate(state.from ?? "/", { replace: true });
    } catch (err) {
      const msg =
        err instanceof AuthError ? map2faError(err) : "Verification failed.";
      setError(msg);
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Two-factor verification"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="totp"
            className="block text-sm font-medium text-fg-muted"
          >
            Verification code
          </label>
          <input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!error}
            aria-describedby={error ? "totp-error" : "totp-help"}
            className="h-12 w-full rounded-md border border-border-strong bg-surface px-3 text-center text-lg tracking-[0.5em] tabular-nums text-fg outline-none focus:border-brand"
          />
          <p
            id="totp-help"
            className="text-xs text-fg-faint"
            aria-live="polite"
          >
            {secondsLeft > 0
              ? `Expires in ${formatRemaining(secondsLeft)}`
              : "Code expired — go back and start over."}
          </p>
        </div>
        {error && (
          <p id="totp-error" role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || secondsLeft === 0}
          className="h-10 w-full rounded-md bg-brand px-4 text-fg-inverse font-medium hover:bg-brand-hover active:bg-brand-pressed disabled:opacity-60"
        >
          {submitting ? "Verifying…" : "Verify"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="block w-full text-center text-sm text-fg-muted hover:text-fg"
        >
          Use a different account
        </button>
      </form>
    </AuthShell>
  );
}

function map2faError(err: AuthError): string {
  switch (err.code) {
    case "totp_invalid":
      return "That code didn’t match. Try again.";
    case "totp_expired":
      return "The code expired. Start over from sign-in.";
    case "rate_limited":
      return "Too many attempts. Wait a minute, then retry.";
    default:
      return "Verification failed. Try again.";
  }
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

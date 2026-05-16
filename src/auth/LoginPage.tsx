import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthError } from "./api";
import { useAuth } from "./AuthContext";

const schema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(8, "At least 8 characters"),
});

type FieldErrors = Partial<Record<"email" | "password" | "form", string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const { startLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const next: FieldErrors = {};
      const emailErr = flat.fieldErrors.email?.[0];
      const passwordErr = flat.fieldErrors.password?.[0];
      if (emailErr) next.email = emailErr;
      if (passwordErr) next.password = passwordErr;
      setErrors(next);
      return;
    }
    setSubmitting(true);
    try {
      const challenge = await startLogin(parsed.data);
      navigate("/2fa", {
        state: {
          challengeToken: challenge.challengeToken,
          expiresInSeconds: challenge.expiresInSeconds,
        },
      });
    } catch (err) {
      const msg =
        err instanceof AuthError
          ? mapLoginError(err)
          : "Something went wrong. Try again.";
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Sign in to Jeeb Admin" subtitle="Use your work account.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="email"
          label="Work email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          error={errors.email}
          required
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          required
        />
        {errors.form && (
          <p role="alert" className="text-sm text-danger">
            {errors.form}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="h-10 w-full rounded-md bg-brand px-4 text-fg-inverse font-medium transition-colors hover:bg-brand-hover active:bg-brand-pressed disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Continue"}
        </button>
      </form>
    </AuthShell>
  );
}

function mapLoginError(err: AuthError): string {
  switch (err.code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "account_locked":
      return "This account is locked. Contact a superuser.";
    case "rate_limited":
      return "Too many attempts. Try again in a minute.";
    default:
      return "Something went wrong. Try again.";
  }
}

interface FieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (next: string) => void;
  error?: string | undefined;
  required?: boolean;
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  error,
  required,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-fg-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-fg outline-none transition-colors focus:border-brand"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface p-6 shadow-elev-2">
        <div className="mb-5 space-y-1">
          <div className="text-xs font-semibold tracking-wide text-brand">
            JEEB · ADMIN
          </div>
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

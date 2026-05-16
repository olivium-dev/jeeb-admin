import { useAuth } from "@/auth/AuthContext";

export function DashboardPage() {
  const { session } = useAuth();
  return (
    <section className="mx-auto max-w-5xl px-8 py-10">
      <header className="space-y-1">
        <p className="text-sm text-fg-muted">
          Welcome back, {session?.user.name.split(" ")[0] ?? "admin"}.
        </p>
        <h1 className="text-xl font-semibold text-fg">Dashboard</h1>
      </header>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Your role" body={session?.user.roles.join(", ") ?? "—"} />
        <Card
          title="Session"
          body={`Expires ${
            session
              ? new Date(session.sessionExpiresAt).toLocaleTimeString()
              : "—"
          }`}
        />
        <Card
          title="Next steps"
          body="Per-section widgets land in T-web-002 (KYC), T-web-004 (Disputes), T-web-005 (Finance)."
        />
      </div>
    </section>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-4 shadow-elev-1">
      <h2 className="text-xs font-medium uppercase tracking-wide text-fg-faint">
        {title}
      </h2>
      <p className="mt-2 text-sm text-fg">{body}</p>
    </article>
  );
}

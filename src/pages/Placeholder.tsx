interface PlaceholderProps {
  title: string;
  description: string;
  ticket: string;
}

export function Placeholder({ title, description, ticket }: PlaceholderProps) {
  return (
    <section className="mx-auto max-w-5xl px-8 py-10">
      <header className="space-y-1 border-b border-border-subtle pb-5">
        <h1 className="text-xl font-semibold text-fg">{title}</h1>
        <p className="text-sm text-fg-muted">{description}</p>
      </header>
      <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-surface-2 p-8 text-center">
        <p className="text-fg-muted">
          This surface is wired into the shell but not yet implemented.
        </p>
        <p className="mt-1 text-xs text-fg-faint">
          Tracked under {ticket}.
        </p>
      </div>
    </section>
  );
}

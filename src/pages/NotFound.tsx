import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md px-8 py-16 text-center">
      <h1 className="text-2xl font-semibold text-fg">404</h1>
      <p className="mt-2 text-fg-muted">
        That route doesn’t exist in the admin panel.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand-hover"
      >
        Back to dashboard
      </Link>
    </section>
  );
}

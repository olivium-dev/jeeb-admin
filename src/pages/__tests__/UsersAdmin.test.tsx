import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { UsersAdminPage } from "../UsersAdmin";

function rowFor(name: string) {
  return screen
    .getByRole("cell", { name: new RegExp(name, "i") })
    .closest("tr")!;
}

describe("<UsersAdminPage />", () => {
  it("renders the seed list with roles, rating, and delivery count", () => {
    render(<UsersAdminPage />);
    expect(
      screen.getByRole("heading", { name: /^users$/i, level: 1 }),
    ).toBeInTheDocument();

    const salem = rowFor("Salem Al-Otaibi");
    expect(within(salem).getByText(/rider/i)).toBeInTheDocument();
    expect(within(salem).getByText(/courier/i)).toBeInTheDocument();
    expect(within(salem).getByText("4.8")).toBeInTheDocument();
    expect(within(salem).getByText("184")).toBeInTheDocument();
  });

  it("searches by name, phone, and email", async () => {
    const user = userEvent.setup();
    render(<UsersAdminPage />);

    const search = screen.getByLabelText(/search users/i);

    await user.type(search, "lina");
    expect(screen.getByText("Lina Haddad")).toBeInTheDocument();
    expect(screen.queryByText("Salem Al-Otaibi")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "+966 56 220");
    expect(screen.getByText("Khalid R.")).toBeInTheDocument();
    expect(screen.queryByText("Lina Haddad")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "mira.saad@example.com");
    expect(screen.getByText("Mira Saad")).toBeInTheDocument();
    expect(screen.queryByText("Khalid R.")).not.toBeInTheDocument();
  });

  it("opens the profile drawer with delivery history", async () => {
    const user = userEvent.setup();
    render(<UsersAdminPage />);

    await user.click(
      screen.getByRole("button", { name: /view profile for salem al-otaibi/i }),
    );
    const drawer = screen.getByRole("dialog", { name: /salem al-otaibi/i });
    expect(
      within(drawer).getByRole("heading", { name: /delivery history/i }),
    ).toBeInTheDocument();
    // history rows
    expect(within(drawer).getByText(/Riyadh → Diriyah/i)).toBeInTheDocument();
    expect(within(drawer).getAllByText(/delivered/i).length).toBeGreaterThan(0);
  });

  it("suspends an active user with a reason and note, then unsuspends", async () => {
    const user = userEvent.setup();
    render(<UsersAdminPage />);

    await user.click(
      screen.getByRole("button", { name: /view profile for lina haddad/i }),
    );
    const drawer = screen.getByRole("dialog", { name: /lina haddad/i });
    await user.click(
      within(drawer).getByRole("button", { name: /suspend user/i }),
    );

    const confirm = screen.getByRole("dialog", { name: /suspend lina haddad/i });

    // Validation: empty reason + note should block submission and show errors.
    await user.click(within(confirm).getByRole("button", { name: /^suspend$/i }));
    expect(within(confirm).getAllByRole("alert").length).toBeGreaterThan(0);

    await user.selectOptions(
      within(confirm).getByLabelText(/reason/i),
      "policy_violation",
    );
    await user.type(
      within(confirm).getByLabelText(/note/i),
      "Repeated abusive messages to courier.",
    );
    await user.click(within(confirm).getByRole("button", { name: /^suspend$/i }));

    // Confirm dialog closes; profile drawer reflects suspension and exposes Unsuspend.
    expect(
      screen.queryByRole("dialog", { name: /suspend lina haddad/i }),
    ).not.toBeInTheDocument();
    const refreshed = screen.getByRole("dialog", { name: /lina haddad/i });
    expect(
      within(refreshed).getAllByText(/^suspended$/i).length,
    ).toBeGreaterThan(0);
    expect(
      within(refreshed).getByText(/repeated abusive messages/i),
    ).toBeInTheDocument();
    expect(within(refreshed).getByText(/policy violation/i)).toBeInTheDocument();

    // Unsuspend round-trip.
    await user.click(
      within(refreshed).getByRole("button", { name: /unsuspend user/i }),
    );
    const after = screen.getByRole("dialog", { name: /lina haddad/i });
    expect(within(after).getByText(/^active$/i)).toBeInTheDocument();
    expect(
      within(after).getByRole("button", { name: /suspend user/i }),
    ).toBeInTheDocument();
  });

  it("filters by suspended status", async () => {
    const user = userEvent.setup();
    render(<UsersAdminPage />);

    expect(screen.getByText("Salem Al-Otaibi")).toBeInTheDocument();
    expect(screen.getByText("Khalid R.")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^suspended/i }));

    expect(screen.queryByText("Salem Al-Otaibi")).not.toBeInTheDocument();
    expect(screen.getByText("Khalid R.")).toBeInTheDocument();
  });

  it("shows an empty state when search has no matches", async () => {
    const user = userEvent.setup();
    render(<UsersAdminPage />);

    await user.type(screen.getByLabelText(/search users/i), "zzzzz-nomatch");
    expect(screen.getByText(/no users match your search/i)).toBeInTheDocument();
  });
});

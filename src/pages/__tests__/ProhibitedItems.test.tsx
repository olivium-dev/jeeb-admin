import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProhibitedItemsPage } from "../ProhibitedItems";

function rowFor(name: string) {
  return screen.getByRole("cell", { name: new RegExp(name, "i") }).closest("tr")!;
}

describe("<ProhibitedItemsPage />", () => {
  it("renders the seed list with category and status", () => {
    render(<ProhibitedItemsPage />);
    expect(
      screen.getByRole("heading", { name: /prohibited items/i, level: 1 }),
    ).toBeInTheDocument();

    const firearms = rowFor("Firearms and ammunition");
    expect(within(firearms).getByText(/weapons/i)).toBeInTheDocument();
    expect(within(firearms).getByText(/^active$/i)).toBeInTheDocument();

    const counterfeit = rowFor("Counterfeit currency");
    expect(within(counterfeit).getByText(/^inactive$/i)).toBeInTheDocument();
  });

  it("adds a new prohibited item via the dialog", async () => {
    const user = userEvent.setup();
    render(<ProhibitedItemsPage />);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/item name/i),
      "Lithium battery packs",
    );
    await user.selectOptions(
      within(dialog).getByLabelText(/category/i),
      "hazardous",
    );
    await user.type(
      within(dialog).getByLabelText(/description/i),
      "Loose lithium-ion cells.",
    );
    await user.click(within(dialog).getByRole("button", { name: /add item/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Lithium battery packs")).toBeInTheDocument();
  });

  it("edits an existing item", async () => {
    const user = userEvent.setup();
    render(<ProhibitedItemsPage />);

    await user.click(
      screen.getByRole("button", { name: /edit firearms and ammunition/i }),
    );
    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/item name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Firearms (all types)");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Firearms (all types)")).toBeInTheDocument();
    expect(
      screen.queryByText("Firearms and ammunition"),
    ).not.toBeInTheDocument();
  });

  it("requires confirmation before deactivating", async () => {
    const user = userEvent.setup();
    render(<ProhibitedItemsPage />);

    const alcoholRow = rowFor("Alcoholic beverages");
    expect(within(alcoholRow).getByText(/^active$/i)).toBeInTheDocument();

    await user.click(
      within(alcoholRow).getByRole("button", {
        name: /deactivate alcoholic beverages/i,
      }),
    );
    const confirm = screen.getByRole("dialog");
    expect(
      within(confirm).getByRole("heading", { name: /deactivate/i }),
    ).toBeInTheDocument();

    // Cancel keeps it active.
    await user.click(within(confirm).getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      within(rowFor("Alcoholic beverages")).getByText(/^active$/i),
    ).toBeInTheDocument();

    // Re-open and confirm.
    await user.click(
      within(rowFor("Alcoholic beverages")).getByRole("button", {
        name: /deactivate alcoholic beverages/i,
      }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^deactivate$/i,
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      within(rowFor("Alcoholic beverages")).getByText(/^inactive$/i),
    ).toBeInTheDocument();
  });

  it("filters inactive items out by default and shows them when toggled", async () => {
    const user = userEvent.setup();
    render(<ProhibitedItemsPage />);

    expect(screen.getByText("Counterfeit currency")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^active$/i }));
    expect(screen.queryByText("Counterfeit currency")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^inactive$/i }));
    expect(screen.getByText("Counterfeit currency")).toBeInTheDocument();
    expect(
      screen.queryByText("Firearms and ammunition"),
    ).not.toBeInTheDocument();
  });

  it("validates required name when adding", async () => {
    const user = userEvent.setup();
    render(<ProhibitedItemsPage />);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /add item/i }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      /at least 2 characters/i,
    );
  });
});

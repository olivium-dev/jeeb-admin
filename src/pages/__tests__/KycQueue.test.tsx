import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { KycQueuePage } from "../KycQueue";

function rowFor(name: string) {
  return screen.getByText(name).closest("tr")!;
}

describe("<KycQueuePage />", () => {
  it("renders queue header and pending submissions by default", () => {
    render(<KycQueuePage />);
    expect(
      screen.getByRole("heading", { name: /kyc review queue/i, level: 1 }),
    ).toBeInTheDocument();

    expect(rowFor("Salem Al-Otaibi")).toBeInTheDocument();
    expect(rowFor("Lina Haddad")).toBeInTheDocument();

    // Decided submissions are hidden from the default Pending tab.
    expect(screen.queryByText("Rami N.")).not.toBeInTheDocument();
  });

  it("shows queue metrics cards", () => {
    render(<KycQueuePage />);
    const group = screen.getByRole("group", { name: /queue metrics/i });
    expect(within(group).getByText(/queue depth/i)).toBeInTheDocument();
    expect(within(group).getByText(/avg review time/i)).toBeInTheDocument();
    expect(within(group).getByText(/oldest pending/i)).toBeInTheDocument();
    expect(within(group).getByText(/decided last 24h/i)).toBeInTheDocument();
  });

  it("opens the review drawer and shows ID, selfie and vehicle registration tabs", async () => {
    const user = userEvent.setup();
    render(<KycQueuePage />);

    await user.click(
      within(rowFor("Salem Al-Otaibi")).getByRole("button", {
        name: /review salem al-otaibi/i,
      }),
    );
    const drawer = screen.getByRole("dialog");
    const tabs = within(drawer).getByRole("tablist", {
      name: /document tabs/i,
    });
    expect(within(tabs).getByRole("tab", { name: /id front/i })).toBeInTheDocument();
    expect(within(tabs).getByRole("tab", { name: /id back/i })).toBeInTheDocument();
    expect(within(tabs).getByRole("tab", { name: /selfie/i })).toBeInTheDocument();
    expect(
      within(tabs).getByRole("tab", { name: /vehicle registration/i }),
    ).toBeInTheDocument();
  });

  it("approves a pending submission with a reason", async () => {
    const user = userEvent.setup();
    render(<KycQueuePage />);

    await user.click(
      within(rowFor("Mira Saad")).getByRole("button", {
        name: /review mira saad/i,
      }),
    );
    const drawer = screen.getByRole("dialog");
    await user.click(within(drawer).getByRole("radio", { name: /approve/i }));
    await user.selectOptions(
      within(drawer).getByLabelText(/reason/i),
      "clean",
    );
    await user.click(
      within(drawer).getByRole("button", { name: /submit verdict/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /approved/i }));
    expect(
      within(rowFor("Mira Saad")).getByText(/^approved$/i),
    ).toBeInTheDocument();
  });

  it("rejects a submission requiring a reason", async () => {
    const user = userEvent.setup();
    render(<KycQueuePage />);

    await user.click(
      within(rowFor("Khalid R.")).getByRole("button", {
        name: /review khalid r\./i,
      }),
    );
    const drawer = screen.getByRole("dialog");
    await user.click(within(drawer).getByRole("radio", { name: /reject/i }));
    // Submitting without a reason should surface an error.
    await user.click(
      within(drawer).getByRole("button", { name: /submit verdict/i }),
    );
    expect(within(drawer).getByRole("alert")).toHaveTextContent(/reason is required/i);

    await user.selectOptions(
      within(drawer).getByLabelText(/reason/i),
      "face_mismatch",
    );
    await user.click(
      within(drawer).getByRole("button", { name: /submit verdict/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /rejected/i }));
    expect(
      within(rowFor("Khalid R.")).getByText(/^rejected$/i),
    ).toBeInTheDocument();
  });

  it("requires at least one document checked when requesting a resubmit", async () => {
    const user = userEvent.setup();
    render(<KycQueuePage />);

    await user.click(
      within(rowFor("Lina Haddad")).getByRole("button", {
        name: /review lina haddad/i,
      }),
    );
    const drawer = screen.getByRole("dialog");
    await user.click(
      within(drawer).getByRole("radio", { name: /request resubmit/i }),
    );
    await user.selectOptions(
      within(drawer).getByLabelText(/reason/i),
      "id_glare",
    );
    await user.click(
      within(drawer).getByRole("button", { name: /submit verdict/i }),
    );
    expect(within(drawer).getByRole("alert")).toHaveTextContent(
      /at least one document/i,
    );

    await user.click(
      within(drawer).getByRole("checkbox", { name: /resubmit id front/i }),
    );
    await user.click(
      within(drawer).getByRole("button", { name: /submit verdict/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /resubmit/i }));
    expect(
      within(rowFor("Lina Haddad")).getByText(/^resubmit$/i),
    ).toBeInTheDocument();
  });

  it("filters by status tab", async () => {
    const user = userEvent.setup();
    render(<KycQueuePage />);

    await user.click(screen.getByRole("tab", { name: /approved/i }));
    expect(rowFor("Rami N.")).toBeInTheDocument();
    expect(screen.queryByText("Salem Al-Otaibi")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /rejected/i }));
    expect(rowFor("Hala M.")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^all/i }));
    expect(rowFor("Rami N.")).toBeInTheDocument();
    expect(rowFor("Salem Al-Otaibi")).toBeInTheDocument();
  });

  it("renders a read-only decision summary for decided submissions", async () => {
    const user = userEvent.setup();
    render(<KycQueuePage />);

    await user.click(screen.getByRole("tab", { name: /approved/i }));
    await user.click(
      within(rowFor("Rami N.")).getByRole("button", {
        name: /review rami n\./i,
      }),
    );
    const drawer = screen.getByRole("dialog");
    const summary = within(drawer).getByRole("region", {
      name: /decision summary/i,
    });
    expect(within(summary).getByText("approve")).toBeInTheDocument();
    expect(within(summary).getByText("clean")).toBeInTheDocument();
    // No verdict form for already-decided submissions.
    expect(
      within(drawer).queryByRole("button", { name: /submit verdict/i }),
    ).not.toBeInTheDocument();
  });
});

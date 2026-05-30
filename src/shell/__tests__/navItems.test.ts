import { describe, expect, it } from "vitest";
import { navItems } from "../navItems";

describe("navItems", () => {
  it("contains every section listed in the IA doc", () => {
    const labels = navItems.map((i) => i.label);
    expect(labels).toEqual([
      "Dashboard",
      "KYC queue",
      "Disputes",
      "Finance",
      "Operations",
      "Users",
      "Settlements",
      "Prohibited items",
      "Audit log",
    ]);
  });

  it("uses unique single-character shortcuts", () => {
    const shortcuts = navItems.map((i) => i.shortcut);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
    shortcuts.forEach((s) => expect(s).toHaveLength(1));
  });

  it("gates restricted sections to specific roles", () => {
    const audit = navItems.find((i) => i.to === "/audit");
    expect(audit?.roles).toEqual(["superuser"]);
    const dashboard = navItems.find((i) => i.to === "/");
    expect(dashboard?.roles).toBeUndefined();
    const prohibited = navItems.find((i) => i.to === "/prohibited-items");
    expect(prohibited?.roles).toEqual(["ops.viewer", "superuser"]);
  });
});

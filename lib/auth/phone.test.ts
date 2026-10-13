import { describe, expect, it } from "vitest";
import { normalizePhone, phoneToEmail } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["081234567890", "6281234567890"],
    ["+62 812-3456-7890", "6281234567890"],
    ["62 812 3456 7890", "6281234567890"],
    ["81234567890", "6281234567890"],
    ["0812 3456 78", "62812345678"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "0211234567", "08123", "6281234567890123"])(
    "menolak %s",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});

describe("phoneToEmail", () => {
  it("membentuk email sintetis", () => {
    expect(phoneToEmail("6281234567890", "pantau-generus.local")).toBe(
      "6281234567890@pantau-generus.local",
    );
  });
});

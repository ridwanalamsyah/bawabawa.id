import { afterEach, describe, expect, it } from "vitest";
import { assertStaffLogin } from "../modules/auth/auth.service";

describe("staff-only login", () => {
  afterEach(() => {
    delete process.env.PUBLIC_SIGNUP;
  });

  it("refuses new and customer Google accounts by default", () => {
    expect(() => assertStaffLogin(null)).toThrow(/hanya untuk tim/);
    expect(() => assertStaffLogin("customer")).toThrow(/hanya untuk tim/);
  });

  it("lets pre-added staff in", () => {
    expect(() => assertStaffLogin("admin")).not.toThrow();
    expect(() => assertStaffLogin("operations")).not.toThrow();
  });

  it("allows customer sign-up again when PUBLIC_SIGNUP=true", () => {
    process.env.PUBLIC_SIGNUP = "true";
    expect(() => assertStaffLogin(null)).not.toThrow();
    expect(() => assertStaffLogin("customer")).not.toThrow();
  });
});

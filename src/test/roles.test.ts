import { describe, it, expect } from "vitest";
import {
  hasMinRole,
  canEditStaffing,
  canManageUsers,
  canImportRdqm,
  canSubmitRequests,
  ROLE_HIERARCHY,
  type UserRole,
} from "@/lib/utils/roles";

describe("ROLE_HIERARCHY", () => {
  it("owner has the highest level", () => {
    const levels = Object.values(ROLE_HIERARCHY);
    expect(ROLE_HIERARCHY.owner).toBe(Math.max(...levels));
  });

  it("viewer has the lowest level", () => {
    const levels = Object.values(ROLE_HIERARCHY);
    expect(ROLE_HIERARCHY.viewer).toBe(Math.min(...levels));
  });

  it("levels are strictly ordered: owner > admin > core_vct > sop > requester > viewer", () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.core_vct);
    expect(ROLE_HIERARCHY.core_vct).toBeGreaterThan(ROLE_HIERARCHY.sop);
    expect(ROLE_HIERARCHY.sop).toBeGreaterThan(ROLE_HIERARCHY.requester);
    expect(ROLE_HIERARCHY.requester).toBeGreaterThan(ROLE_HIERARCHY.viewer);
  });
});

describe("hasMinRole", () => {
  it("returns true when user role equals the minimum required", () => {
    expect(hasMinRole("admin", "admin")).toBe(true);
    expect(hasMinRole("viewer", "viewer")).toBe(true);
  });

  it("returns true when user role is above the minimum required", () => {
    expect(hasMinRole("owner", "admin")).toBe(true);
    expect(hasMinRole("admin", "viewer")).toBe(true);
    expect(hasMinRole("core_vct", "sop")).toBe(true);
  });

  it("returns false when user role is below the minimum required", () => {
    expect(hasMinRole("viewer", "admin")).toBe(false);
    expect(hasMinRole("sop", "core_vct")).toBe(false);
    expect(hasMinRole("requester", "sop")).toBe(false);
  });
});

describe("canEditStaffing", () => {
  const adminId = "user-admin";
  const memberId = "user-member";
  const otherId = "user-other";
  const companyA = "company-a";
  const companyB = "company-b";

  it("admin can edit any assignment", () => {
    expect(canEditStaffing("admin", adminId, memberId)).toBe(true);
  });

  it("owner can edit any assignment", () => {
    expect(canEditStaffing("owner", adminId, memberId)).toBe(true);
  });

  it("core_vct can edit their own assignments", () => {
    expect(canEditStaffing("core_vct", memberId, memberId)).toBe(true);
  });

  it("core_vct cannot edit someone else's assignment", () => {
    expect(canEditStaffing("core_vct", memberId, otherId)).toBe(false);
  });

  it("sop can edit assignments for their portfolio companies", () => {
    expect(
      canEditStaffing("sop", memberId, otherId, [companyA], companyA)
    ).toBe(true);
  });

  it("sop cannot edit assignments for companies outside their scope", () => {
    expect(
      canEditStaffing("sop", memberId, otherId, [companyA], companyB)
    ).toBe(false);
  });

  it("sop without company list cannot edit", () => {
    expect(canEditStaffing("sop", memberId, otherId)).toBe(false);
  });

  it("viewer cannot edit any assignment", () => {
    expect(canEditStaffing("viewer", memberId, memberId)).toBe(false);
  });

  it("requester cannot edit any assignment", () => {
    expect(canEditStaffing("requester", memberId, memberId)).toBe(false);
  });
});

describe("canManageUsers", () => {
  const allowed: UserRole[] = ["owner", "admin"];
  const denied: UserRole[] = ["core_vct", "sop", "requester", "viewer"];

  it.each(allowed)("%s can manage users", (role) => {
    expect(canManageUsers(role)).toBe(true);
  });

  it.each(denied)("%s cannot manage users", (role) => {
    expect(canManageUsers(role)).toBe(false);
  });
});

describe("canImportRdqm", () => {
  const allowed: UserRole[] = ["owner", "admin"];
  const denied: UserRole[] = ["core_vct", "sop", "requester", "viewer"];

  it.each(allowed)("%s can import RDQM", (role) => {
    expect(canImportRdqm(role)).toBe(true);
  });

  it.each(denied)("%s cannot import RDQM", (role) => {
    expect(canImportRdqm(role)).toBe(false);
  });
});

describe("canSubmitRequests", () => {
  const allowed: UserRole[] = ["owner", "admin", "core_vct", "requester"];
  const denied: UserRole[] = ["sop", "viewer"];

  it.each(allowed)("%s can submit requests", (role) => {
    expect(canSubmitRequests(role)).toBe(true);
  });

  it.each(denied)("%s cannot submit requests", (role) => {
    expect(canSubmitRequests(role)).toBe(false);
  });
});

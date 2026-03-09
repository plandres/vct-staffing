export type UserRole =
  | "owner"
  | "admin"
  | "core_vct"
  | "sop"
  | "requester"
  | "viewer";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 6,
  admin: 5,
  core_vct: 4,
  sop: 3,
  requester: 2,
  viewer: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  core_vct: "Core VCT",
  sop: "Senior Operating Partner",
  requester: "Requester",
  viewer: "Viewer",
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export function canEditStaffing(
  userRole: UserRole,
  userId: string,
  assignmentMemberId: string,
  userSopCompanyIds?: string[],
  assignmentCompanyId?: string
): boolean {
  if (hasMinRole(userRole, "admin")) return true;
  if (userRole === "core_vct" && userId === assignmentMemberId) return true;
  if (
    userRole === "sop" &&
    userSopCompanyIds &&
    assignmentCompanyId &&
    userSopCompanyIds.includes(assignmentCompanyId)
  )
    return true;
  return false;
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasMinRole(userRole, "admin");
}

export function canImportRdqm(userRole: UserRole): boolean {
  return hasMinRole(userRole, "admin");
}

export function canSubmitRequests(userRole: UserRole): boolean {
  return userRole === "requester" || hasMinRole(userRole, "core_vct");
}

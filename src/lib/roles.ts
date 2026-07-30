import { OfficeUserRole } from "../gen/common/v1/office_pb.js";

export function roleLabel(role: OfficeUserRole): string {
  switch (role) {
    case OfficeUserRole.MANAGER:
      return "Manager";
    case OfficeUserRole.USER:
      return "User";
    default:
      return "Unspecified";
  }
}

export const EDITABLE_ROLES: { value: OfficeUserRole; label: string }[] = [
  { value: OfficeUserRole.MANAGER, label: "Manager" },
  { value: OfficeUserRole.USER, label: "User" },
];

import { OfficeUserRole } from "../gen/common/v1/office_pb.js";
import type { Messages } from "../i18n/types.ts";

export function roleLabel(role: OfficeUserRole, t: Messages): string {
  switch (role) {
    case OfficeUserRole.MANAGER:
      return t.roles.manager;
    case OfficeUserRole.USER:
      return t.roles.user;
    default:
      return t.roles.unspecified;
  }
}

export const EDITABLE_ROLES: OfficeUserRole[] = [
  OfficeUserRole.MANAGER,
  OfficeUserRole.USER,
];

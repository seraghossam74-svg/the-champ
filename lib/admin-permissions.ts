import "server-only";

import { DecodedIdToken } from "firebase-admin/auth";

const SUPER_ADMIN_UID = "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export function isSuperAdmin(
  decodedToken: DecodedIdToken
) {
  return decodedToken.uid === SUPER_ADMIN_UID;
}

export function isAdmin(
  decodedToken: DecodedIdToken
) {
  return (
    isSuperAdmin(decodedToken) ||
    decodedToken.admin === true ||
    decodedToken.role === "admin" ||
    decodedToken.role === "super_admin"
  );
}
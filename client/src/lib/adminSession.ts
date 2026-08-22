export function isAuthenticatedAdminSession(session: { authenticated?: unknown } | null | undefined) {
  return session?.authenticated === true;
}

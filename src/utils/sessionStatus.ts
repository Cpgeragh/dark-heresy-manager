export function isSessionOpen(session: { status?: string }): boolean {
  return session.status === "open";
}

/**
 * Who can reach the admin panel.
 *
 * Two roles have admin access:
 *   - 'admin' — a full administrator who is usually also a directory member
 *     (linked to a People/Alumni record, has a personal profile).
 *   - 'staff' — program staff who administer the site but are NOT members of
 *     the People directory: no Type, no directory listing, no personal
 *     profile. They can still browse the directory like a member.
 *
 * Everything that gates on "is this an administrator?" should call this so the
 * two roles stay in lockstep.
 */
export function canAccessAdmin(role?: string | null): boolean {
  return role === 'admin' || role === 'staff';
}

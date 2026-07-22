import { supabase } from '../lib/supabase';

/**
 * Get all available permissions (fan, light, door)
 */
export async function getAllPermissions() {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a user's permissions with granted status.
 * Returns all 3 permissions (fan, light, door) each with a `granted` boolean.
 */
export async function getUserPermissions(userId) {
  const allPerms = await getAllPermissions();

  const { data: userPerms, error } = await supabase
    .from('user_permissions')
    .select('permission_id, granted')
    .eq('user_id', userId);

  if (error) throw error;

  const grantedMap = new Map(
    userPerms.map(up => [up.permission_id, up.granted])
  );

  return allPerms.map(perm => ({
    ...perm,
    granted: grantedMap.has(perm.id) ? grantedMap.get(perm.id) : true,
  }));
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(userId, permissionName) {
  const permissions = await getUserPermissions(userId);
  const perm = permissions.find(p => p.name === permissionName);
  return perm ? perm.granted : false;
}

/**
 * Toggle a permission for a user (set granted to true or false).
 * Only a parent (requesterId) is allowed to perform this action —
 * the database function enforces this server-side.
 */
export async function toggleUserPermission(requesterId, userId, permissionId, granted) {
  const { data, error } = await supabase.rpc('toggle_user_permission', {
    requester_id: requesterId,
    target_user_id: userId,
    target_permission_id: permissionId,
    new_granted: granted,
  });

  if (error) throw error;
  return data;
}

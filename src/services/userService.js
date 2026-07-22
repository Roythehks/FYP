import { supabase } from '../lib/supabase';

/**
 * Create a new user
 */
export async function createUser(userData) {
  const { name, email, role, password } = userData;
  
  if (!name || !email || !role) {
    throw new Error('Name, email, and role are required');
  }

  // If using Supabase Auth, create auth user first
  if (password) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Insert user with auth ID
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert user without auth (for demo purposes)
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          role,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Get all users
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user information
 */
export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user role
 */
export async function updateUserRole(userId, newRole) {
  return updateUser(userId, { role: newRole });
}

/**
 * Delete user
 */
export async function deleteUser(userId) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return true;
}

/**
 * Check if user has a password set
 */
export async function hasPassword(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return !!data.password;
}

/**
 * Set or update user password (must be exactly 6 characters)
 */
export async function setPassword(userId, password) {
  if (!password || password.length !== 6) {
    throw new Error('Password must be exactly 6 characters');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ password, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verify user password — returns true if match
 */
export async function verifyPassword(userId, password) {
  const { data, error } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data.password === password;
}

/**
 * Get user with their recordings count
 */
export async function getUserWithRecordings(userId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  const { count, error: countError } = await supabase
    .from('voice_recordings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw countError;

  return {
    ...user,
    recordings_count: count,
  };
}


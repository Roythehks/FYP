import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserById, getAllUsers } from '../services/userService';
import { getUserPermissions } from '../services/permissionService';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load current user from storage on app start
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Load user permissions when user changes
  useEffect(() => {
    if (currentUser) {
      loadUserPermissions();
    } else {
      setPermissions([]);
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (userId) {
        const user = await getUserById(userId);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async () => {
    try {
      if (currentUser) {
        const perms = await getUserPermissions(currentUser.id);
        setPermissions(perms);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const login = async (userId) => {
    try {
      const user = await getUserById(userId);
      setCurrentUser(user);
      await AsyncStorage.setItem('currentUserId', userId);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setCurrentUser(null);
      setPermissions([]);
      await AsyncStorage.removeItem('currentUserId');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const hasPermission = (permissionName) => {
    return permissions.some(p => p.name === permissionName);
  };

  const isAdmin = () => {
    return currentUser?.role === 'parent';
  };

  const isParent = () => {
    return currentUser?.role === 'parent';
  };

  const isChild = () => {
    return currentUser?.role === 'child';
  };

  const refreshUser = async () => {
    if (currentUser) {
      try {
        const user = await getUserById(currentUser.id);
        setCurrentUser(user);
        await loadUserPermissions();
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value = {
    currentUser,
    permissions,
    loading,
    login,
    logout,
    hasPermission,
    isAdmin,
    isParent,
    isChild,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}


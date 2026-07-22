import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { getUserById } from '../services/userService';
import { getUserPermissions, toggleUserPermission } from '../services/permissionService';
import { useUser } from '../context/UserContext';

const PERMISSION_ICONS = {
  fan: '🌀',
  light: '💡',
  door: '🚪',
};

export default function ManagePermissionsScreen({ route, navigation }) {
  const { userId } = route.params;
  const { currentUser } = useUser();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (currentUser?.role !== 'parent') {
      Alert.alert(
        'Access Denied',
        'Only parent users can manage permissions.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [userData, userPerms] = await Promise.all([
        getUserById(userId),
        getUserPermissions(userId),
      ]);
      setUser(userData);
      setPermissions(userPerms);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (permission) => {
    if (currentUser?.role !== 'parent') {
      Alert.alert('Access Denied', 'Only parent users can change permissions.');
      return;
    }

    const newGranted = !permission.granted;
    setUpdating(permission.id);

    setPermissions(prev =>
      prev.map(p => p.id === permission.id ? { ...p, granted: newGranted } : p)
    );

    try {
      await toggleUserPermission(currentUser.id, userId, permission.id, newGranted);
    } catch (error) {
      console.error('Failed to toggle permission:', error);
      setPermissions(prev =>
        prev.map(p => p.id === permission.id ? { ...p, granted: !newGranted } : p)
      );
      const msg = error.message?.includes('only parents')
        ? 'Only parent users can change permissions.'
        : 'Failed to update permission';
      Alert.alert('Error', msg);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
        Manage Permissions
      </Text>

      {user && (
        <View style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
            {user.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            Role: <Text style={{ fontWeight: '600', textTransform: 'capitalize' }}>{user.role}</Text>
          </Text>
        </View>
      )}

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        Toggle device permissions for this user.
      </Text>

      {permissions.map((permission) => {
        const icon = PERMISSION_ICONS[permission.name] || '⚙️';
        const isUpdatingThis = updating === permission.id;

        return (
          <View
            key={permission.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: permission.granted ? '#34C759' : '#ddd',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              backgroundColor: permission.granted ? '#E8F8ED' : '#fff',
              opacity: isUpdatingThis ? 0.6 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 28, marginRight: 14 }}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  color: permission.granted ? '#1B7A34' : '#333',
                }}>
                  {permission.name}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: permission.granted ? '#2A9D4E' : '#999',
                  marginTop: 2,
                }}>
                  {permission.granted ? 'Allowed' : 'Denied'}
                </Text>
              </View>
            </View>

            <Switch
              value={permission.granted}
              onValueChange={() => handleToggle(permission)}
              disabled={isUpdatingThis}
              trackColor={{ false: '#ddd', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>
        );
      })}

      <TouchableOpacity
        style={{
          backgroundColor: '#f5f5f5',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 10,
          marginBottom: 30,
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>
          Done
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

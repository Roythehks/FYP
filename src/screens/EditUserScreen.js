import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { getUserById, updateUser, deleteUser } from '../services/userService';
import { useUser } from '../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditUserScreen({ route, navigation }) {
  const { userId } = route.params;
  const { currentUser } = useUser();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('child');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const roles = [
    { value: 'parent', label: 'Parent', description: 'Admin access - Manage family and devices' },
    { value: 'child', label: 'Child', description: 'Limited device control' },
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const goToUsersList = () => {
    navigation.popToTop();
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'parent') {
      setLoading(false);
      Alert.alert(
        'Access Denied',
        'Only parent users can edit user profiles.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }
    loadUser();
  }, [userId, currentUser]);

  const loadUser = async () => {
    try {
      const userData = await getUserById(userId);
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setRole(userData.role);
      setStatus(userData.status || 'active');
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert('Error', 'Failed to load user details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert(
        'Not Logged In',
        'You must select and log in as a user before editing profile information.',
        [
          {
            text: 'Go to Users',
            onPress: goToUsersList,
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    if (currentUser.role !== 'parent') {
      Alert.alert('Access Denied', 'Only parent users can edit user profiles.');
      return;
    }

    if (!name || !email || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      await updateUser(userId, { name, email, role, status });
      Alert.alert('Success', 'User updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!currentUser) {
      Alert.alert(
        'Not Logged In',
        'You must select and log in as a user before deleting profiles.',
        [
          {
            text: 'Go to Users',
            onPress: goToUsersList,
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    if (currentUser.role !== 'parent') {
      Alert.alert('Access Denied', 'Only parent users can delete user profiles.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  if (!currentUser && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 36, color: '#ccc' }}>?</Text>
        </View>

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
          Not Logged In
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: '#888',
            textAlign: 'center',
            marginBottom: 30,
            lineHeight: 22,
          }}
        >
          Select a user from the Users tab to log in before editing user information.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 10,
          }}
          onPress={goToUsersList}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Go to Users</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      contentContainerStyle={{ padding: 20, paddingBottom: 24 + insets.bottom }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Edit User
      </Text>

      {/* Name Input */}
      <Text style={{ fontSize: 16, marginBottom: 5, fontWeight: '600' }}>Name</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
          fontSize: 16
        }}
        placeholder="Enter user name"
        value={name}
        onChangeText={setName}
      />

      {/* Email Input */}
      <Text style={{ fontSize: 16, marginBottom: 5, fontWeight: '600' }}>Email</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
          fontSize: 16
        }}
        placeholder="Enter email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Role Selection */}
      <Text style={{ fontSize: 16, marginBottom: 10, fontWeight: '600' }}>Role</Text>
      {roles.map((roleOption) => (
        <TouchableOpacity
          key={roleOption.value}
          style={{
            borderWidth: 2,
            borderColor: role === roleOption.value ? '#007AFF' : '#ddd',
            borderRadius: 8,
            padding: 15,
            marginBottom: 10,
            backgroundColor: role === roleOption.value ? '#E8F4FF' : '#fff',
          }}
          onPress={() => setRole(roleOption.value)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600',
                color: role === roleOption.value ? '#007AFF' : '#333'
              }}>
                {roleOption.label}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: role === roleOption.value ? '#0056B3' : '#666',
                marginTop: 2
              }}>
                {roleOption.description}
              </Text>
            </View>
            {role === roleOption.value && (
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#007AFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Status Selection */}
      <Text style={{ fontSize: 16, marginBottom: 10, marginTop: 10, fontWeight: '600' }}>Status</Text>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {statuses.map((statusOption) => (
          <TouchableOpacity
            key={statusOption.value}
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: status === statusOption.value ? '#007AFF' : '#ddd',
              borderRadius: 8,
              padding: 12,
              marginRight: statusOption.value === 'active' ? 10 : 0,
              backgroundColor: status === statusOption.value ? '#E8F4FF' : '#fff',
              alignItems: 'center',
            }}
            onPress={() => setStatus(statusOption.value)}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600',
              color: status === statusOption.value ? '#007AFF' : '#333'
            }}>
              {statusOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={{
          backgroundColor: saving ? '#aaa' : '#34C759',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 15
        }}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Save Changes
          </Text>
        )}
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FF3B30',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 15
        }}
        onPress={handleDelete}
        disabled={saving}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          Delete User
        </Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#f5f5f5',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 30
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>
          Cancel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


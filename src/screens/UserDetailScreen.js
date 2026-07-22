import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserWithRecordings, hasPassword, setPassword, verifyPassword } from '../services/userService';
import { getUserPermissions } from '../services/permissionService';
import { useUser } from '../context/UserContext';

export default function UserDetailScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, login } = useUser();
  const insets = useSafeAreaInsets();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadUserDetails();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserDetails();
    });

    return unsubscribe;
  }, [userId, navigation]);

  const loadUserDetails = async () => {
    try {
      const [userData, userPerms] = await Promise.all([
        getUserWithRecordings(userId),
        getUserPermissions(userId),
      ]);
      setUser(userData);
      setPermissions(userPerms);
    } catch (error) {
      console.error('Failed to load user details:', error);
      Alert.alert('Error', 'Failed to load user details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async () => {
    try {
      const userHasPassword = await hasPassword(userId);
      setPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordError('');

      if (userHasPassword) {
        setIsCreatingPassword(false);
        setPasswordModalVisible(true);
      } else {
        Alert.alert(
          'Password Required',
          `${user.name} does not have a password yet. Please create a 6-character password to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Password',
              onPress: () => {
                setIsCreatingPassword(true);
                setPasswordModalVisible(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check user password status');
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    setPasswordLoading(true);

    try {
      if (isCreatingPassword) {
        if (passwordInput.length !== 6) {
          setPasswordError('Password must be exactly 6 characters');
          setPasswordLoading(false);
          return;
        }
        if (passwordInput !== confirmPasswordInput) {
          setPasswordError('Passwords do not match');
          setPasswordLoading(false);
          return;
        }

        await setPassword(userId, passwordInput);
        await login(userId);
        setPasswordModalVisible(false);
        Alert.alert('Success', `Password created. Now logged in as ${user.name}`);
      } else {
        if (!passwordInput) {
          setPasswordError('Please enter your password');
          setPasswordLoading(false);
          return;
        }

        const isValid = await verifyPassword(userId, passwordInput);
        if (!isValid) {
          setPasswordError('Incorrect password');
          setPasswordLoading(false);
          return;
        }

        await login(userId);
        setPasswordModalVisible(false);
        Alert.alert('Success', `Now logged in as ${user.name}`);
      }
    } catch (error) {
      setPasswordError(error.message || 'Something went wrong');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#FF3B30';
      case 'parent': return '#007AFF';
      case 'child': return '#34C759';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 24 + insets.bottom }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        User Details
      </Text>

      {/* User Info */}
      <View style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{user.name}</Text>
          <View style={{
            backgroundColor: getRoleBadgeColor(user.role),
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 5,
          }}>
            <Text style={{ 
              color: '#fff', 
              fontSize: 12, 
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {user.role}
            </Text>
          </View>
        </View>
        
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          {user.email}
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' }}>
          <View>
            <Text style={{ fontSize: 12, color: '#999' }}>Status</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' }}>
              {user.status || 'active'}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: '#999' }}>Recordings</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 2 }}>
              {user.recordings_count || 0}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: '#999' }}>Permissions</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 2 }}>
              {permissions.filter(p => p.granted).length}/{permissions.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Current User Indicator */}
      {currentUser?.id === userId && (
        <View style={{
          backgroundColor: '#E8F4FF',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          borderWidth: 2,
          borderColor: '#007AFF',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#007AFF', textAlign: 'center' }}>
            ✓ This is the currently selected user
          </Text>
        </View>
      )}

      {/* Actions */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
        Actions
      </Text>

      {currentUser?.id !== userId && (
        <TouchableOpacity
          style={{
            backgroundColor: '#5856D6',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            alignItems: 'center'
          }}
          onPress={handleSelectUser}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Select as Active User
          </Text>
        </TouchableOpacity>
      )}

      {currentUser?.role === 'parent' && (
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            alignItems: 'center'
          }}
          onPress={() => navigation.navigate('EditUser', { userId })}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Edit User
          </Text>
        </TouchableOpacity>
      )}

      {currentUser?.role === 'parent' && (
        <TouchableOpacity
          style={{
            backgroundColor: '#FF9500',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            alignItems: 'center'
          }}
          onPress={() => navigation.navigate('ManagePermissions', { userId })}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Manage Permissions
          </Text>
        </TouchableOpacity>
      )}

      {/* Permissions List */}
      {permissions.length > 0 && (
        <View style={{ marginTop: 20, marginBottom: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Device Permissions
          </Text>
          <View style={{ backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8 }}>
            {permissions.map((perm, index) => (
              <View
                key={perm.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: index < permissions.length - 1 ? 10 : 0,
                }}
              >
                <Text style={{ fontSize: 15, textTransform: 'capitalize', color: '#333' }}>
                  {perm.name}
                </Text>
                <View style={{
                  backgroundColor: perm.granted ? '#34C759' : '#FF3B30',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 5,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    {perm.granted ? 'Allowed' : 'Denied'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 340,
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' }}>
              {isCreatingPassword ? 'Create Password' : 'Enter Password'}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              {isCreatingPassword
                ? `Set a 6-character password for ${user?.name}`
                : `Enter the password for ${user?.name}`}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 5 }}>Password</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: passwordError ? '#FF3B30' : '#ddd',
                borderRadius: 8,
                padding: 12,
                fontSize: 18,
                marginBottom: 12,
                textAlign: 'center',
                letterSpacing: 8,
              }}
              placeholder="••••••"
              value={passwordInput}
              onChangeText={(text) => {
                if (text.length <= 6) {
                  setPasswordInput(text);
                  setPasswordError('');
                }
              }}
              secureTextEntry
              maxLength={6}
              autoFocus
            />

            {isCreatingPassword && (
              <>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 5 }}>Confirm Password</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: passwordError ? '#FF3B30' : '#ddd',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 18,
                    marginBottom: 12,
                    textAlign: 'center',
                    letterSpacing: 8,
                  }}
                  placeholder="••••••"
                  value={confirmPasswordInput}
                  onChangeText={(text) => {
                    if (text.length <= 6) {
                      setConfirmPasswordInput(text);
                      setPasswordError('');
                    }
                  }}
                  secureTextEntry
                  maxLength={6}
                />
              </>
            )}

            {passwordError ? (
              <Text style={{ color: '#FF3B30', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                {passwordError}
              </Text>
            ) : null}

            <TouchableOpacity
              style={{
                backgroundColor: passwordLoading ? '#aaa' : '#5856D6',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 10,
              }}
              onPress={handlePasswordSubmit}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {isCreatingPassword ? 'Create & Login' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Text style={{ color: '#666', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}


import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useUser } from '../context/UserContext';

export default function SettingsScreen({ navigation }) {
  const { currentUser, permissions, logout } = useUser();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#FF3B30';
      case 'parent': return '#007AFF';
      case 'child': return '#34C759';
      default: return '#999';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'parent': return 'Parent (Admin)';
      case 'child': return 'Child';
      default: return role;
    }
  };

  if (!currentUser) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 36, color: '#ccc' }}>?</Text>
        </View>

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
          Not Logged In
        </Text>
        <Text style={{ fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
          Select a user from the Users tab to log in and start using the app.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 10,
          }}
          onPress={() => navigation.navigate('UsersTab')}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Go to Users
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const grantedPerms = permissions.filter(p => p.granted);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20 }}>
      {/* Profile Header */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: getRoleBadgeColor(currentUser.role),
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 12,
        }}>
          <Text style={{ fontSize: 30, color: '#fff', fontWeight: 'bold' }}>
            {currentUser.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111' }}>
          {currentUser.name}
        </Text>

        <View style={{
          backgroundColor: getRoleBadgeColor(currentUser.role),
          paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
          marginTop: 6,
        }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
            {getRoleLabel(currentUser.role)}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={{
        backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, marginBottom: 20,
      }}>
        <InfoRow label="Email" value={currentUser.email} />
        <InfoRow label="Status" value={currentUser.status || 'active'} capitalize />
        <InfoRow
          label="Member since"
          value={new Date(currentUser.created_at).toLocaleDateString()}
          last
        />
      </View>

      {/* Permissions Card */}
      <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 10, color: '#333' }}>
        Device Permissions
      </Text>
      <View style={{
        backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, marginBottom: 20,
      }}>
        {permissions.length > 0 ? (
          permissions.map((perm, i) => (
            <View
              key={perm.id || perm.name}
              style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: i < permissions.length - 1 ? 1 : 0,
                borderBottomColor: '#eee',
              }}
            >
              <Text style={{ fontSize: 15, textTransform: 'capitalize', color: '#333' }}>
                {perm.name}
              </Text>
              <View style={{
                backgroundColor: perm.granted ? '#34C759' : '#FF3B30',
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {perm.granted ? 'Allowed' : 'Denied'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 8 }}>
            No permissions configured
          </Text>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FF3B30',
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 30,
        }}
        onPress={handleLogout}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          Logout
        </Text>
      </TouchableOpacity>

      {/* App Info */}
      <Text style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginBottom: 20 }}>
        Voice Control App v1.0.0
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, capitalize, last }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: '#eee',
    }}>
      <Text style={{ fontSize: 14, color: '#888' }}>{label}</Text>
      <Text style={{
        fontSize: 15, fontWeight: '500', color: '#333',
        textTransform: capitalize ? 'capitalize' : 'none',
      }}>
        {value}
      </Text>
    </View>
  );
}

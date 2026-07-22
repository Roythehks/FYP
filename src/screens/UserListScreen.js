import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { getAllUsers } from '../services/userService';
import { useUser } from '../context/UserContext';

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useUser();

  useEffect(() => {
    loadUsers();
    
    // Reload users when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadUsers();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUsers = async () => {
    try {
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView 
        style={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            alignItems: 'center'
          }}
          onPress={() => navigation.navigate('RegisterUser')}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            + Register New User
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
          User List ({users.length})
        </Text>

        {users.length === 0 ? (
          <View style={{
            padding: 40,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            alignItems: 'center'
          }}>
            <Text style={{ color: '#999', fontSize: 16 }}>
              No users yet
            </Text>
            <Text style={{ color: '#999', fontSize: 14, marginTop: 5 }}>
              Tap the button above to add a user
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={{
                padding: 15,
                backgroundColor: currentUser?.id === user.id ? '#E8F4FF' : '#f5f5f5',
                borderRadius: 8,
                marginBottom: 10,
                borderWidth: currentUser?.id === user.id ? 2 : 0,
                borderColor: '#007AFF',
              }}
              onPress={() => navigation.navigate('UserDetail', { userId: user.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{user.name}</Text>
                    {currentUser?.id === user.id && (
                      <View style={{
                        backgroundColor: '#007AFF',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginLeft: 8,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>You</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 3 }}>
                    {user.email}
                  </Text>
                </View>
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}


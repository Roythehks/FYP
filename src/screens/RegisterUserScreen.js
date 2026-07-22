import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { createUser } from '../services/userService';

export default function RegisterUserScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('child');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'parent', label: 'Parent', description: 'Admin access - Manage family and devices' },
    { value: 'child', label: 'Child', description: 'Limited device control' },
  ];

  const handleRegister = async () => {
    if (!name || !email || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await createUser({ name, email, role });
      Alert.alert(
        'Success', 
        `User ${name} has been registered successfully as ${role}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to register user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Register New User
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
      <View style={{ marginBottom: 20 }} />

      {/* Register Button */}
      <TouchableOpacity
        style={{
          backgroundColor: loading ? '#aaa' : '#34C759',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 15
        }}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Register User
          </Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#f5f5f5',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
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


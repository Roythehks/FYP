import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUser } from '../context/UserContext';

export default function HomeScreen({ navigation }) {
  const { currentUser } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 }}>

      {currentUser && (
        <Text style={{ fontSize: 16, color: '#888', marginBottom: 6 }}>
          Hello, {currentUser.name}
        </Text>
      )}

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 50, textAlign: 'center' }}>
        Voice Control
      </Text>

      <TouchableOpacity
        style={{
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#007AFF',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
        }}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('VoiceRecording')}
      >
        <Text style={{ fontSize: 48, color: '#fff', marginBottom: 4 }}>
          🎙
        </Text>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
          Record
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, color: '#aaa', marginTop: 40, textAlign: 'center' }}>
        Tap the button to record a voice command
      </Text>
    </View>
  );
}

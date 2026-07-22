import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './src/context/UserContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import VoiceRecordingScreen from './src/screens/VoiceRecordingScreen';
import UserListScreen from './src/screens/UserListScreen';
import UserDetailScreen from './src/screens/UserDetailScreen';
import RegisterUserScreen from './src/screens/RegisterUserScreen';
import EditUserScreen from './src/screens/EditUserScreen';
import ManagePermissionsScreen from './src/screens/ManagePermissionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Voice Control Home' }}
      />
      <Stack.Screen 
        name="VoiceRecording" 
        component={VoiceRecordingScreen}
        options={{ title: 'Record Voice Command' }}
      />
    </Stack.Navigator>
  );
}

// Users Stack Navigator
function UsersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserList" 
        component={UserListScreen}
        options={{ title: 'Users' }}
      />
      <Stack.Screen 
        name="UserDetail" 
        component={UserDetailScreen}
        options={{ title: 'User Details' }}
      />
      <Stack.Screen 
        name="RegisterUser" 
        component={RegisterUserScreen}
        options={{ title: 'Register New User' }}
      />
      <Stack.Screen 
        name="EditUser" 
        component={EditUserScreen}
        options={{ title: 'Edit User' }}
      />
      <Stack.Screen 
        name="ManagePermissions" 
        component={ManagePermissionsScreen}
        options={{ title: 'Manage Permissions' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack}
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home'
        }}
      />
      <Tab.Screen 
        name="UsersTab" 
        component={UsersStack}
        options={{ 
          title: 'Users',
          tabBarLabel: 'Users'
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          tabBarLabel: 'Settings'
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <MainTabs />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}


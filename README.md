# Voice Control App

A React Native mobile application for voice-controlled smart home management. Users can record voice commands to control household devices (fan, light, door) with role-based access and permission management.

## Features

- **Voice Recording** — Record voice commands to control smart home devices
- **User Management** — Register, edit, and manage family members
- **Role-Based Access** — Parent and child roles with different privileges
- **Device Permissions** — Per-user control over fan, light, and door access
- **Password Protection** — 6-character password login for each user
- **Parent-Only Admin** — Only parents can modify other users' permissions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navigation | React Navigation 7 (Bottom Tabs + Stack) |
| Backend | Supabase (PostgreSQL + REST API) |
| Audio | Expo AV |
| State | React Context API + AsyncStorage |

## Project Structure

```
voice_app/
├── App.js                          # Entry point — tab navigator + stack navigators
├── src/
│   ├── context/
│   │   └── UserContext.js          # Global auth state, permissions, login/logout
│   ├── lib/
│   │   └── supabase.js            # Supabase client initialisation
│   ├── screens/
│   │   ├── HomeScreen.js           # Landing page with record button
│   │   ├── VoiceRecordingScreen.js # Audio recording + upload
│   │   ├── UserListScreen.js       # Browse all users
│   │   ├── UserDetailScreen.js     # User profile, login with password
│   │   ├── RegisterUserScreen.js   # Create a new user
│   │   ├── EditUserScreen.js       # Edit user details
│   │   ├── ManagePermissionsScreen.js # Toggle device permissions (parent only)
│   │   └── SettingsScreen.js       # Profile info + logout
│   └── services/
│       ├── userService.js          # User CRUD, password set/verify
│       ├── permissionService.js    # Permission queries + toggle (via DB function)
│       └── recordingService.js     # Voice recording upload + retrieval
├── app.json                        # Expo config
└── package.json
```

## Database Schema

Hosted on **Supabase** (PostgreSQL).

**users** — `id`, `name`, `email`, `role` (parent/child), `password` (6-char), `status`, timestamps

**permissions** — 3 fixed rows: `fan`, `light`, `door`

**user_permissions** — Maps each user to each permission with a `granted` boolean

**voice_recordings** — Stores recording metadata, transcription, and processing status

A server-side PostgreSQL function `toggle_user_permission()` enforces that only parent users can modify permissions.

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone, or an Android/iOS emulator

### Install and Run

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or press `a` (Android) / `i` (iOS) to open in an emulator.

## App Flow

1. **Register** a user from the Users tab (name, email, role)
2. **Select** a user from their detail page — first-time users are prompted to create a 6-character password
3. **Log in** by entering the password on subsequent selections
4. **Record** voice commands from the Home screen
5. **Manage permissions** (parent only) — toggle fan/light/door access per user
6. **View profile** and log out from the Settings tab

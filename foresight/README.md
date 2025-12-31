# Foresight - Personal Finance App

A beautiful, AI-powered personal finance app built with React Native and Expo.

![Foresight](https://img.shields.io/badge/Expo-52.0.0-blue) ![React Native](https://img.shields.io/badge/React%20Native-0.76.9-green)

## Features

- 💰 **Safe to Spend** - Real-time calculation of disposable income
- 📊 **Financial Health Score** - Visual health dial showing your financial wellness
- 🎯 **Savings Goals** - Track progress with beautiful liquid gauge animations
- 📱 **Activity Feed** - Searchable, filterable transaction history
- 🤖 **AI Insights** - Smart suggestions powered by AI
- 👤 **Profile Management** - Linked accounts, preferences, notifications

## Prerequisites

⚠️ **Important: You need Node.js 18 or 20 (NOT v24+)**

```bash
# Check your Node version
node --version

# If you have v24+, use nvm to switch:
nvm install 20
nvm use 20
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npx expo start
```

### 3. Run on Device

- **Expo Go App**: Scan the QR code with Expo Go (iOS/Android)
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal

## Project Structure

```
foresight/
├── App.tsx                 # Main app entry with navigation
├── app.json               # Expo configuration
├── package.json           # Dependencies
│
├── screens/               # Main app screens
│   ├── Dashboard.tsx      # Home screen with overview
│   ├── Activity.tsx       # Transaction history
│   ├── Insights.tsx       # AI-powered insights
│   └── Profile.tsx        # User settings
│
├── components/            # Reusable components
│   ├── HealthDial.tsx     # Financial health gauge
│   ├── LiquidGauge.tsx    # Savings goal progress
│   ├── TransactionItem.tsx
│   ├── AddTransaction.tsx # Add transaction modal
│   ├── AddGoal.tsx        # Add goal modal
│   └── TransactionDetail.tsx
│
├── context/               # State management
│   └── AppContext.tsx     # Global app state
│
├── navigation/            # Navigation setup
│   └── TabNavigator.tsx   # Bottom tab navigation
│
├── theme/                 # Design system
│   └── index.ts           # Colors, typography, spacing
│
├── types.ts               # TypeScript types
├── utils.ts               # Utility functions
└── mockData.ts            # Sample data
```

## Tech Stack

- **Framework**: React Native + Expo SDK 52
- **Navigation**: React Navigation 6
- **Animations**: Moti + React Native Reanimated 3
- **Icons**: @expo/vector-icons (Ionicons)
- **SVG**: react-native-svg
- **State**: React Context + Hooks
- **TypeScript**: Full type safety

## Building for Production

### Development Build (Recommended for testing)

```bash
npx expo install expo-dev-client
eas build --profile development --platform ios
```

### Production Build (for TestFlight/App Store)

```bash
eas build --profile production --platform ios
eas submit --platform ios
```

## Troubleshooting

### Node.js Version Error

If you see errors about TypeScript stripping or file extensions:

```bash
# You're likely using Node.js v24+
# Switch to Node.js 20:
nvm use 20

# Or install it first:
nvm install 20
```

### Metro Bundler Cache

```bash
npx expo start --clear
```

## License

MIT

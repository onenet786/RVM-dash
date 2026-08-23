# PleaseIsp - Technical Documentation

[![React Native](https://img.shields.io/badge/React%20Native-0.80.1-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Repositories](#2-repositories)
- [3. Tech Stack](#3-tech-stack)
- [4. Architecture Overview](#4-architecture-overview)
- [5. Features](#5-features)
- [6. Setup Instructions](#6-setup-instructions)
- [7. API Documentation](#7-api-documentation)
- [8. Deployment](#8-deployment)
- [9. Dependencies & Integrations](#9-dependencies--integrations)
- [10. Future Enhancements](#10-future-enhancements)

---

## 1. Project Overview

**PleaseIsp** is a comprehensive mobile application ecosystem designed to promote environmental sustainability through Reverse Vending Machine (RVM) integration. The platform gamifies the recycling process by enabling users to earn reward points for recycling plastic bottles and cups, which can be redeemed for various promotions and offers.

### Purpose & Goals

- **Environmental Impact**: Encourage sustainable behavior through gamification
- **User Engagement**: Provide intuitive interface for tracking recycling activities
- **Reward System**: Implement points-based incentives for eco-friendly actions
- **Community Building**: Create social features and leaderboards for user motivation

### High-Level Functionality

- **Mobile Application**: Cross-platform React Native app for iOS and Android
- **Backend API**: Node.js/Express.js REST API for data management
- **RVM Integration**: QR code scanning and interaction with Reverse Vending Machines
- **Reward Management**: Points system with external promotion platform integration
- **Maps & Navigation**: Google Maps integration for RVM location services

---

## 2. Repositories

### Mobile Application Repository
- **Repository**: [PleaseIsp Mobile App](https://github.com/[username]/PleaseIsp)
- **Type**: React Native mobile application
- **Platform**: iOS & Android
- **Status**: Active Development

### Backend Repository
- **Repository**: [RVM Backend API](https://github.com/[username]/rvm-backend)
- **Type**: Node.js/Express.js REST API
- **Deployment**: [Vercel](https://rvm-backend.vercel.app)
- **Status**: Production Ready

---

## 3. Tech Stack

### Frontend (Mobile Application)

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React Native | 0.80.1 | Cross-platform mobile development |
| **Language** | JavaScript | ES6+ | Primary programming language |
| **Type Safety** | TypeScript | 5.0.4 | Type checking and development experience |
| **UI Library** | React | 19.1.0 | Component-based UI framework |

### Navigation & UI Components

| Library | Version | Purpose |
|---------|---------|---------|
| `@react-navigation/native` | ^7.1.14 | Navigation framework |
| `@react-navigation/stack` | ^7.4.2 | Stack navigation |
| `@react-navigation/bottom-tabs` | ^7.4.2 | Tab navigation |
| `react-native-vector-icons` | ^10.2.0 | Icon library |
| `react-native-safe-area-context` | ^5.5.2 | Safe area handling |

### Maps & Location Services

| Library | Version | Purpose |
|---------|---------|---------|
| `react-native-maps` | ^1.24.10 | Google Maps integration |
| `@mapbox/polyline` | ^1.2.1 | Route polyline decoding |
| `react-native-permissions` | ^5.4.1 | Location permissions |

### Data Management & Storage

| Library | Version | Purpose |
|---------|---------|---------|
| `@react-native-async-storage/async-storage` | ^2.2.0 | Local data persistence |
| `axios` | ^1.10.0 | HTTP client for API calls |
| `react-native-config` | ^1.5.6 | Environment configuration |

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **Vercel** | Cloud deployment platform |
| **REST API** | API architecture |

---

## 4. Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │   External      │
│   (React Native)│◄──►│   (Vercel)      │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Authentication│    │ • User Management│    │ • Google Maps   │
│ • QR Scanning   │    │ • Points System  │    │ • Vouch365      │
│ • Maps & Routes │    │ • Recycle Data   │    │ • Payment APIs  │
│ • Rewards       │    │ • Promotions     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Mobile App Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    App.jsx (Root)                          │
├─────────────────────────────────────────────────────────────┤
│  Navigation Container (Stack Navigator)                    │
│  ├── IntroScreen                                           │
│  ├── LoginScreen                                           │
│  ├── SignupScreen                                          │
│  └── TabNavigator (Bottom Tabs)                            │
│      ├── DashboardScreen                                   │
│      ├── PromotionsScreen                                  │
│      ├── QrCodeScreen                                      │
│      ├── MapsScreen                                        │
│      └── RewardsScreen                                     │
├─────────────────────────────────────────────────────────────┤
│  Context API (Authentication & State Management)           │
│  ├── AuthProvider                                          │
│  └── ProfileAPI                                            │
├─────────────────────────────────────────────────────────────┤
│  Local Storage (AsyncStorage)                              │
│  ├── User Data                                             │
│  ├── Authentication State                                  │
│  └── Recycle History                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Registration/Login** → Backend API → Local Storage
2. **QR Code Scanning** → RVM Integration → Points Update
3. **Maps Navigation** → Google Maps API → Route Display
4. **Rewards Redemption** → Vouch365 Integration → WebView Display

---

## 5. Features

### Mobile Application Features

#### 🔐 User Authentication
- **User Registration**: Complete profile creation with validation
- **Secure Login**: Phone number and password authentication
- **Profile Management**: User data persistence and updates
- **Session Management**: Automatic login state handling

#### 📊 Dashboard & Statistics
- **Personal Statistics**: Track recycled items (bottles, cups)
- **Points System**: Real-time points display and progress tracking
- **Recycling History**: Last recycling activity and achievements
- **User Profile**: Display username and current status

#### 📱 QR Code Integration
- **RVM Scanning**: QR code scanning for RVM interaction
- **Reward Collection**: Automatic points calculation and assignment
- **Visual Guidance**: Clear instructions for RVM usage
- **Offline Support**: Local data caching and synchronization

#### 🗺️ Maps & Navigation
- **RVM Locations**: Interactive map showing all RVM locations
- **Route Planning**: Google Maps integration for navigation
- **Location Services**: GPS-based location tracking
- **Multiple Routes**: Predefined routes between RVM locations

#### 🎁 Rewards & Promotions
- **Points Redemption**: Convert points to rewards
- **Vouch365 Integration**: External promotion platform integration
- **WebView Display**: Seamless promotion browsing
- **Real-time Updates**: Dynamic promotion loading

#### 🏆 Leaderboard & Social
- **User Rankings**: Global leaderboard based on points
- **Achievement System**: Medal system for top performers
- **Community Features**: User comparison and motivation

### Backend Features

#### 👤 User Management
- User registration and authentication
- Profile data management
- Session handling and JWT tokens

#### 📈 Points System
- Points calculation and tracking
- Recycle history management
- Leaderboard generation

#### 🔗 External Integrations
- Vouch365 promotion platform integration
- Google Maps API integration
- RVM data synchronization

---

## 6. Setup Instructions

### Prerequisites

- **Node.js**: Version 18 or higher
- **React Native CLI**: Latest version
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **Java Development Kit (JDK)**: Version 11 or higher
- **CocoaPods**: For iOS dependencies (macOS only)

### Mobile Application Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/[username]/PleaseIsp.git
cd PleaseIsp
```

#### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..
```

#### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
API_KEY=your_google_maps_api_key
BACKEND_URL=https://rvm-backend.vercel.app
```

#### 4. Android Setup

1. **Install Android Studio** and set up Android SDK
2. **Configure Environment Variables**:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

3. **Create Virtual Device** or connect physical device
4. **Enable Developer Options** and USB Debugging

#### 5. iOS Setup (macOS only)

1. **Install Xcode** from App Store
2. **Install Xcode Command Line Tools**:

```bash
xcode-select --install
```

3. **Install CocoaPods**:

```bash
sudo gem install cocoapods
```

### Running the Application

#### Development Mode

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

#### Production Build

##### Android APK

```bash
# Generate release APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

##### iOS App

```bash
# Open Xcode project
open ios/PleaseIsp.xcworkspace

# Build and archive in Xcode
# Follow Xcode's archive and distribution process
```

### Troubleshooting

#### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build failures**:
   ```bash
   cd android && ./gradlew clean
   ```

3. **iOS build issues**: Clean derived data and rebuild in Xcode

4. **Permission errors**: Ensure proper file permissions and Android SDK setup

---

## 7. API Documentation

### Base URL
```
https://rvm-backend.vercel.app
```

### Authentication Endpoints

#### POST /register
**Description**: Register a new user

**Request Body**:
```json
{
  "username": "string",
  "mobile": "string",
  "age": "number",
  "nic": "string",
  "email": "string",
  "password": "string",
  "gender": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "mobile": "string",
    "email": "string"
  }
}
```

**Status Codes**:
- `200`: Registration successful
- `400`: Invalid data
- `409`: User already exists

#### POST /login
**Description**: Authenticate user

**Request Body**:
```json
{
  "mobileOrEmail": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "mobile": "string",
    "email": "string"
  },
  "token": "string",
  "recycleDetails": {
    "points": "number",
    "bottles": "number",
    "cups": "number",
    "recycledAt": "string"
  }
}
```

**Status Codes**:
- `200`: Login successful
- `401`: Invalid credentials
- `400`: Invalid request

### Data Endpoints

#### GET /getrecycle/{phoneNumber}
**Description**: Get user's recycling history

**Parameters**:
- `phoneNumber` (path): User's phone number

**Response**:
```json
{
  "success": true,
  "data": {
    "points": "number",
    "bottles": "number",
    "cups": "number",
    "recycledAt": "string"
  }
}
```

**Status Codes**:
- `200`: Data retrieved successfully
- `404`: User not found
- `400`: Invalid phone number

#### GET /usernames
**Description**: Get leaderboard data

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "userName": "string",
      "totalPoints": "number"
    }
  ]
}
```

**Status Codes**:
- `200`: Data retrieved successfully

### Promotion Endpoints

#### POST /generate-vouch365-link
**Description**: Generate Vouch365 promotion link

**Request Body**:
```json
{
  "username": "string",
  "phone": "string"
}
```

**Response**:
```json
{
  "success": true,
  "link": "string"
}
```

**Status Codes**:
- `200`: Link generated successfully
- `400`: Invalid request data

### Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 8. Deployment

### Mobile Application Deployment

#### Android Deployment

1. **Generate Signed APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Upload to Google Play Store**:
   - Create developer account
   - Upload APK/AAB file
   - Complete store listing
   - Submit for review

#### iOS Deployment

1. **Archive in Xcode**:
   - Open `ios/PleaseIsp.xcworkspace`
   - Select "Any iOS Device" as target
   - Product → Archive
   - Upload to App Store Connect

2. **App Store Submission**:
   - Complete app information
   - Upload screenshots and metadata
   - Submit for review

### Backend Deployment

- **Platform**: Vercel
- **Configuration**: Automatic deployment from Git repository
- **Environment Variables**: Configured in Vercel dashboard
- **Domain**: https://rvm-backend.vercel.app

### Environment Variables

#### Mobile App (.env)
```env
API_KEY=your_google_maps_api_key
BACKEND_URL=https://rvm-backend.vercel.app
```

#### Backend (Vercel)
```env
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
VOUCH365_API_KEY=your_vouch365_api_key
```

---

## 9. Dependencies & Integrations

### External Services

#### Google Maps API
- **Purpose**: Maps display and navigation
- **API Key**: Required for Android and iOS
- **Usage**: RVM location display, route planning
- **Configuration**: Set in Android manifest and iOS Info.plist

#### Vouch365 Integration
- **Purpose**: Promotion and reward redemption
- **Integration**: WebView-based promotion display
- **Authentication**: User-specific promotion links
- **API**: Backend generates personalized links

#### Vercel Hosting
- **Purpose**: Backend API hosting
- **Features**: Automatic deployments, serverless functions
- **Configuration**: Environment variables and domain setup

### Third-party Libraries

| Library | Purpose |
|---------|---------|
| **React Navigation** | Navigation framework |
| **React Native Maps** | Maps integration |
| **Axios** | HTTP client |
| **AsyncStorage** | Local data persistence |
| **Vector Icons** | UI icon library |

---

## 10. Future Enhancements

### Short-term Improvements (3-6 months)

- **Push Notifications**
  - Recycling reminders
  - New promotion alerts
  - Achievement notifications

- **Enhanced QR Scanning**
  - Camera integration for QR code scanning
  - Barcode scanning for product identification
  - Offline scanning capability

- **Social Features**
  - Friend connections
  - Team challenges
  - Social sharing of achievements

- **Analytics Dashboard**
  - Personal recycling statistics
  - Environmental impact metrics
  - Goal setting and tracking

### Medium-term Features (6-12 months)

- **Gamification**
  - Achievement badges
  - Level progression system
  - Daily/weekly challenges

- **Advanced Maps**
  - Real-time RVM status
  - Crowd-sourced RVM locations
  - Route optimization

- **Payment Integration**
  - In-app purchases
  - Digital wallet integration
  - Cryptocurrency rewards

- **Machine Learning**
  - Personalized recommendations
  - Predictive analytics
  - Smart notification timing

### Long-term Vision (1-2 years)

- **IoT Integration**
  - Smart RVM connectivity
  - Real-time inventory tracking
  - Automated maintenance alerts

- **Blockchain Integration**
  - Tokenized rewards
  - Decentralized verification
  - Cross-platform reward transfer

- **AR/VR Features**
  - Augmented reality RVM guidance
  - Virtual recycling education
  - Immersive reward experiences

- **Enterprise Features**
  - Corporate sustainability tracking
  - Bulk recycling programs
  - Business analytics dashboard

### Technical Improvements

- **Performance Optimization**
  - Code splitting and lazy loading
  - Image optimization
  - Memory management improvements

- **Security Enhancements**
  - Biometric authentication
  - End-to-end encryption
  - Advanced fraud detection

- **Accessibility**
  - Voice navigation
  - Screen reader support
  - Multi-language support

- **Testing & Quality**
  - Comprehensive test coverage
  - Automated testing pipeline
  - Performance monitoring

---

## Conclusion

PleaseIsp represents a comprehensive solution for promoting environmental sustainability through technology. The application combines user-friendly design with robust backend infrastructure to create an engaging recycling experience. With its modular architecture and extensive feature set, the platform is well-positioned for future growth and enhancement.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: Development Team

For questions or support, please contact the development team or create an issue in the repository.

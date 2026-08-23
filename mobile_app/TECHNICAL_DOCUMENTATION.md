# PleaseIsp - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Repositories](#repositories)
3. [Tech Stack](#tech-stack)
4. [Architecture Overview](#architecture-overview)
5. [Features](#features)
6. [Setup Instructions](#setup-instructions)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Dependencies](#dependencies)
10. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

**PleaseIsp** is a comprehensive mobile application designed to promote environmental sustainability through a Reverse Vending Machine (RVM) ecosystem. The application enables users to recycle plastic bottles and cups through designated RVMs, earn reward points, and redeem them for various promotions and offers.

### Key Objectives
- **Environmental Impact**: Encourage recycling through gamification and rewards
- **User Engagement**: Provide an intuitive interface for tracking recycling activities
- **Reward System**: Implement a points-based system for sustainable behavior
- **Community Building**: Create leaderboards and social features for user motivation

### Application Type
- **Platform**: Cross-platform mobile application (React Native)
- **Target Audience**: Environmentally conscious users, students, and general public
- **Primary Function**: RVM interaction, reward management, and promotion redemption

---

## 2. Repositories

### Mobile Application Repository
- **Repository**: [PleaseIsp Mobile App](https://github.com/[username]/PleaseIsp)
- **Type**: React Native mobile application
- **Platform**: iOS & Android

### Backend Repository
- **Repository**: [RVM Backend API](https://github.com/[username]/rvm-backend)
- **Type**: Node.js/Express.js REST API
- **Deployment**: Vercel (https://rvm-backend.vercel.app)

---

## 3. Tech Stack

### Frontend (Mobile Application)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.80.1 | Cross-platform mobile development |
| **React** | 19.1.0 | UI framework |
| **JavaScript** | ES6+ | Programming language |
| **TypeScript** | 5.0.4 | Type safety and development experience |

### Navigation & UI
| Library | Version | Purpose |
|---------|---------|---------|
| **@react-navigation/native** | ^7.1.14 | Navigation framework |
| **@react-navigation/stack** | ^7.4.2 | Stack navigation |
| **@react-navigation/bottom-tabs** | ^7.4.2 | Tab navigation |
| **react-native-vector-icons** | ^10.2.0 | Icon library |
| **react-native-safe-area-context** | ^5.5.2 | Safe area handling |

### Maps & Location
| Library | Version | Purpose |
|---------|---------|---------|
| **react-native-maps** | ^1.24.10 | Google Maps integration |
| **@mapbox/polyline** | ^1.2.1 | Route polyline decoding |
| **react-native-permissions** | ^5.4.1 | Location permissions |

### Data Management
| Library | Version | Purpose |
|---------|---------|---------|
| **@react-native-async-storage/async-storage** | ^2.2.0 | Local data persistence |
| **axios** | ^1.10.0 | HTTP client for API calls |
| **react-native-config** | ^1.5.6 | Environment configuration |

### Additional Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| **react-native-webview** | ^13.15.0 | Web content rendering |
| **@react-native-picker/picker** | ^2.11.1 | Dropdown selection |
| **react-native-gesture-handler** | ^2.27.1 | Touch gesture handling |

### Backend Technologies
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **Vercel** | Cloud deployment platform |
| **REST API** | API architecture |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **Metro** | 0.80.1 | JavaScript bundler |
| **Babel** | ^7.25.2 | JavaScript compiler |
| **ESLint** | ^8.19.0 | Code linting |
| **Jest** | ^29.6.3 | Testing framework |
| **Prettier** | 2.8.8 | Code formatting |

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

### Mobile App Architecture
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

### Core Features

#### 1. User Authentication
- **Registration**: Complete user profile creation with validation
- **Login**: Secure authentication with phone number and password
- **Profile Management**: User data persistence and management
- **Session Management**: Automatic login state handling

#### 2. Dashboard & Statistics
- **Personal Statistics**: Track recycled items (bottles, cups)
- **Points System**: Real-time points display and progress tracking
- **Recycling History**: Last recycling activity and achievements
- **User Profile**: Display username and current status

#### 3. QR Code Integration
- **RVM Scanning**: QR code scanning for RVM interaction
- **Reward Collection**: Automatic points calculation and assignment
- **Visual Guidance**: Clear instructions for RVM usage

#### 4. Maps & Navigation
- **RVM Locations**: Interactive map showing all RVM locations
- **Route Planning**: Google Maps integration for navigation
- **Location Services**: GPS-based location tracking
- **Multiple Routes**: Predefined routes between RVM locations

#### 5. Rewards & Promotions
- **Points Redemption**: Convert points to rewards
- **Vouch365 Integration**: External promotion platform integration
- **WebView Display**: Seamless promotion browsing
- **Real-time Updates**: Dynamic promotion loading

#### 6. Leaderboard & Social
- **User Rankings**: Global leaderboard based on points
- **Achievement System**: Medal system for top performers
- **Community Features**: User comparison and motivation

### Technical Features
- **Offline Support**: Local data caching and synchronization
- **Cross-platform**: Native performance on iOS and Android
- **Responsive Design**: Adaptive UI for different screen sizes
- **Error Handling**: Comprehensive error management and user feedback
- **Loading States**: Smooth user experience with loading indicators

---

## 6. Setup Instructions

### Prerequisites
- **Node.js**: Version 18 or higher
- **React Native CLI**: Latest version
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **Java Development Kit (JDK)**: Version 11 or higher
- **CocoaPods**: For iOS dependencies

### Environment Setup

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
1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **Android build failures**: Clean project with `cd android && ./gradlew clean`
3. **iOS build issues**: Clean derived data and rebuild
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

### Data Endpoints

#### GET /getrecycle/{phoneNumber}
**Description**: Get user's recycling history
**Parameters**:
- `phoneNumber`: User's phone number
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

### Mobile App Deployment

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
```env
# Mobile App (.env)
API_KEY=your_google_maps_api_key
BACKEND_URL=https://rvm-backend.vercel.app

# Backend (Vercel)
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
VOUCH365_API_KEY=your_vouch365_api_key
```

---

## 9. Dependencies

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
- **React Navigation**: Navigation framework
- **React Native Maps**: Maps integration
- **Axios**: HTTP client
- **AsyncStorage**: Local data persistence
- **Vector Icons**: UI icon library

---

## 10. Future Enhancements

### Short-term Improvements (3-6 months)
1. **Push Notifications**
   - Recycling reminders
   - New promotion alerts
   - Achievement notifications

2. **Enhanced QR Scanning**
   - Camera integration for QR code scanning
   - Barcode scanning for product identification
   - Offline scanning capability

3. **Social Features**
   - Friend connections
   - Team challenges
   - Social sharing of achievements

4. **Analytics Dashboard**
   - Personal recycling statistics
   - Environmental impact metrics
   - Goal setting and tracking

### Medium-term Features (6-12 months)
1. **Gamification**
   - Achievement badges
   - Level progression system
   - Daily/weekly challenges

2. **Advanced Maps**
   - Real-time RVM status
   - Crowd-sourced RVM locations
   - Route optimization

3. **Payment Integration**
   - In-app purchases
   - Digital wallet integration
   - Cryptocurrency rewards

4. **Machine Learning**
   - Personalized recommendations
   - Predictive analytics
   - Smart notification timing

### Long-term Vision (1-2 years)
1. **IoT Integration**
   - Smart RVM connectivity
   - Real-time inventory tracking
   - Automated maintenance alerts

2. **Blockchain Integration**
   - Tokenized rewards
   - Decentralized verification
   - Cross-platform reward transfer

3. **AR/VR Features**
   - Augmented reality RVM guidance
   - Virtual recycling education
   - Immersive reward experiences

4. **Enterprise Features**
   - Corporate sustainability tracking
   - Bulk recycling programs
   - Business analytics dashboard

### Technical Improvements
1. **Performance Optimization**
   - Code splitting and lazy loading
   - Image optimization
   - Memory management improvements

2. **Security Enhancements**
   - Biometric authentication
   - End-to-end encryption
   - Advanced fraud detection

3. **Accessibility**
   - Voice navigation
   - Screen reader support
   - Multi-language support

4. **Testing & Quality**
   - Comprehensive test coverage
   - Automated testing pipeline
   - Performance monitoring

---

## Conclusion

PleaseIsp represents a comprehensive solution for promoting environmental sustainability through technology. The application combines user-friendly design with robust backend infrastructure to create an engaging recycling experience. With its modular architecture and extensive feature set, the platform is well-positioned for future growth and enhancement.

The technical documentation provided above serves as a complete guide for developers, stakeholders, and contributors to understand, maintain, and extend the PleaseIsp ecosystem.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: Development Team

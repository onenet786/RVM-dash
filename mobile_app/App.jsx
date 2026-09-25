import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet } from 'react-native';

// Screens
import IntroScreen from './screens/IntroScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import TabNavigator from './utility/TabNavigator';
import { AuthProvider } from './contextApi/auth';
import ForgetPassword from './screens/ForgetPassword';
import VerifyOTP from './screens/VerifyOTP';
import SmartSplashScreen from './screens/SmartSplashScreen';

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loginStatus = await AsyncStorage.getItem('isLoggedIn');
        setIsLoggedIn(loginStatus === 'true');
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsAuthLoaded(true);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <AuthProvider>
      <View style={styles.rootContainer}>
        {isAuthLoaded && (
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName={isLoggedIn ? "Dashboard" : "Login"} 
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Intro" component={IntroScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
              <Stack.Screen name="VerifyOTP" component={VerifyOTP} />
              <Stack.Screen name="SignUp" component={SignupScreen} />
              <Stack.Screen name="Dashboard" component={TabNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        )}

        {!splashFinished && (
          <SmartSplashScreen 
            isReady={isAuthLoaded} 
            onFinish={() => setSplashFinished(true)} 
          />
        )}
      </View>
    </AuthProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#061811',
  },
});
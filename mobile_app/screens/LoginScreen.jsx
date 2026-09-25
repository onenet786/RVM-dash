import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  NativeModules
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { GoogleAuth } = NativeModules;

export default function LoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lastGoogleUser, setLastGoogleUser] = useState(null);

  useEffect(() => {
    // Check if user previously signed in via Google on this device
    AsyncStorage.getItem('@last_google_user').then(val => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && parsed.email) {
            setLastGoogleUser(parsed);
          }
        } catch {}
      }
    });
  }, []);

  // Helper to persist user session & navigate
  const completeSessionLogin = async (userData, token, recycleData) => {
    const rawUser = userData || {};
    const normalizedUser = {
      ...rawUser,
      id: rawUser.id || rawUser.userId || rawUser.email || 'USER',
      userId: rawUser.userId || rawUser.id || rawUser.email || 'USER',
      username: rawUser.username || rawUser.fullName || rawUser.email || 'Eco Recycler',
      full_name: rawUser.full_name || rawUser.fullName || rawUser.name || 'Eco Recycler',
      fullName: rawUser.fullName || rawUser.full_name || rawUser.name || 'Eco Recycler',
      mobile: rawUser.mobile || rawUser.phoneNo || '',
      email: rawUser.email || '',
      points: rawUser.points_balance !== undefined ? rawUser.points_balance : (rawUser.pointsBalance !== undefined ? rawUser.pointsBalance : (rawUser.points || 0)),
      points_balance: rawUser.points_balance !== undefined ? rawUser.points_balance : (rawUser.pointsBalance !== undefined ? rawUser.pointsBalance : 0)
    };

    await AsyncStorage.multiSet([
      ['isLoggedIn', 'true'],
      ['user', JSON.stringify(normalizedUser)],
      ['token', token || '']
    ]);

    if (recycleData) {
      await AsyncStorage.setItem('recycleHistory', JSON.stringify(recycleData));
    } else {
      await AsyncStorage.removeItem('recycleHistory');
    }

    navigation.reset({
      index: 0,
      routes: [{
        name: 'Dashboard',
        params: {
          screen: 'Dashboard',
          params: {
            user: normalizedUser,
            hasRecycleHistory: recycleData
          }
        }
      }]
    });
  };

  // 1. Standard Email/Mobile + Password Login
  const handleSignIn = async () => {
    const cleanInput = emailOrPhone.trim();
    if (!cleanInput) {
      Alert.alert('Email Required', 'Please enter your email or mobile number');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        mobileOrEmail: cleanInput,
        password: password
      }, { timeout: 10000 });

      if (response.data.success) {
        const recycleData = response.data.hasRecycleHistory || response.data.recycleDetails || null;
        await completeSessionLogin(response.data.user, response.data.token, recycleData);
      } else {
        Alert.alert('Sign-In Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      let errMsg = 'Sign in failed. Please check your credentials and try again.';
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      Alert.alert('Sign-In Notice', errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to authenticate Google account on backend & save for 1-tap next time
  const authenticateGoogleUser = async (googleAccount) => {
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google`, {
        email: googleAccount.email,
        name: googleAccount.name || googleAccount.email.split('@')[0],
        picture: googleAccount.photoUrl || '',
        idToken: googleAccount.idToken || ''
      }, { timeout: 12000 });

      if (res.data && res.data.success && res.data.user) {
        // Save as last google user for instant 1-tap next time
        const userToSave = {
          email: googleAccount.email,
          name: googleAccount.name || (res.data.user.full_name || res.data.user.name || googleAccount.email.split('@')[0]),
          photoUrl: googleAccount.photoUrl || ''
        };
        await AsyncStorage.setItem('@last_google_user', JSON.stringify(userToSave));
        setLastGoogleUser(userToSave);

        const recycleData = res.data.recycleDetails || null;
        await completeSessionLogin(res.data.user, res.data.token, recycleData);
      } else {
        Alert.alert('Google Sign-In', res.data?.message || 'Could not authenticate Google account.');
      }
    } catch (error) {
      console.warn('Google sign-in error:', error);
      Alert.alert('Google Sign-In', error.response?.data?.message || error.message || 'Authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 2. Native Google Sign-In (Directly launches single native account picker if needed)
  const handleContinueWithGoogle = async (forcePicker = false) => {
    // If previously signed in on this device and user didn't ask to switch, log in directly without dialog
    if (lastGoogleUser && !forcePicker) {
      await authenticateGoogleUser(lastGoogleUser);
      return;
    }

    setGoogleLoading(true);
    try {
      if (!GoogleAuth || !GoogleAuth.signIn) {
        throw new Error('Google Auth service is initializing. Please try again.');
      }

      // Shows single native Android Account Chooser dialog (zero double popups)
      const googleAccount = await GoogleAuth.signIn();
      if (googleAccount && googleAccount.email) {
        await authenticateGoogleUser(googleAccount);
      }
    } catch (error) {
      if (error.code === 'E_CANCELLED' || error.message?.includes('cancelled')) {
        return;
      }
      console.warn('Google sign-in note:', error);
      Alert.alert('Google Sign-In', error.message || 'Sign in with Google cancelled');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
              }}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign in</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Sign in Button */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleSignIn}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signInBtnText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.orDividerContainer}>
              <Text style={styles.orText}>OR</Text>
            </View>

            {/* Continue with Google Button */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleContinueWithGoogle(false)}
              disabled={googleLoading || loading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#374151" size="small" />
              ) : (
                <>
                  <View style={styles.socialIconContainer}>
                    <Icon name="logo-google" size={20} color="#EA4335" />
                  </View>
                  <Text style={styles.socialBtnText} numberOfLines={1}>
                    {lastGoogleUser
                      ? `Continue as ${lastGoogleUser.name || lastGoogleUser.email}`
                      : 'Continue with Google'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Switch Account link if user was previously signed in */}
            {lastGoogleUser && (
              <TouchableOpacity
                onPress={() => handleContinueWithGoogle(true)}
                disabled={googleLoading || loading}
                style={styles.switchAccountBtn}
              >
                <Text style={styles.switchAccountText}>Switch or use another account</Text>
              </TouchableOpacity>
            )}

            {/* Footer: Forgot password? & Join now */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgetPassword')}
                style={styles.footerLink}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                style={styles.footerLink}
              >
                <Text style={styles.joinNowText}>Join now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  signInBtn: {
    backgroundColor: '#93C5FD',
    borderRadius: 8,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orDividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  orText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 52,
    marginBottom: 16,
    position: 'relative',
  },
  socialIconContainer: {
    position: 'absolute',
    left: 18,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginHorizontal: 36,
    textAlign: 'center',
  },
  switchAccountBtn: {
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  switchAccountText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 2,
  },
  footerLink: {
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  joinNowText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '700',
  },
});
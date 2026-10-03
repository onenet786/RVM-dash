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
  NativeModules,
  Modal,
  ToastAndroid
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

  // Two-Step Verification (2FA via Gmail) State
  const [twoStepModalVisible, setTwoStepModalVisible] = useState(false);
  const [twoStepEmail, setTwoStepEmail] = useState('');
  const [twoStepMaskedEmail, setTwoStepMaskedEmail] = useState('');
  const [twoStepName, setTwoStepName] = useState('');
  const [twoStepCode, setTwoStepCode] = useState('');
  const [twoStepLoading, setTwoStepLoading] = useState(false);
  const [twoStepCountdown, setTwoStepCountdown] = useState(0);
  const [pendingGoogleAccount, setPendingGoogleAccount] = useState(null);

  useEffect(() => {
    let timer;
    if (twoStepCountdown > 0) {
      timer = setInterval(() => {
        setTwoStepCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoStepCountdown]);

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
      userType: rawUser.userType || rawUser.user_type || (rawUser.orgId || rawUser.org_id ? 'ENTERPRISE' : 'CITIZEN'),
      orgId: rawUser.orgId || rawUser.org_id || null,
      orgName: rawUser.orgName || rawUser.org_name || null,
      employeeId: rawUser.employeeId || rawUser.employee_id || null,
      deptId: rawUser.deptId || rawUser.dept_id || null,
      department: rawUser.department || rawUser.department_name || null,
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
      Alert.alert('Mobile or Email Required', 'Please enter your registered mobile number or email address');
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

  // 2. Initiate Google Two-Step Verification (Sends OTP code to Gmail)
  const initiateGoogleTwoStep = async (googleAccount) => {
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google/initiate-2fa`, {
        email: googleAccount.email,
        name: googleAccount.name || googleAccount.email.split('@')[0],
        picture: googleAccount.photoUrl || googleAccount.picture || '',
        idToken: googleAccount.idToken || ''
      }, { timeout: 12000 });

      if (res.data && res.data.success) {
        setPendingGoogleAccount(googleAccount);
        setTwoStepEmail(res.data.email || googleAccount.email);
        setTwoStepMaskedEmail(res.data.maskedEmail || googleAccount.email);
        setTwoStepName(res.data.name || googleAccount.name || 'Eco Citizen');
        setTwoStepCode('');
        setTwoStepCountdown(45);
        setTwoStepModalVisible(true);
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Verification code sent to ${googleAccount.email}`, ToastAndroid.LONG);
        }
      } else {
        Alert.alert('Google Sign-In', res.data?.message || 'Could not initiate two-step verification.');
      }
    } catch (error) {
      console.warn('Google 2FA initiation error:', error);
      Alert.alert('Verification Notice', error.response?.data?.message || error.message || 'Could not send verification code.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 3. Verify Two-Step Code from Gmail & Complete Session Login
  const handleVerifyTwoStepCode = async () => {
    const cleanOtp = twoStepCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      Alert.alert('Code Required', 'Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }

    setTwoStepLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google/verify-2fa`, {
        email: twoStepEmail,
        otp: cleanOtp
      }, { timeout: 12000 });

      if (res.data && res.data.success && res.data.user) {
        // Save as last google user for 1-tap "Continue as <Name>" button
        const userToSave = {
          email: twoStepEmail,
          name: res.data.user.full_name || res.data.user.name || twoStepName || twoStepEmail.split('@')[0],
          photoUrl: pendingGoogleAccount?.photoUrl || res.data.user.picture || ''
        };
        await AsyncStorage.setItem('@last_google_user', JSON.stringify(userToSave));
        setLastGoogleUser(userToSave);

        setTwoStepModalVisible(false);
        const recycleData = res.data.recycleDetails || null;
        await completeSessionLogin(res.data.user, res.data.token, recycleData);
      } else {
        Alert.alert('Verification Failed', res.data?.message || 'Invalid verification code.');
      }
    } catch (error) {
      console.warn('Google 2FA verify error:', error);
      Alert.alert('Verification Failed', error.response?.data?.message || 'Verification code is invalid or has expired. Please check your Gmail and try again.');
    } finally {
      setTwoStepLoading(false);
    }
  };

  // 4. Resend Two-Step Verification Code
  const handleResendTwoStepCode = async () => {
    if (twoStepCountdown > 0 || twoStepLoading) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google/resend-2fa`, {
        email: twoStepEmail
      }, { timeout: 10000 });
      if (res.data?.success) {
        setTwoStepCountdown(45);
        if (Platform.OS === 'android') {
          ToastAndroid.show('New verification code sent to your Gmail', ToastAndroid.LONG);
        }
      } else {
        Alert.alert('Resend Failed', res.data?.message || 'Could not resend code.');
      }
    } catch (error) {
      Alert.alert('Resend Notice', error.response?.data?.message || 'Failed to resend code.');
    }
  };

  // 5. Native Google Sign-In with Mandatory Two-Step Verification
  const handleContinueWithGoogle = async (forcePicker = false) => {
    // If previously signed in on this device and user clicks "Continue as <Name>":
    // STRICTLY REQUIRE TWO-STEP VERIFICATION VIA GMAIL CODE EVERY SINGLE TIME
    if (lastGoogleUser && !forcePicker) {
      await initiateGoogleTwoStep(lastGoogleUser);
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
        await initiateGoogleTwoStep(googleAccount);
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
            {/* Mobile Number or Email Field */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons 
                name={/^\d+$/.test(emailOrPhone.replace(/[\s+-]/g, '')) ? "cellphone" : "email-outline"} 
                size={20} 
                color="#64748B" 
                style={{ marginRight: 8 }} 
              />
              <TextInput
                style={styles.textInput}
                placeholder="Mobile number (03xx) or Email"
                placeholderTextColor="#9CA3AF"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="default"
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

      {/* Two-Step Verification Modal via Gmail */}
      <Modal
        visible={twoStepModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!twoStepLoading) setTwoStepModalVisible(false);
        }}
      >
        <View style={styles.twoStepOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.twoStepKeyboard}
          >
            <View style={styles.twoStepCard}>
              <View style={styles.twoStepShieldCircle}>
                <Icon name="shield-checkmark" size={38} color="#10B981" />
              </View>

              <Text style={styles.twoStepTitle}>Two-Step Verification</Text>
              <Text style={styles.twoStepSubtitle}>
                A 6-digit security code was sent to your Gmail:
              </Text>

              <View style={styles.twoStepEmailChip}>
                <Icon name="logo-google" size={15} color="#EA4335" style={{ marginRight: 6 }} />
                <Text style={styles.twoStepEmailText} numberOfLines={1}>{twoStepEmail}</Text>
              </View>

              <View style={styles.twoStepInputWrapper}>
                <TextInput
                  style={styles.twoStepInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#94A3B8"
                  value={twoStepCode}
                  onChangeText={setTwoStepCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={true}
                  selectionColor="#10B981"
                />
              </View>

              <View style={styles.twoStepResendRow}>
                <TouchableOpacity
                  onPress={handleResendTwoStepCode}
                  disabled={twoStepCountdown > 0 || twoStepLoading}
                  style={styles.twoStepResendBtn}
                >
                  <Text style={[
                    styles.twoStepResendText,
                    (twoStepCountdown > 0 || twoStepLoading) && styles.twoStepResendTextDisabled
                  ]}>
                    {twoStepCountdown > 0 ? `Resend code in ${twoStepCountdown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.twoStepVerifyBtn,
                  (twoStepLoading || twoStepCode.trim().length < 4) && styles.twoStepVerifyBtnDisabled
                ]}
                onPress={handleVerifyTwoStepCode}
                disabled={twoStepLoading || twoStepCode.trim().length < 4}
                activeOpacity={0.85}
              >
                {twoStepLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.twoStepVerifyBtnText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.twoStepCancelBtn}
                onPress={() => {
                  setTwoStepModalVisible(false);
                  setTwoStepCode('');
                }}
                disabled={twoStepLoading}
              >
                <Text style={styles.twoStepCancelText}>Cancel / Choose Another Account</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  // Two-Step Verification (Gmail OTP) Modal Styles
  twoStepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  twoStepKeyboard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  twoStepCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  twoStepShieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  twoStepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  twoStepSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  twoStepEmailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  twoStepEmailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  twoStepInputWrapper: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  twoStepInput: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 10,
    color: '#0F172A',
    textAlign: 'center',
    paddingVertical: 14,
  },
  twoStepResendRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  twoStepResendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  twoStepResendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  twoStepResendTextDisabled: {
    color: '#94A3B8',
  },
  twoStepVerifyBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  twoStepVerifyBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  twoStepVerifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  twoStepCancelBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  twoStepCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
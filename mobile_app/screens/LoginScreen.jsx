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
import { Picker } from '@react-native-picker/picker';

const { GoogleAuth } = NativeModules;
const SAVED_ACCOUNTS_KEY = '@saved_device_google_accounts';

export default function LoginScreen({ navigation, route }) {
  // Mode: 'SSO' (Google / Work SSO) vs 'PASSWORD' (Mobile & PIN)
  const initialMode = route?.params?.initialMode || 'SSO';
  const [activeTab, setActiveTab] = useState(initialMode);

  // Tab 1: Work / Gmail Email OTP State
  const [ssoStep, setSsoStep] = useState(1); // 1 = Enter Email, 2 = Verify Code
  const [ssoEmail, setSsoEmail] = useState('');
  const [ssoCode, setSsoCode] = useState('');
  const [ssoFullName, setSsoFullName] = useState('');
  const [ssoAccountType, setSsoAccountType] = useState('CITIZEN'); // 'CITIZEN' | 'ENTERPRISE'
  const [ssoOrgId, setSsoOrgId] = useState('');
  const [ssoEmployeeId, setSsoEmployeeId] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(true);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [detectedOrgName, setDetectedOrgName] = useState(null);

  // Tab 1: Native 1-Tap Google State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lastGoogleUser, setLastGoogleUser] = useState(null);

  // Tab 1: Two-Step Verification Modal for Native Google Sign-in
  const [twoStepModalVisible, setTwoStepModalVisible] = useState(false);
  const [twoStepEmail, setTwoStepEmail] = useState('');
  const [twoStepMaskedEmail, setTwoStepMaskedEmail] = useState('');
  const [twoStepName, setTwoStepName] = useState('');
  const [twoStepCode, setTwoStepCode] = useState('');
  const [twoStepLoading, setTwoStepLoading] = useState(false);
  const [twoStepCountdown, setTwoStepCountdown] = useState(0);
  const [pendingGoogleAccount, setPendingGoogleAccount] = useState(null);

  // Tab 2: Mobile & Password / PIN State
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Organizations list for corporate selection
  const [organizations, setOrganizations] = useState([
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', domain: 'engro.com' },
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah Limited', domain: 'bankalfalah.com' },
    { org_id: 'ORG_PEPSI', name: 'PepsiCo Pakistan', domain: 'pepsico.com' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', domain: 'ucp.edu.pk' },
    { org_id: 'ORG_UNILEVER', name: 'Unilever Pakistan', domain: 'unilever.com' },
    { org_id: 'ORG_ALLIED', name: 'Allied Bank Limited', domain: 'abl.com' },
  ]);

  // Load organizations from backend
  useEffect(() => {
    let isMounted = true;
    axios.get(`${API_BASE_URL}/enterprise/organizations`, { timeout: 6000 })
      .then(res => {
        if (isMounted && res.data && Array.isArray(res.data.organizations) && res.data.organizations.length > 0) {
          setOrganizations(res.data.organizations);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Check last signed-in Google account on device
  useEffect(() => {
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

  // Cooldown timers
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let timer;
    if (twoStepCountdown > 0) {
      timer = setInterval(() => {
        setTwoStepCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoStepCountdown]);

  // Mobile phone number formatting
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setPhoneNo(cleaned);
    }
  };

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

  // 1. Password Login Handler (Tab 2)
  const handlePasswordLogin = async () => {
    const cleanPhone = phoneNo.trim();
    if (!cleanPhone || cleanPhone.length !== 11 || !/^03\d{9}$/.test(cleanPhone)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 11-digit mobile number starting with 03 (e.g., 03001234567)');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your account password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        mobileOrEmail: cleanPhone,
        password: password
      }, { timeout: 10000 });

      if (response.data.success) {
        const recycleData = response.data.hasRecycleHistory || response.data.recycleDetails || null;
        await completeSessionLogin(response.data.user, response.data.token, recycleData);
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Password login error:', error);
      let errMsg = 'Login failed. Please check your credentials and try again.';
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      Alert.alert('Login Error', errMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  // 2. Native 1-Tap Google Sign-In with 2FA
  const handleContinueWithGoogle = async (forcePicker = false) => {
    if (lastGoogleUser && !forcePicker) {
      await initiateGoogleTwoStep(lastGoogleUser);
      return;
    }

    setGoogleLoading(true);
    try {
      if (!GoogleAuth || !GoogleAuth.signIn) {
        throw new Error('Google Auth service is initializing. Please try again.');
      }

      // Native Android Account Chooser dialog
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
        
        const autoCode = res.data.debugCode || res.data.codePreview || res.data.verificationCode || '';
        setTwoStepCode(autoCode);
        setTwoStepCountdown(45);
        setTwoStepModalVisible(true);
        if (Platform.OS === 'android') {
          if (autoCode && !res.data.emailSent) {
            ToastAndroid.show(`Verification code: ${autoCode}`, ToastAndroid.LONG);
          } else {
            ToastAndroid.show(`Verification code sent to ${googleAccount.email}`, ToastAndroid.LONG);
          }
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
      Alert.alert('Verification Failed', error.response?.data?.message || 'Verification code is invalid or has expired. Please check your Gmail.');
    } finally {
      setTwoStepLoading(false);
    }
  };

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

  // 3. Work / Gmail SSO OTP Code Request (Tab 1 Card)
  const handleRequestSsoCode = async () => {
    const cleanEmail = ssoEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail or Work email address (e.g. name@company.com or name@gmail.com)');
      return;
    }

    setSsoLoading(true);
    try {
      // Send code using backend endpoint
      const res = await axios.post(`${API_BASE_URL}/auth/sso-code`, { email: cleanEmail }, { timeout: 10000 });
      if (res.data && res.data.success) {
        setIsExistingUser(res.data.isExisting);
        if (res.data.orgDetected) {
          setDetectedOrgName(res.data.orgDetected.name);
          setSsoAccountType('ENTERPRISE');
          setSsoOrgId(res.data.orgDetected.id);
        } else {
          setDetectedOrgName(null);
        }

        const autoCode = res.data.codePreview || res.data.debugCode || res.data.verificationCode || '';
        if (autoCode) {
          setSsoCode(autoCode);
        }

        setSsoStep(2);
        setResendCooldown(45);
        if (Platform.OS === 'android') {
          if (autoCode) {
            ToastAndroid.show(`Verification code: ${autoCode}`, ToastAndroid.LONG);
          } else {
            ToastAndroid.show(`Verification code sent to ${cleanEmail}`, ToastAndroid.LONG);
          }
        }
      } else {
        // Fallback to Google initiate-2fa if sso-code returns notice
        const fallbackRes = await axios.post(`${API_BASE_URL}/auth/google/initiate-2fa`, {
          email: cleanEmail,
          name: cleanEmail.split('@')[0]
        }, { timeout: 10000 });

        if (fallbackRes.data && fallbackRes.data.success) {
          setSsoStep(2);
          setResendCooldown(45);
          if (Platform.OS === 'android') {
            ToastAndroid.show(`Verification code sent to ${cleanEmail}`, ToastAndroid.LONG);
          }
        } else {
          Alert.alert('Notice', fallbackRes.data?.message || 'Unable to send verification code. Please check your email.');
        }
      }
    } catch (err) {
      console.warn('SSO Code request fallback check:', err);
      // Direct attempt via initiate-2fa
      try {
        const fallback = await axios.post(`${API_BASE_URL}/auth/google/initiate-2fa`, {
          email: cleanEmail,
          name: cleanEmail.split('@')[0]
        }, { timeout: 10000 });
        if (fallback.data && fallback.data.success) {
          setSsoStep(2);
          setResendCooldown(45);
          return;
        }
      } catch {}

      Alert.alert('Verification Notice', err.response?.data?.message || 'Could not send verification code. Please check your connection.');
    } finally {
      setSsoLoading(false);
    }
  };

  // 4. Verify SSO Code & Complete Sign In
  const handleVerifySsoCode = async () => {
    const cleanCode = ssoCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code sent to your email.');
      return;
    }

    if (!isExistingUser && !ssoFullName.trim()) {
      Alert.alert('Name Required', 'Please enter your Full Name to finish setting up your account.');
      return;
    }

    setSsoLoading(true);
    try {
      const payload = {
        email: ssoEmail.trim().toLowerCase(),
        code: cleanCode,
        otp: cleanCode,
        fullName: ssoFullName.trim(),
        accountType: ssoAccountType,
        orgId: ssoAccountType === 'ENTERPRISE' ? ssoOrgId : null,
        employeeId: ssoAccountType === 'ENTERPRISE' ? ssoEmployeeId.trim() : null
      };

      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/auth/verify-sso`, payload, { timeout: 12000 });
      } catch (firstErr) {
        // Fallback to verify-2fa
        res = await axios.post(`${API_BASE_URL}/auth/google/verify-2fa`, {
          email: payload.email,
          otp: cleanCode
        }, { timeout: 12000 });
      }

      if (res.data && res.data.success && res.data.user) {
        const recycleData = res.data.recycleDetails || null;
        await completeSessionLogin(res.data.user, res.data.token, recycleData);
      } else {
        Alert.alert('Verification Failed', res.data?.message || 'Invalid or expired verification code.');
      }
    } catch (err) {
      console.error('Verify SSO error:', err);
      Alert.alert('Verification Error', err.response?.data?.message || 'Could not verify code. Please try again.');
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070C16" />

      {/* Modern Ambient Glow Effects */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Icon name="leaf" size={28} color="#10B981" />
            </View>
            <Text style={styles.brandTitle}>
              Peco<Text style={styles.brandAccent}>Drop</Text>
            </Text>
            <Text style={styles.brandTagline}>SMART REVERSE VENDING ECOSYSTEM</Text>

            <View style={styles.ecoPill}>
              <Icon name="sparkles" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
              <Text style={styles.ecoPillText}>Next-Gen Smart Recycling</Text>
            </View>
          </View>

          {/* Dual Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SSO' && styles.tabButtonActive]}
              onPress={() => setActiveTab('SSO')}
              activeOpacity={0.8}
            >
              <Icon
                name="logo-google"
                size={16}
                color={activeTab === 'SSO' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'SSO' && styles.tabTextActive]}>
                Google / Work SSO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'PASSWORD' && styles.tabButtonActive]}
              onPress={() => setActiveTab('PASSWORD')}
              activeOpacity={0.8}
            >
              <Icon
                name="call-outline"
                size={16}
                color={activeTab === 'PASSWORD' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'PASSWORD' && styles.tabTextActive]}>
                Mobile & PIN
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: GOOGLE / WORK SSO */}
          {activeTab === 'SSO' && (
            <View style={styles.glassCard}>
              {/* Native 1-Tap Google SSO Option */}
              <TouchableOpacity
                style={styles.googleNativeBtn}
                onPress={() => handleContinueWithGoogle(false)}
                disabled={googleLoading || ssoLoading}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconContainer}>
                      <Icon name="logo-google" size={19} color="#EA4335" />
                    </View>
                    <Text style={styles.googleNativeBtnText} numberOfLines={1}>
                      {lastGoogleUser
                        ? `Continue as ${lastGoogleUser.name || lastGoogleUser.email}`
                        : 'Sign in with Google (1-Tap)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {lastGoogleUser && (
                <TouchableOpacity
                  onPress={() => handleContinueWithGoogle(true)}
                  disabled={googleLoading || ssoLoading}
                  style={styles.switchAccountBtn}
                >
                  <Text style={styles.switchAccountText}>Switch or use another account</Text>
                </TouchableOpacity>
              )}

              {/* Elegant Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL CODE</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Work / Personal Email OTP Card */}
              {ssoStep === 1 ? (
                <>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="shield-checkmark" size={22} color="#10B981" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.cardTitle}>One-Tap SSO Sign In</Text>
                      <Text style={styles.cardSubtitle}>
                        Instant access via Gmail or Corporate email code
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>GMAIL OR WORK EMAIL</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. name@company.com or name@gmail.com"
                        placeholderTextColor="#64748B"
                        value={ssoEmail}
                        onChangeText={setSsoEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleRequestSsoCode}
                    disabled={ssoLoading || googleLoading}
                    activeOpacity={0.85}
                  >
                    {ssoLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Icon name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Get Verification Code</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.securityHint}>
                    <Icon name="lock-closed" size={13} color="#10B981" style={{ marginRight: 5 }} />
                    <Text style={styles.securityHintText}>
                      No password required. A 6-digit OTP secures your access.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="key-outline" size={22} color="#38BDF8" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.cardTitle}>Verify Security Code</Text>
                      <Text style={styles.cardSubtitle}>
                        Sent to <Text style={{ color: '#BAE6FD', fontWeight: 'bold' }}>{ssoEmail}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* If new user detected, prompt for name and user type */}
                  {!isExistingUser && (
                    <View style={styles.newUserBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Icon name="sparkles" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                        <Text style={styles.newUserBannerTitle}>Welcome! New Eco Account</Text>
                      </View>
                      <Text style={styles.newUserBannerText}>
                        Complete your details to finish setting up your account:
                      </Text>

                      <View style={[styles.inputGroup, { marginTop: 10 }]}>
                        <Text style={styles.inputLabel}>YOUR FULL NAME</Text>
                        <View style={styles.inputWrapper}>
                          <Icon name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                          <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Ali Ahmed"
                            placeholderTextColor="#64748B"
                            value={ssoFullName}
                            onChangeText={setSsoFullName}
                          />
                        </View>
                      </View>

                      {/* Account Type Toggle */}
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.inputLabel}>ACCOUNT TYPE</Text>
                        <View style={styles.roleToggleRow}>
                          <TouchableOpacity
                            style={[
                              styles.roleBtn,
                              ssoAccountType === 'CITIZEN' && styles.roleBtnActiveCitizen
                            ]}
                            onPress={() => setSsoAccountType('CITIZEN')}
                          >
                            <Text style={[styles.roleBtnText, ssoAccountType === 'CITIZEN' && styles.roleBtnTextActive]}>
                              🌿 Eco Citizen
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.roleBtn,
                              ssoAccountType === 'ENTERPRISE' && styles.roleBtnActiveCorporate
                            ]}
                            onPress={() => setSsoAccountType('ENTERPRISE')}
                          >
                            <Text style={[styles.roleBtnText, ssoAccountType === 'ENTERPRISE' && styles.roleBtnTextActive]}>
                              🏢 Corporate Staff
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Corporate extra fields */}
                      {ssoAccountType === 'ENTERPRISE' && (
                        <View style={{ marginTop: 10 }}>
                          {detectedOrgName ? (
                            <View style={styles.orgDetectedBadge}>
                              <Icon name="business" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
                              <Text style={styles.orgDetectedText}>Detected: {detectedOrgName}</Text>
                            </View>
                          ) : (
                            <View style={styles.pickerWrapper}>
                              <Picker
                                selectedValue={ssoOrgId}
                                style={styles.picker}
                                dropdownIconColor="#FFFFFF"
                                onValueChange={(val) => setSsoOrgId(val)}
                              >
                                <Picker.Item label="-- Select Organization --" value="" color="#94A3B8" />
                                {organizations.map(org => (
                                  <Picker.Item key={org.org_id} label={org.name} value={org.org_id} color="#FFFFFF" />
                                ))}
                              </Picker>
                            </View>
                          )}

                          <View style={[styles.inputWrapper, { marginTop: 8 }]}>
                            <Icon name="id-card-outline" size={20} color="#64748B" style={styles.inputIcon} />
                            <TextInput
                              style={styles.textInput}
                              placeholder="Employee / Staff ID (optional)"
                              placeholderTextColor="#64748B"
                              value={ssoEmployeeId}
                              onChangeText={setSsoEmployeeId}
                              autoCapitalize="characters"
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 6-Digit Code Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="key-outline" size={20} color="#10B981" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, styles.otpInput]}
                        placeholder="123456"
                        placeholderTextColor="#475569"
                        value={ssoCode}
                        onChangeText={setSsoCode}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifySsoCode}
                    disabled={ssoLoading}
                    activeOpacity={0.85}
                  >
                    {ssoLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Icon name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>
                          {isExistingUser ? 'Verify & Sign In' : 'Verify & Complete Registration'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.ssoActionRow}>
                    <TouchableOpacity
                      onPress={handleRequestSsoCode}
                      disabled={resendCooldown > 0 || ssoLoading}
                    >
                      <Text style={[styles.resendText, resendCooldown > 0 && { color: '#64748B' }]}>
                        {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setSsoStep(1)}>
                      <Text style={styles.changeEmailText}>Change Email</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {/* TAB 2: MOBILE NUMBER & PIN / PASSWORD LOGIN */}
          {activeTab === 'PASSWORD' && (
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Icon name="lock-closed" size={22} color="#0EA5E9" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.cardTitle}>Mobile & Password</Text>
                  <Text style={styles.cardSubtitle}>Sign in with your registered phone number</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER (11 DIGITS)</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="phone-portrait-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="03001234567"
                    placeholderTextColor="#64748B"
                    value={phoneNo}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="key-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgetPassword')}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#0284C7' }]}
                onPress={handlePasswordLogin}
                disabled={loginLoading}
                activeOpacity={0.85}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Icon name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Switch to Sign Up */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Don't have an account yet?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={styles.signUpLinkBtn}
            >
              <Text style={styles.signUpLinkText}>Create Account</Text>
              <Icon name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Security & ESG Note */}
          <View style={styles.complianceBadge}>
            <Icon name="shield-checkmark-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.complianceText}>
              256-Bit Encrypted • ISO 14001 ESG Compliant
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Two-Step Verification Modal for Native Google Sign-In */}
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

              <View style={[styles.inputWrapper, { width: '100%', marginVertical: 14 }]}>
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#475569"
                  value={twoStepCode}
                  onChangeText={setTwoStepCode}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { width: '100%', marginTop: 4 }]}
                onPress={handleVerifyTwoStepCode}
                disabled={twoStepLoading}
              >
                {twoStepLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.twoStepFooterRow}>
                <TouchableOpacity
                  onPress={handleResendTwoStepCode}
                  disabled={twoStepCountdown > 0 || twoStepLoading}
                >
                  <Text style={[styles.resendText, twoStepCountdown > 0 && { color: '#64748B' }]}>
                    {twoStepCountdown > 0 ? `Resend Code (${twoStepCountdown}s)` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTwoStepModalVisible(false)}
                  disabled={twoStepLoading}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#070C16',
  },
  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandAccent: {
    color: '#10B981',
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.8,
    marginTop: 4,
  },
  ecoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginTop: 10,
  },
  ecoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BAE6FD',
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  googleNativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIconContainer: {
    marginRight: 10,
  },
  googleNativeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchAccountBtn: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  switchAccountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 10,
    letterSpacing: 0.8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#10B981',
    textAlign: 'center',
  },
  eyeBtn: {
    padding: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  securityHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  securityHintText: {
    fontSize: 11,
    color: '#64748B',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotBtn: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  newUserBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 14,
    marginBottom: 18,
  },
  newUserBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FCD34D',
  },
  newUserBannerText: {
    fontSize: 11,
    color: '#FDE68A',
    lineHeight: 16,
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  roleBtnActiveCitizen: {
    backgroundColor: '#10B981',
  },
  roleBtnActiveCorporate: {
    backgroundColor: '#0284C7',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  orgDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  orgDetectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BAE6FD',
  },
  pickerWrapper: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    color: '#FFFFFF',
  },
  ssoActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  changeEmailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    gap: 8,
  },
  footerPrompt: {
    fontSize: 13,
    color: '#94A3B8',
  },
  signUpLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  signUpLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  complianceText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  twoStepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  twoStepKeyboard: {
    width: '100%',
    alignItems: 'center',
  },
  twoStepCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  twoStepShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  twoStepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  twoStepSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
  },
  twoStepEmailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 12,
  },
  twoStepEmailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 240,
  },
  twoStepFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
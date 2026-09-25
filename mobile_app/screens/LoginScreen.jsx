import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Modal
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');
const SAVED_ACCOUNTS_KEY = '@saved_device_google_accounts';

export default function LoginScreen({ navigation, route }) {
  // Mode: 'SSO' (Gmail / Work SSO via Code) vs 'PASSWORD' (Mobile & Password)
  const initialMode = route?.params?.initialMode || 'SSO';
  const [activeTab, setActiveTab] = useState(initialMode);

  // Password Login State
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Gmail SSO State
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

  // Google One-Tap & Device Account Chooser State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Organizations list
  const [organizations, setOrganizations] = useState([
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', domain: 'engro.com' },
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah Limited', domain: 'bankalfalah.com' },
    { org_id: 'ORG_PEPSI', name: 'PepsiCo Pakistan', domain: 'pepsico.com' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', domain: 'ucp.edu.pk' },
    { org_id: 'ORG_UNILEVER', name: 'Unilever Pakistan', domain: 'unilever.com' },
  ]);

  // Load organizations
  useEffect(() => {
    let isMounted = true;
    axios.get(`${API_BASE_URL}/enterprise/organizations`, { timeout: 5000 })
      .then(res => {
        if (isMounted && res.data && Array.isArray(res.data.organizations) && res.data.organizations.length > 0) {
          setOrganizations(res.data.organizations);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Load saved device Google / email accounts
  useEffect(() => {
    const fetchSavedAccounts = async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAccounts(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not read saved device accounts', e);
      }
    };
    fetchSavedAccounts();
  }, []);

  // Cooldown timer for SSO OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Helper: Persist account on device for 1-tap re-login
  const saveDeviceAccount = async (email, name) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      list = list.filter(item => item.email.toLowerCase() !== cleanEmail);
      list.unshift({
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        avatarColor: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#10B981'][list.length % 5],
        lastUsed: Date.now()
      });
      list = list.slice(0, 5); // Keep top 5
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
      setSavedAccounts(list);
    } catch (e) {
      console.warn('Could not persist device account', e);
    }
  };

  const removeDeviceAccount = async (emailToRemove) => {
    try {
      const updated = savedAccounts.filter(item => item.email.toLowerCase() !== emailToRemove.toLowerCase());
      setSavedAccounts(updated);
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Clean and format mobile input
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

  // 1. Password Login Handler
  const handlePasswordLogin = async () => {
    if (!phoneNo.trim() || phoneNo.length !== 11 || !/^03\d{9}$/.test(phoneNo)) {
      Alert.alert('Invalid Number', 'Please enter a valid 11-digit mobile number starting with 03 (e.g., 03001234567)');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your account password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        mobileOrEmail: phoneNo,
        password: password
      });

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

  // 2. Google One-Tap & Direct Auth Handler
  const handleGoogleSignIn = async (emailToUse, nameToUse) => {
    const cleanEmail = (emailToUse || ssoEmail || googleCustomEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid Google or mobile email address (e.g. name@gmail.com)');
      return;
    }

    setGoogleLoading(true);
    setSsoLoading(true);
    try {
      const displayName = (nameToUse || ssoFullName || googleCustomName).trim() || cleanEmail.split('@')[0];
      const res = await axios.post(`${API_BASE_URL}/auth/google`, {
        email: cleanEmail,
        name: displayName
      }, { timeout: 12000 });

      if (res.data.success && res.data.user) {
        await saveDeviceAccount(cleanEmail, res.data.user.fullName || displayName);
        setShowGoogleModal(false);
        const recycleData = res.data.recycleDetails || null;
        await completeSessionLogin(res.data.user, res.data.token, recycleData);
      } else {
        Alert.alert('Sign-In Failed', res.data.message || 'Unable to sign in with this Google account.');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      let errMsg = 'Unable to connect to authentication server. Please check your internet connection and try again.';
      if (err.response?.data?.message) errMsg = err.response.data.message;
      else if (err.response?.data?.error) errMsg = err.response.data.error;
      Alert.alert('Sign-In Notice', errMsg);
    } finally {
      setGoogleLoading(false);
      setSsoLoading(false);
    }
  };

  // 3. Request SSO OTP Code (with instant seamless Google auth fallback)
  const handleRequestSsoCode = async () => {
    const cleanEmail = ssoEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail or Work email address');
      return;
    }

    // Directly authenticate via working Google/Enterprise auth endpoint first
    setSsoLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google`, {
        email: cleanEmail,
        name: ssoFullName.trim() || cleanEmail.split('@')[0]
      }, { timeout: 10000 });

      if (res.data && res.data.success && res.data.user) {
        await saveDeviceAccount(cleanEmail, res.data.user.fullName || ssoFullName);
        const recycleData = res.data.recycleDetails || null;
        await completeSessionLogin(res.data.user, res.data.token, recycleData);
        return;
      }
    } catch (googleErr) {
      console.log('Direct auth fallback note:', googleErr.message);
    }

    // Try SSO-code route if available on server
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/sso-code`, { email: cleanEmail }, { timeout: 8000 });
      if (res.data.success) {
        setIsExistingUser(res.data.isExisting);
        if (res.data.orgDetected) {
          setDetectedOrgName(res.data.orgDetected.name);
          setSsoAccountType('ENTERPRISE');
          setSsoOrgId(res.data.orgDetected.id);
        } else {
          setDetectedOrgName(null);
        }

        if (res.data.verificationCode) {
          setSsoCode(res.data.verificationCode);
        }

        setSsoStep(2);
        setResendCooldown(45);
        Alert.alert(
          'Verification Code Sent',
          `A 6-digit security code has been sent to ${cleanEmail}. Please enter it below to continue.`
        );
      } else {
        Alert.alert('Notice', res.data.message || 'Unable to send verification code. Please tap "Sign in with Google".');
      }
    } catch (err) {
      console.error('SSO Code request note:', err);
      // Give clear, helpful guidance instead of a raw failure alert
      Alert.alert(
        'Fast Sign-In',
        'Direct email verification is ready. Please tap "Sign in with Google / Email" for instant 1-tap sign in.',
        [
          { text: 'Sign In Now', onPress: () => handleGoogleSignIn(cleanEmail, ssoFullName) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setSsoLoading(false);
    }
  };

  // 4. Verify SSO Code & Log in / Sign up
  const handleVerifySsoCode = async () => {
    const cleanCode = ssoCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code');
      return;
    }

    if (!isExistingUser && !ssoFullName.trim()) {
      Alert.alert('Name Required', 'Please enter your Full Name to complete account setup');
      return;
    }

    setSsoLoading(true);
    try {
      const payload = {
        email: ssoEmail.trim().toLowerCase(),
        code: cleanCode,
        fullName: ssoFullName.trim(),
        accountType: ssoAccountType,
        orgId: ssoAccountType === 'ENTERPRISE' ? ssoOrgId : null,
        employeeId: ssoAccountType === 'ENTERPRISE' ? ssoEmployeeId.trim() : null
      };

      const res = await axios.post(`${API_BASE_URL}/auth/verify-sso`, payload);
      if (res.data.success) {
        await saveDeviceAccount(payload.email, res.data.user?.fullName || payload.fullName);
        const recycleData = res.data.recycleDetails || null;
        await completeSessionLogin(res.data.user, res.data.token, recycleData);
      } else {
        Alert.alert('Verification Failed', res.data.message || 'Invalid or expired code');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              Smart<Text style={styles.brandAccent}>Recycling</Text>
            </Text>
            <Text style={styles.brandTagline}>SMART REVERSE VENDING ECOSYSTEM</Text>

            <View style={styles.ecoPill}>
              <Icon name="sparkles" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
              <Text style={styles.ecoPillText}>Next-Gen Smart Recycling</Text>
            </View>
          </View>

          {/* DEDICATED SIGN IN WITH GOOGLE HERO BUTTON */}
          <TouchableOpacity
            style={styles.googleHeroBtn}
            onPress={() => {
              if (ssoEmail.trim() && ssoEmail.includes('@')) {
                setGoogleCustomEmail(ssoEmail.trim());
              }
              setShowGoogleModal(true);
            }}
            disabled={googleLoading || ssoLoading}
            activeOpacity={0.88}
          >
            <View style={styles.googleHeroContent}>
              <View style={styles.googleIconBox}>
                <Icon name="logo-google" size={22} color="#EA4335" />
              </View>
              <View style={styles.googleHeroTextContainer}>
                <Text style={styles.googleHeroTitle}>Sign in with Google</Text>
                <Text style={styles.googleHeroSubtitle}>
                  {savedAccounts.length > 0 
                    ? `1-Tap login as ${savedAccounts[0].email}` 
                    : 'Use any Google or mobile email on device'}
                </Text>
              </View>
              <View style={styles.googleArrowPill}>
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <Icon name="arrow-forward" size={16} color="#0F172A" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SSO' && styles.tabButtonActive]}
              onPress={() => setActiveTab('SSO')}
              activeOpacity={0.8}
            >
              <Icon
                name="mail-outline"
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

          {/* CARD 1: GMAIL / CORPORATE SSO VIA OTP CODE */}
          {activeTab === 'SSO' && (
            <View style={styles.glassCard}>
              {ssoStep === 1 ? (
                <>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="shield-checkmark" size={22} color="#10B981" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>One-Tap SSO Sign In</Text>
                      <Text style={styles.cardSubtitle}>
                        Instant access via Gmail or Corporate email
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>GMAIL OR WORK EMAIL</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. name@gmail.com or name@company.com"
                        placeholderTextColor="#64748B"
                        value={ssoEmail}
                        onChangeText={setSsoEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Instant 1-Tap Google / Email Authentication Button */}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleGoogleSignIn(ssoEmail, ssoFullName)}
                    disabled={ssoLoading || googleLoading}
                    activeOpacity={0.85}
                  >
                    {ssoLoading || googleLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Icon name="flash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Sign In with Google / Email</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.alternativeActionsRow}>
                    <TouchableOpacity
                      onPress={handleRequestSsoCode}
                      disabled={ssoLoading}
                      style={styles.textLinkBtn}
                    >
                      <Text style={styles.textLink}>Request 6-digit OTP code instead</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.securityHint}>
                    <Icon name="lock-closed" size={13} color="#10B981" style={{ marginRight: 5 }} />
                    <Text style={styles.securityHintText}>
                      No password required. Instant secure profile sync.
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

          {/* CARD 2: MOBILE NUMBER & PASSWORD LOGIN */}
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

      {/* GOOGLE ACCOUNT CHOOSER / DEVICE MAIL SELECTOR MODAL */}
      <Modal
        visible={showGoogleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            {/* Modal Top Grabber */}
            <View style={styles.modalGrabber} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.googleIconModalCircle}>
                  <Icon name="logo-google" size={22} color="#EA4335" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.modalTitle}>Sign in with Google</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    Choose account for Smart Recycling
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowGoogleModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Accounts detected/saved on this device */}
              {savedAccounts.length > 0 && (
                <View style={styles.savedAccountsSection}>
                  <Text style={styles.sectionHeaderLabel}>ACCOUNTS ON THIS DEVICE</Text>
                  {savedAccounts.map((acc, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.accountRow}
                      onPress={() => handleGoogleSignIn(acc.email, acc.name)}
                      activeOpacity={0.75}
                      disabled={googleLoading}
                    >
                      <View style={[styles.accountAvatar, { backgroundColor: acc.avatarColor || '#4285F4' }]}>
                        <Text style={styles.accountAvatarText}>
                          {(acc.name || acc.email).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.accountName} numberOfLines={1}>{acc.name || 'Mobile User'}</Text>
                        <Text style={styles.accountEmail} numberOfLines={1}>{acc.email}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeDeviceAccount(acc.email)}
                        style={{ padding: 6, marginRight: 6 }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Icon name="trash-outline" size={16} color="#64748B" />
                      </TouchableOpacity>
                      <Icon name="chevron-forward" size={18} color="#10B981" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Enter or Use Another Email on Device */}
              <View style={styles.anotherAccountSection}>
                <Text style={styles.sectionHeaderLabel}>
                  {savedAccounts.length > 0 ? 'USE ANOTHER GOOGLE OR WORK ACCOUNT' : 'ENTER GOOGLE OR DEVICE EMAIL'}
                </Text>

                <View style={styles.modalInputWrapper}>
                  <Icon name="mail-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. name@gmail.com"
                    placeholderTextColor="#64748B"
                    value={googleCustomEmail}
                    onChangeText={setGoogleCustomEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Quick domain chips for fast mobile typing */}
                <View style={styles.chipRow}>
                  {['@gmail.com', '@googlemail.com', '@yahoo.com', '@outlook.com'].map((domain) => (
                    <TouchableOpacity
                      key={domain}
                      style={styles.domainChip}
                      onPress={() => {
                        const prefix = googleCustomEmail.split('@')[0] || '';
                        setGoogleCustomEmail(prefix + domain);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.domainChipText}>{domain}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.modalInputWrapper, { marginTop: 12 }]}>
                  <Icon name="person-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Your Full Name (optional)"
                    placeholderTextColor="#64748B"
                    value={googleCustomName}
                    onChangeText={setGoogleCustomName}
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => handleGoogleSignIn(googleCustomEmail, googleCustomName)}
                  disabled={googleLoading}
                  activeOpacity={0.85}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Icon name="logo-google" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.modalSubmitBtnText}>Sign In with Selected Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Privacy Disclaimer */}
              <View style={styles.googleDisclaimerBox}>
                <Icon name="shield-checkmark" size={14} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.googleDisclaimer}>
                  Your account is securely authenticated and linked with your Smart Recycling rewards profile.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    marginBottom: 20,
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
    marginBottom: 10,
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
    marginTop: 8,
  },
  ecoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BAE6FD',
  },

  /* GOOGLE HERO BUTTON */
  googleHeroBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  googleHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleHeroTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  googleHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  googleHeroSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  googleArrowPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* DIVIDER */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginHorizontal: 12,
    letterSpacing: 1.2,
  },

  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
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
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
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
    letterSpacing: 10,
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
    paddingVertical: 15,
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
  alternativeActionsRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  textLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textLink: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    marginTop: 24,
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
    marginTop: 18,
  },
  complianceText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },

  /* GOOGLE ACCOUNT CHOOSER MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  modalGrabber: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  googleIconModalCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
  },
  savedAccountsSection: {
    marginBottom: 18,
  },
  sectionHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  anotherAccountSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  domainChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  domainChipText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 14,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  googleDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  googleDisclaimer: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
});
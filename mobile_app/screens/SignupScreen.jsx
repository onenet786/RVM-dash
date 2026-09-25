import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contextApi/auth';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

const PRESET_AVATARS = [
  { id: 'male', label: 'Male', icon: 'man', color: '#0284C7' },
  { id: 'female', label: 'Female', icon: 'woman', color: '#EC4899' },
  { id: 'leaf', label: 'Eco Champion', icon: 'leaf', color: '#10B981' },
  { id: 'earth', label: 'Earth Guardian', icon: 'earth', color: '#0EA5E9' },
  { id: 'recycle', label: 'Super Recycler', icon: 'refresh-circle', color: '#059669' },
  { id: 'star', label: 'Eco Star', icon: 'star', color: '#EAB308' },
];

const SignUpScreen = ({ navigation }) => {
  const [accountType, setAccountType] = useState('CITIZEN'); // 'CITIZEN' | 'ENTERPRISE'
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [organizations, setOrganizations] = useState([
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', domain: 'engro.com' },
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah Limited', domain: 'bankalfalah.com' },
    { org_id: 'ORG_PEPSI', name: 'PepsiCo Pakistan', domain: 'pepsico.com' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', domain: 'ucp.edu.pk' },
    { org_id: 'ORG_UNILEVER', name: 'Unilever Pakistan', domain: 'unilever.com' },
  ]);

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

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('male');
  const [age, setAge] = useState('');
  const [nic, setNic] = useState('');
  const [gender, setGender] = useState('male');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const getAvatarImage = () => {
    switch(selectedAvatar || gender) {
      case 'male':
        return require('../assets/images/male-avatar.png');
      case 'female':
        return require('../assets/images/female-avatar.png');
      default:
        return require('../assets/images/neutral-avatar.png');
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Format DOB input (YYYY-MM-DD)
  const handleDobChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
    }
    if (cleaned.length > 6) {
      formatted = `${formatted.substring(0, 7)}-${formatted.substring(7)}`;
    }
    if (cleaned.length <= 8) {
      setDob(formatted);
      if (cleaned.length === 8) {
        const yr = parseInt(cleaned.substring(0, 4));
        const currentYear = new Date().getFullYear();
        if (yr > 1920 && yr <= currentYear) {
          setAge(String(currentYear - yr));
        }
      }
    }
  };

  // Format CNIC input (42401-2285792-9)
  const handleNicChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
    }
    if (cleaned.length > 12) {
      formatted = `${formatted.substring(0, 13)}-${formatted.substring(13)}`;
    }
    if (cleaned.length <= 13) {
      setNic(formatted);
    }
  };

  // Format mobile number (11 digits)
  const handleMobileChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setMobile(cleaned);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Full Name Required', 'Please enter your Full Name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Username Required', 'Please choose a username');
      return;
    }

    if (!mobile.trim() || mobile.length !== 11 || !/^03\d{9}$/.test(mobile)) {
      Alert.alert('Invalid Mobile', 'Please enter an 11-digit mobile number starting with 03 (e.g. 03001234567)');
      return;
    }

    const cleanedNic = nic.replace(/\D/g, '');
    if (!nic.trim() || cleanedNic.length !== 13 || !/^\d{5}-\d{7}-\d{1}$/.test(nic)) {
      Alert.alert('Invalid CNIC', 'Please enter a valid 13-digit CNIC (e.g. 42401-2285792-9)');
      return;
    }

    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert('Invalid DOB', 'Please enter your Date of Birth in YYYY-MM-DD format');
      return;
    }

    const computedAge = age ? parseInt(age) : 20;
    if (isNaN(computedAge) || computedAge < 10 || computedAge > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 10 and 120');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        fullName: fullName.trim(),
        username: username.trim(),
        mobile: mobile.trim(),
        nic: cleanedNic,
        age: computedAge,
        dob: dob.trim(),
        profileImage: selectedAvatar,
        gender,
        email: email.trim().toLowerCase(),
        password,
        profilePic: selectedAvatar,
        userType: accountType,
        orgId: accountType === 'ENTERPRISE' ? selectedOrgId : null,
        employeeId: accountType === 'ENTERPRISE' ? employeeId.trim() : '',
        companyCode: accountType === 'ENTERPRISE' ? companyCode.trim() : ''
      };

      await register(userData);

      Alert.alert(
        'Registration Complete',
        'Your smart recycling account has been registered successfully!',
        [
          {
            text: 'Sign In Now',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'This mobile number, username, or email is already registered';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
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
              <Icon name="person-add" size={26} color="#10B981" />
            </View>
            <Text style={styles.brandTitle}>
              Create <Text style={styles.brandAccent}>Account</Text>
            </Text>
            <Text style={styles.brandTagline}>JOIN THE CLOSED-LOOP SUSTAINABILITY MOVEMENT</Text>
          </View>

          {/* Quick SSO Banner - Fast Route */}
          <TouchableOpacity
            style={styles.quickSsoBanner}
            onPress={() => navigation.navigate('Login', { initialMode: 'SSO' })}
            activeOpacity={0.85}
          >
            <View style={styles.quickSsoLeft}>
              <Icon name="logo-google" size={20} color="#38BDF8" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.quickSsoTitle}>Want instant 1-tap sign up?</Text>
                <Text style={styles.quickSsoSubtitle}>Verify via Gmail / Work SSO Code without forms</Text>
              </View>
            </View>
            <Icon name="arrow-forward-circle" size={24} color="#38BDF8" />
          </TouchableOpacity>

          {/* Registration Form Card */}
          <View style={styles.glassCard}>
            {/* Avatar Display & Gallery */}
            <View style={styles.avatarSection}>
              <View style={styles.profilePicWrapper}>
                <Image source={getAvatarImage()} style={styles.profilePic} />
              </View>
              <Text style={styles.avatarHeading}>Choose Eco Avatar</Text>
              <View style={styles.avatarRow}>
                {PRESET_AVATARS.map((av) => (
                  <TouchableOpacity
                    key={av.id}
                    style={[
                      styles.avatarBadge,
                      selectedAvatar === av.id && styles.avatarBadgeSelected
                    ]}
                    onPress={() => setSelectedAvatar(av.id)}
                  >
                    <Icon
                      name={av.icon}
                      size={16}
                      color={selectedAvatar === av.id ? '#10B981' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.avatarBadgeText,
                        selectedAvatar === av.id && styles.avatarBadgeTextSelected
                      ]}
                    >
                      {av.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Account Type Selector: Eco Citizen vs Corporate Staff */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCOUNT MEMBERSHIP TYPE</Text>
              <View style={styles.accountTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.accountTypeBtn,
                    accountType === 'CITIZEN' && styles.accountTypeBtnActiveCitizen
                  ]}
                  onPress={() => setAccountType('CITIZEN')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'CITIZEN' && styles.accountTypeTextActive
                    ]}
                  >
                    🌿 Eco Citizen
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.accountTypeBtn,
                    accountType === 'ENTERPRISE' && styles.accountTypeBtnActiveCorporate
                  ]}
                  onPress={() => setAccountType('ENTERPRISE')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'ENTERPRISE' && styles.accountTypeTextActive
                    ]}
                  >
                    🏢 Corporate Staff
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Corporate Affiliation Section if Enterprise */}
            {accountType === 'ENTERPRISE' && (
              <View style={styles.corporateBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon name="business" size={18} color="#38BDF8" style={{ marginRight: 6 }} />
                  <Text style={styles.corporateBoxTitle}>Corporate Enterprise Affiliation</Text>
                </View>
                <Text style={styles.corporateBoxSub}>
                  Link your account to your workplace for corporate CSR leaderboards, cafeteria credits, and employee perks:
                </Text>

                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedOrgId}
                    style={styles.picker}
                    dropdownIconColor="#FFFFFF"
                    onValueChange={(val) => setSelectedOrgId(val)}
                  >
                    <Picker.Item label="-- Select Your Company / Campus --" value="" color="#94A3B8" />
                    {organizations.map(org => (
                      <Picker.Item key={org.org_id} label={org.name} value={org.org_id} color="#FFFFFF" />
                    ))}
                  </Picker>
                </View>

                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Icon name="id-card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Staff / Employee ID (e.g. EMP-1042)"
                    placeholderTextColor="#64748B"
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <Icon name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ali Ahmed"
                  placeholderTextColor="#64748B"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View style={styles.inputWrapper}>
                <Icon name="at-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. aliahmad"
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER (11 DIGITS)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="03001234567"
                  placeholderTextColor="#64748B"
                  value={mobile}
                  onChangeText={handleMobileChange}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            </View>

            {/* CNIC */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CNIC NUMBER (13 DIGITS)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="42401-2285792-9"
                  placeholderTextColor="#64748B"
                  value={nic}
                  onChangeText={handleNicChange}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
            </View>

            {/* DOB & Age Row */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="calendar-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={dob}
                    onChangeText={handleDobChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>AGE</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="speedometer-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="25"
                    placeholderTextColor="#64748B"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* Gender Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GENDER</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={gender}
                  style={styles.picker}
                  dropdownIconColor="#FFFFFF"
                  onValueChange={(val) => {
                    setGender(val);
                    if (val === 'female' && selectedAvatar === 'male') setSelectedAvatar('female');
                    if (val === 'male' && selectedAvatar === 'female') setSelectedAvatar('male');
                  }}
                >
                  <Picker.Item label="Male" value="male" color="#FFFFFF" />
                  <Picker.Item label="Female" value="female" color="#FFFFFF" />
                  <Picker.Item label="Prefer not to say" value="other" color="#FFFFFF" />
                </Picker>
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD (MIN 6 CHARACTERS)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Create a secure password"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeBtn}>
                  <Icon
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Icon name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-type your password"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShowConfirmPassword} style={styles.eyeBtn}>
                  <Icon
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Icon name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Complete Registration</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Already have an account */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLinkBtn}
            >
              <Text style={styles.loginLinkText}>Sign In</Text>
              <Icon name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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
    paddingTop: Platform.OS === 'ios' ? 60 : 35,
    paddingBottom: 45,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandAccent: {
    color: '#10B981',
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  quickSsoBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickSsoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickSsoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#BAE6FD',
  },
  quickSsoSubtitle: {
    fontSize: 11,
    color: '#7DD3FC',
    marginTop: 1,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: '#10B981',
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#0F172A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  avatarHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  avatarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  avatarBadgeSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  avatarBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  avatarBadgeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
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
    paddingVertical: 11,
  },
  eyeBtn: {
    padding: 8,
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
  accountTypeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  accountTypeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  accountTypeBtnActiveCitizen: {
    backgroundColor: '#059669',
  },
  accountTypeBtnActiveCorporate: {
    backgroundColor: '#0284C7',
  },
  accountTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  accountTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  corporateBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1.2,
    borderColor: '#38BDF8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  corporateBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#BAE6FD',
  },
  corporateBoxSub: {
    fontSize: 11,
    color: '#E0F2FE',
    lineHeight: 15,
    marginBottom: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 10,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 8,
  },
  footerPrompt: {
    fontSize: 13,
    color: '#94A3B8',
  },
  loginLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
});

export default SignUpScreen;
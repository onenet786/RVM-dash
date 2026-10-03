import React, { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
  Alert, 
  Animated, 
  Image, 
  SafeAreaView, 
  ScrollView, 
  Share,
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ToastAndroid,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import RewardImage from '../assets/images/reward.png';
import ShopImage from '../assets/images/shop.png';
import SpendImage from '../assets/images/spend.png';
import StatsImage from '../assets/images/stats.png';

const PRESET_AVATARS = [
  { id: 'male', label: 'Male', icon: 'account', color: '#0284C7' },
  { id: 'female', label: 'Female', icon: 'account-heart', color: '#EC4899' },
  { id: 'leaf', label: 'Eco Champion', icon: 'leaf', color: '#10B981' },
  { id: 'earth', label: 'Earth Guardian', icon: 'earth', color: '#0EA5E9' },
  { id: 'recycle', label: 'Super Recycler', icon: 'recycle-variant', color: '#059669' },
  { id: 'star', label: 'Eco Star', icon: 'star-shooting', color: '#EAB308' },
];

const DashboardScreen = ({ route }) => {
  const [localUser, setLocalUser] = useState(null);
  const [localHistory, setLocalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(1000);
  const [lastBackup, setLastBackup] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('all');

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAvatar, setEditAvatar] = useState('male');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Corporate Workplace & Employee ID State
  const [showCorporateModal, setShowCorporateModal] = useState(false);
  const [corpCompanyCode, setCorpCompanyCode] = useState('');
  const [corpEmployeeId, setCorpEmployeeId] = useState('');
  const [corpDepartment, setCorpDepartment] = useState('');
  const [corpLoading, setCorpLoading] = useState(false);
  const [corpErrorMsg, setCorpErrorMsg] = useState('');
  const [corpDepts, setCorpDepts] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState([
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah Limited', code: 'ALFALAH', domain: 'bankalfalah.com' },
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', code: 'ENGRO', domain: 'engro.com' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', code: 'UCP', domain: 'ucp.edu.pk' },
    { org_id: 'ORG_METRO', name: 'Metro Cash & Carry', code: 'METRO', domain: 'metro.pk' }
  ]);

  const fetchCorporateOrgs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/corporate/organizations`, { timeout: 8000 });
      if (res.data?.success && Array.isArray(res.data.organizations) && res.data.organizations.length > 0) {
        setAvailableOrgs(res.data.organizations.map(o => ({
          org_id: o.org_id,
          name: o.name,
          code: o.company_code || o.org_id.replace('ORG_', ''),
          domain: o.domain
        })));
      }
    } catch (e) {
      console.log('Fetch corporate orgs note:', e.message);
    }
  }, []);

  const fetchOrgDepartments = async (orgIdOrCode) => {
    if (!orgIdOrCode) return;
    setLoadingDepts(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/corporate/departments/${orgIdOrCode}`, { timeout: 8000 });
      if (res.data?.success && Array.isArray(res.data.departments)) {
        setCorpDepts(res.data.departments);
      }
    } catch (e) {
      console.log('Fetch org departments note:', e.message);
    } finally {
      setLoadingDepts(false);
    }
  };

  const selectPartnerOrg = (org) => {
    const code = org.code || org.org_id.replace('ORG_', '');
    setCorpCompanyCode(code);
    setCorpDepartment('');
    setCorpErrorMsg('');
    fetchOrgDepartments(org.org_id);
  };

  useEffect(() => {
    fetchCorporateOrgs();
  }, [fetchCorporateOrgs]);
  
  const navigation = useNavigation();
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLastBackup = async () => {
      try {
        const backupTime = await AsyncStorage.getItem('lastBackupDate');
        if (backupTime) setLastBackup(backupTime);
      } catch (e) {
        console.error('Error fetching last backup time:', e);
      }
    };
    fetchLastBackup();
  }, []);

  // Real-time Heartbeat for Dashboard Live Status
  useEffect(() => {
    let heartbeatInterval = null;
    const sendHeartbeat = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u?.id || u?.mobile || u?.username) {
            axios.post(`${API_BASE_URL}/mobile/heartbeat`, {
              userId: u.id,
              mobile: u.mobile,
              username: u.username
            }).catch(() => {});
          }
        }
      } catch (e) {}
    };

    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 30000);
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, []);

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const user = await getData('user');
      const history = await getData('recycleHistory');

      const backupPayload = {
        timestamp: new Date().toISOString(),
        user: user || localUser,
        recycleHistory: history || localHistory,
      };

      const formattedDate = new Date().toLocaleString();
      await AsyncStorage.setItem('lastBackupData', JSON.stringify(backupPayload));
      await AsyncStorage.setItem('lastBackupDate', formattedDate);
      setLastBackup(formattedDate);

      if (user?.mobile) {
        try {
          await fetch(`${API_BASE_URL}/backup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backupPayload),
          });
        } catch (netErr) {
          console.log('Server backup sync note:', netErr.message);
        }
      }

      ToastAndroid.show(`Backup created successfully! (${formattedDate})`, ToastAndroid.LONG);
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Backup Failed', 'Could not complete data backup. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setBackupLoading(true);
      ToastAndroid.show('Fetching Full Database Backup...', ToastAndroid.SHORT);

      let backupPayload;
      try {
        const response = await fetch(`${API_BASE_URL}/backup-full`);
        if (response.ok) {
          backupPayload = await response.json();
        }
      } catch (err) {
        console.log('Remote full DB backup fetch note:', err.message);
      }

      if (!backupPayload) {
        const user = await getData('user');
        const history = await getData('recycleHistory');
        backupPayload = {
          appName: 'ISP RVM Ecosystem',
          exportDate: new Date().toISOString(),
          user: user || localUser,
          recycleHistory: history || localHistory,
        };
      }

      const jsonString = JSON.stringify(backupPayload, null, 2);

      const result = await Share.share({
        title: 'ISP RVM Full DB Backup JSON',
        message: jsonString,
      });

      if (result.action === Share.sharedAction) {
        ToastAndroid.show('Full DB Backup exported successfully!', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export full database backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const getData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data:', e);
      return null;
    }
  };

  const storeData = async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error storing data:', e);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user, hasRecycleHistory } = route.params || {};
        
        if (user || hasRecycleHistory) {
          if (user) await storeData('user', user);
          if (hasRecycleHistory) await storeData('recycleHistory', hasRecycleHistory);
          
          setLocalUser(user || null);
          setLocalHistory(hasRecycleHistory || null);
        } else {
          const [userData, historyData, isLogged] = await Promise.all([
            getData('user'),
            getData('recycleHistory'),
            AsyncStorage.getItem('isLoggedIn')
          ]);
          
          if (isLogged !== 'true' || !userData) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
            return;
          }

          setLocalUser(userData);
          setLocalHistory(historyData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [route.params, navigation]);

  useEffect(() => {
    if (localHistory && localHistory.points) {
      if (localHistory.points >= rewardPoints) {
        setRewardPoints(prev => prev + 1000);
      }
    }
  }, [localHistory, rewardPoints]);

  const startRotateAnimation = useCallback(() => {
    rotateValue.setValue(0);
    Animated.timing(rotateValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const fetchPoints = useCallback(async ({ silent } = {}) => {
    const user = await getData('user');
    if (!user?.mobile && !user?.username && !user?.id) {
      if (!silent) ToastAndroid.show("No user details found!", ToastAndroid.SHORT);
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/get-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        phoneNumber: user.mobile || user.username || user.id,
        userId: user.id
      }),
    });

    const data = await response.json();
    if (!data || data.success === false) return false;

    await storeData("recycleHistory", data);
    setLocalHistory(data);
    if (data.points !== undefined) {
      const updatedUser = { ...(user || {}), points: data.points };
      await storeData("user", updatedUser);
      setLocalUser(updatedUser);
    }
    return true;
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      startRotateAnimation();

      const ok = await fetchPoints();
      ToastAndroid.show(
        ok ? "Refreshed Successfully!" : "Failed to refresh data",
        ToastAndroid.SHORT
      );
    } catch (error) {
      console.error("Refresh Error:", error);
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPoints, startRotateAnimation]);

  useEffect(() => {
    const sync = () => { fetchPoints({ silent: true }).catch(() => {}); };
    sync();
    const unsubscribe = navigation.addListener('focus', sync);
    return unsubscribe;
  }, [navigation, fetchPoints]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['isLoggedIn', 'user', 'recycleHistory', 'token', 'lastBackupDate', 'lastBackupData']);
              setLocalUser(null);
              setLocalHistory(null);
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleLinkCorporateAccount = async () => {
    const cleanCode = corpCompanyCode.trim();
    if (!cleanCode) {
      setCorpErrorMsg('Please select a partner company or enter a Company Code.');
      Alert.alert('Company Code Required', 'Please enter your Company Code (e.g., ALFALAH, ENGRO, UCP, METRO) or tap a partner button.');
      return;
    }

    const cleanEmpId = corpEmployeeId.trim();
    if (!cleanEmpId) {
      setCorpErrorMsg('Official Staff ID is strictly required to verify against the employee roster.');
      Alert.alert('Staff ID Required', 'Please enter your official Company Staff / Employee ID to verify your corporate membership.');
      return;
    }

    const userId = localUser?.id || localUser?.userId || localUser?.email || localUser?.mobile || localUser?.username;
    if (!userId) {
      Alert.alert('Session Required', 'Please log in again to link your corporate account.');
      return;
    }

    setCorpLoading(true);
    setCorpErrorMsg('');
    try {
      const res = await axios.post(`${API_BASE_URL}/user/link-corporate`, {
        userId,
        companyCode: cleanCode,
        employeeId: cleanEmpId,
        department: corpDepartment.trim()
      }, { timeout: 12000 });

      if (res.data?.success && res.data?.user) {
        const mergedUser = {
          ...localUser,
          ...res.data.user,
          userType: 'ENTERPRISE',
          orgId: res.data.user.orgId,
          orgName: res.data.user.orgName,
          department: res.data.user.department,
          employeeId: res.data.user.employeeId
        };
        setLocalUser(mergedUser);
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
        setShowCorporateModal(false);
        setCorpCompanyCode('');
        setCorpEmployeeId('');
        setCorpDepartment('');
        setCorpErrorMsg('');
        if (Platform.OS === 'android') {
          ToastAndroid.show(`🎉 Verified! Linked to ${res.data.user.orgName}`, ToastAndroid.LONG);
        } else {
          Alert.alert('Corporate Verified', res.data.message || 'Corporate account linked successfully!');
        }
      } else {
        const msg = res.data?.message || 'Could not verify company code.';
        setCorpErrorMsg(msg);
        Alert.alert('Corporate Link Notice', msg);
      }
    } catch (err) {
      console.warn('Link corporate error:', err);
      const msg = err.response?.data?.message || err.message || 'Could not verify corporate account.';
      setCorpErrorMsg(msg);
      Alert.alert('Verification Rejected', msg);
    } finally {
      setCorpLoading(false);
    }
  };

  const handleUnlinkCorporateAccount = async () => {
    Alert.alert(
      'Unlink Corporate Account',
      'Are you sure you want to disconnect your corporate membership and return to standard Citizen status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            const userId = localUser?.id || localUser?.userId || localUser?.email || localUser?.mobile || localUser?.username;
            setCorpLoading(true);
            try {
              const res = await axios.post(`${API_BASE_URL}/user/unlink-corporate`, { userId });
              if (res.data?.success) {
                const mergedUser = {
                  ...localUser,
                  userType: 'CITIZEN',
                  orgId: null,
                  orgName: null,
                  department: null,
                  employeeId: null,
                  organization: null
                };
                setLocalUser(mergedUser);
                await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
                setShowCorporateModal(false);
                if (Platform.OS === 'android') {
                  ToastAndroid.show('Switched to Citizen account', ToastAndroid.SHORT);
                }
              }
            } catch (err) {
              Alert.alert('Notice', err.response?.data?.message || err.message);
            } finally {
              setCorpLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      ToastAndroid.show("Please enter your full name", ToastAndroid.SHORT);
      return;
    }
    setSavingProfile(true);

    const updatedLocalFields = {
      fullName: editFullName.trim(),
      dob: editDob.trim(),
      profileImage: editAvatar,
      email: editEmail.trim(),
      isBirthday: (() => {
        if (!editDob.trim()) return false;
        try {
          const d = new Date(editDob.trim());
          const t = new Date();
          return d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
        } catch(e) { return false; }
      })()
    };

    try {
      const payload = {
        userId: localUser?.id || localUser?.userId || localUser?.username,
        username: localUser?.username,
        mobile: localUser?.mobile,
        ...updatedLocalFields
      };

      const response = await axios.post(`${API_BASE_URL}/user/profile`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });

      const serverUser = response.data?.user || {};
      const mergedUser = { ...localUser, ...updatedLocalFields, ...serverUser };
      await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
      setLocalUser(mergedUser);
      setShowEditModal(false);
      ToastAndroid.show("Profile updated successfully! 🎉", ToastAndroid.SHORT);
    } catch (err) {
      console.warn('Update profile server note:', err.message);
      // Graceful offline save so user is never stuck searching or frozen
      const fallbackUser = { ...localUser, ...updatedLocalFields };
      await AsyncStorage.setItem('user', JSON.stringify(fallbackUser));
      setLocalUser(fallbackUser);
      setShowEditModal(false);
      ToastAndroid.show("Profile saved successfully! 🎉", ToastAndroid.SHORT);
    } finally {
      setSavingProfile(false);
    }
  };

  const isBirthday = localUser?.isBirthday || (() => {
    if (!localUser?.dob) return false;
    try {
      const d = new Date(localUser.dob);
      const t = new Date();
      return d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    } catch(e) { return false; }
  })();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#0EA5E9', fontWeight: 'bold' }}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculated recovery and variant stats
  const currentBalance = parseInt(localHistory?.currentBalance ?? localHistory?.points ?? localUser?.points ?? 0);
  const totalRedeemed = parseInt(localHistory?.totalRedeemedPoints ?? localHistory?.redeemedPoints ?? 0);
  const totalEarned = parseInt(localHistory?.totalEarnedPoints ?? localHistory?.earnedPoints ?? (currentBalance + totalRedeemed));

  const isEnterprise = localUser?.userType === 'ENTERPRISE' || Boolean(localUser?.orgId);
  const orgName = localUser?.orgName || (localUser?.orgId ? String(localUser.orgId).replace('ORG_', '').replace('_', ' ') : 'Corporate Partner');
  const employeeId = localUser?.employeeId || '';
  const department = localUser?.department || '';
  const cashEquivalentPkr = Math.floor(currentBalance * 0.10);

  const plasticCount = parseInt(localHistory?.plasticCount || localHistory?.bottles || 0);
  const aluminiumCount = parseInt(localHistory?.aluminiumCount || localHistory?.cups || 0);
  const paperCount = parseInt(localHistory?.paperCount || localHistory?.paper || 0);
  const totalItemsCount = parseInt(localHistory?.totalItems || (plasticCount + aluminiumCount + paperCount) || 0);
  
  const totalWeightKg = localHistory?.totalWeightKg !== undefined
    ? localHistory.totalWeightKg 
    : (plasticCount * 0.025 + aluminiumCount * 0.015 + paperCount * 0.03).toFixed(2);
    
  const co2AvoidedKg = localHistory?.co2AvoidedKg !== undefined
    ? localHistory.co2AvoidedKg 
    : (plasticCount * 0.08 + aluminiumCount * 0.15 + paperCount * 0.05).toFixed(2);

  const paperWeightDisplay = paperCount > 0 
    ? (paperCount >= 1000 ? `${(paperCount / 1000).toFixed(2)} kg` : `${paperCount} g`) 
    : (totalWeightKg > 0 ? `${(totalWeightKg * 0.35).toFixed(2)} kg` : '0 g');

  const recentSessions = localHistory?.recentSessions || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Birthday Celebratory Banner */}
        {isBirthday && (
          <View style={styles.birthdayCard}>
            <MaterialCommunityIcons name="cake-variant" size={32} color="#D97706" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.birthdayTitle}>🎂 Happy Birthday, {localUser?.fullName || localUser?.username}! 🎉</Text>
              <Text style={styles.birthdaySubtitle}>Wishing you a glorious birthday filled with joy and eco-blessings!</Text>
            </View>
          </View>
        )}

        {/* Main Header / Statistics Card */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={22} 
              color="#EF4444" 
            />
          </TouchableOpacity>
          
          {/* Top Brand & Persona Banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingRight: 40 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="recycle" size={22} color="#059669" style={{ marginRight: 6 }} />
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Trash to Cash</Text>
              </View>
              <Text style={styles.cardHeaderSubtitle}>
                {isEnterprise ? 'Corporate Campus Kiosk Portal' : 'Smart Reverse Vending Network'}
              </Text>
            </View>
            <View style={isEnterprise ? styles.enterpriseBadgePill : styles.citizenBadgePill}>
              <MaterialCommunityIcons 
                name={isEnterprise ? "office-building" : "account-check"} 
                size={13} 
                color={isEnterprise ? "#0284C7" : "#059669"} 
                style={{ marginRight: 4 }} 
              />
              <Text style={isEnterprise ? styles.enterpriseBadgeText : styles.citizenBadgeText}>
                {isEnterprise ? 'ENTERPRISE' : 'CITIZEN'}
              </Text>
            </View>
          </View>

          {/* Corporate Affiliation / Workplace Link Card */}
          {isEnterprise ? (
            <TouchableOpacity 
              style={styles.corporateBanner} 
              onPress={() => setShowCorporateModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.corporateLogoBox}>
                <MaterialCommunityIcons name="domain" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.corporateOrgName} numberOfLines={1}>{orgName}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#0284C7" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.corporateMetaText}>
                  {employeeId ? `Staff ID: ${employeeId}` : 'Campus Member'}{department ? ` • ${department}` : ''}
                </Text>
              </View>
              <View style={styles.corporateKioskTag}>
                <MaterialCommunityIcons name="laptop" size={12} color="#0284C7" style={{ marginRight: 3 }} />
                <Text style={styles.corporateKioskTagText}>PecoDrop</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.corporateLinkBanner}
              onPress={() => {
                setCorpCompanyCode('');
                setCorpEmployeeId('');
                setCorpDepartment('');
                setShowCorporateModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.corporateLinkIconBox}>
                <MaterialCommunityIcons name="office-building-cog" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.corporateLinkTitle}>Corporate Workplace Membership</Text>
                  <View style={styles.corporateNewPill}>
                    <Text style={styles.corporateNewPillText}>LINK</Text>
                  </View>
                </View>
                <Text style={styles.corporateLinkSubtitle} numberOfLines={1}>
                  Enter Company Code & Staff ID for PecoDrop perks
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#0284C7" />
            </TouchableOpacity>
          )}

          {/* User Information Section with Avatar and Edit Option */}
          <View style={styles.userInfoContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity 
                style={styles.userNameContainer}
                onPress={() => {
                  setEditFullName(localUser?.fullName || localUser?.username || '');
                  setEditDob(localUser?.dob || '');
                  setEditAvatar(localUser?.profileImage || 'male');
                  setEditEmail(localUser?.email || '');
                  setShowEditModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons 
                    name={
                      localUser?.profileImage === 'female' ? 'account-heart' :
                      localUser?.profileImage === 'leaf' ? 'leaf' :
                      localUser?.profileImage === 'earth' ? 'earth' :
                      localUser?.profileImage === 'recycle' ? 'recycle-variant' :
                      localUser?.profileImage === 'star' ? 'star-shooting' :
                      'account-circle'
                    } 
                    size={26} 
                    color="#0284C7" 
                  />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName}>
                      {localUser?.fullName || localUser?.username || "Welcome User"}
                    </Text>
                    <MaterialCommunityIcons name="pencil-circle" size={16} color="#0284C7" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.userHandle}>@{localUser?.username || 'user'}{localUser?.dob ? ` • DOB: ${localUser.dob}` : ''}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleRefresh}
                accessibilityLabel="Refresh points"
                disabled={refreshing}
                style={styles.refreshIconBtn}
              >
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <MaterialCommunityIcons 
                    name="refresh" 
                    size={20} 
                    color={refreshing ? "#94A3B8" : "#0284C7"} 
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Synchronized 3-Column Points Breakdown Panel */}
            <View style={styles.pointsBreakdownPanel}>
              {/* 1. Current Balance */}
              <View style={[styles.pointsStatBox, styles.pointsStatBoxPrimary]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <MaterialCommunityIcons name="wallet" size={15} color="#0284C7" style={{ marginRight: 3 }} />
                  <Text style={styles.pointsStatLabel}>Balance</Text>
                </View>
                <Text style={[styles.pointsStatNumber, { color: '#0284C7' }]}>{currentBalance.toLocaleString()}</Text>
                <Text style={styles.pointsStatUnit}>Available pts</Text>
                <Text style={styles.cashConversionUnit}>≈ Rs {cashEquivalentPkr}</Text>
              </View>

              {/* 2. Total Lifetime Earned */}
              <View style={[styles.pointsStatBox, styles.pointsStatBoxSuccess]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <MaterialCommunityIcons name="star-circle" size={15} color="#059669" style={{ marginRight: 3 }} />
                  <Text style={styles.pointsStatLabel}>Earned</Text>
                </View>
                <Text style={[styles.pointsStatNumber, { color: '#059669' }]}>{totalEarned.toLocaleString()}</Text>
                <Text style={styles.pointsStatUnit}>Lifetime pts</Text>
                <Text style={[styles.cashConversionUnit, { color: '#059669' }]}>≈ Rs {Math.floor(totalEarned * 0.10)}</Text>
              </View>

              {/* 3. Total Redeemed */}
              <View style={[styles.pointsStatBox, styles.pointsStatBoxWarning]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <MaterialCommunityIcons name="ticket-percent" size={15} color="#D97706" style={{ marginRight: 3 }} />
                  <Text style={styles.pointsStatLabel}>Redeemed</Text>
                </View>
                <Text style={[styles.pointsStatNumber, { color: '#D97706' }]}>{totalRedeemed.toLocaleString()}</Text>
                <Text style={styles.pointsStatUnit}>Used pts</Text>
                <Text style={[styles.cashConversionUnit, { color: '#D97706' }]}>≈ Rs {Math.floor(totalRedeemed * 0.10)}</Text>
              </View>
            </View>

            {/* Quick Action Navigation Bar */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity 
                style={[styles.quickActionBtn, styles.quickActionBtnPrimary]}
                onPress={() => navigation.navigate('QrCode')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.quickActionBtnTextPrimary}>Scan Kiosk</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickActionBtn, styles.quickActionBtnSuccess]}
                onPress={() => navigation.navigate('Rewards')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="cash-multiple" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.quickActionBtnTextSuccess}>
                  {isEnterprise ? 'Perks & CSR' : 'Cashout (PKR)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickActionBtn, styles.quickActionBtnDefault]}
                onPress={() => navigation.navigate('location')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="map-marker-radius" size={16} color="#0284C7" style={{ marginRight: 4 }} />
                <Text style={styles.quickActionBtnTextDefault}>Find Kiosks</Text>
              </TouchableOpacity>
            </View>

            {/* Milestone Goal Tracker */}
            <View style={styles.milestoneGoalRow}>
              <MaterialCommunityIcons name="trophy-outline" size={15} color="#CA8A04" style={{ marginRight: 6 }} />
              <Text style={styles.milestoneGoalText}>
                Next Reward Tier Goal: <Text style={{ fontWeight: '700', color: '#854D0E' }}>{currentBalance} / {rewardPoints} pts</Text>
              </Text>
            </View>
          </View>

          {/* Quick Eco-Impact Metrics */}
          <View style={styles.impactMetricsGrid}>
            <View style={styles.impactMetricItem}>
              <MaterialCommunityIcons name="recycle" size={22} color="#10B981" />
              <Text style={styles.impactValue}>{totalItemsCount}</Text>
              <Text style={styles.impactLabel}>{isEnterprise ? 'PecoDrop Items' : 'Items Recycled'}</Text>
            </View>
            <View style={styles.impactMetricItem}>
              <MaterialCommunityIcons name="scale" size={22} color="#0EA5E9" />
              <Text style={styles.impactValue}>{totalWeightKg} kg</Text>
              <Text style={styles.impactLabel}>Diverted Weight</Text>
            </View>
            <View style={styles.impactMetricItem}>
              <MaterialCommunityIcons name="leaf" size={22} color="#16A34A" />
              <Text style={styles.impactValue}>{co2AvoidedKg} kg</Text>
              <Text style={styles.impactLabel}>CO₂ Avoided</Text>
            </View>
          </View>
        </View>

        {/* Recovered Items & Material Streams Section */}
        <View style={styles.variantsCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons 
                name={isEnterprise ? "cube-outline" : "shape-outline"} 
                size={22} 
                color={isEnterprise ? "#0284C7" : "#059669"} 
                style={{ marginRight: 6 }} 
              />
              <Text style={styles.sectionTitle}>
                {isEnterprise ? 'PecoDrop Intake Apertures' : 'Accepted Recyclables Breakdown'}
              </Text>
            </View>
            <View style={isEnterprise ? styles.totalBadgeEnterprise : styles.totalBadge}>
              <Text style={isEnterprise ? styles.totalBadgeTextEnterprise : styles.totalBadgeText}>
                {totalItemsCount} Total
              </Text>
            </View>
          </View>

          <Text style={styles.variantsSubtitle}>
            {isEnterprise 
              ? 'Illuminated 3-aperture corporate campus streams on your PecoDrop unit:'
              : 'Real-time items deposited into public Smart RVM kiosks:'}
          </Text>

          {/* 4 Cards Grid - Dually Adaptive for Enterprise vs Citizen */}
          <View style={styles.variantGrid}>
            
            {isEnterprise ? (
              <>
                {/* 1. ⭕ PecoDrop Circle Aperture (Plastic) */}
                <View style={[styles.variantCard, styles.pecoCircleCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#FCE7F3' }]}>
                      <MaterialCommunityIcons name="circle-outline" size={24} color="#E11D48" />
                    </View>
                    <Text style={[styles.variantCountNumber, { color: '#E11D48' }]}>{plasticCount}</Text>
                  </View>
                  <Text style={styles.variantTitle}>⭕ Circle: Plastic</Text>
                  <Text style={styles.variantSpecs}>PET Beverage Bottles</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>250ml - 500ml</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>1.0L - 1.5L</Text>
                    </View>
                  </View>
                </View>

                {/* 2. 🔺 PecoDrop Triangle Aperture (Cans) */}
                <View style={[styles.variantCard, styles.pecoTriangleCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#ECFDF5' }]}>
                      <MaterialCommunityIcons name="triangle-outline" size={24} color="#059669" />
                    </View>
                    <Text style={[styles.variantCountNumber, { color: '#059669' }]}>{aluminiumCount}</Text>
                  </View>
                  <Text style={styles.variantTitle}>🔺 Triangle: Cans</Text>
                  <Text style={styles.variantSpecs}>Aluminium & Metal Cans</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>250ml Sleek</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>330ml Std</Text>
                    </View>
                  </View>
                </View>

                {/* 3. 🟦 PecoDrop Square Aperture (Office Paper - Weighed) */}
                <View style={[styles.variantCard, styles.pecoSquareCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#E0F2FE' }]}>
                      <MaterialCommunityIcons name="square-outline" size={24} color="#0284C7" />
                    </View>
                    <Text style={[styles.variantCountNumber, { color: '#0284C7', fontSize: 18 }]}>
                      {paperWeightDisplay}
                    </Text>
                  </View>
                  <Text style={styles.variantTitle}>🟦 Square: Paper</Text>
                  <Text style={styles.variantSpecs}>HX711 Load Cell Weighed</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>Office A4</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>Shreds / Grams</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Corporate ESG & Campus CSR Score */}
                <View style={[styles.variantCard, styles.pecoEsgCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#F5F3FF' }]}>
                      <MaterialCommunityIcons name="shield-check" size={24} color="#7C3AED" />
                    </View>
                    <Text style={[styles.variantCountNumber, { color: '#7C3AED', fontSize: 18 }]}>
                      {co2AvoidedKg} kg
                    </Text>
                  </View>
                  <Text style={styles.variantTitle}>🏢 Campus CSR</Text>
                  <Text style={styles.variantSpecs}>Zero-Waste Goal Progress</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>ESG Verified</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>🌳 {Math.max(1, Math.round(totalItemsCount / 12))} Trees</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* 1. PET Plastic Bottles (Citizen RVM) */}
                <View style={[styles.variantCard, styles.petCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#E0F2FE' }]}>
                      <MaterialCommunityIcons name="bottle-soda-classic" size={24} color="#0284C7" />
                    </View>
                    <Text style={styles.variantCountNumber}>{plasticCount}</Text>
                  </View>
                  <Text style={styles.variantTitle}>PET Bottles</Text>
                  <Text style={styles.variantSpecs}>Clear & Colored Plastic</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>250ml - 500ml</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>1.0L - 1.5L</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Aluminium Cans (Citizen RVM) */}
                <View style={[styles.variantCard, styles.canCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#CCFBF1' }]}>
                      <MaterialCommunityIcons name="cup-water" size={24} color="#0D9488" />
                    </View>
                    <Text style={styles.variantCountNumber}>{aluminiumCount}</Text>
                  </View>
                  <Text style={styles.variantTitle}>Aluminium Cans</Text>
                  <Text style={styles.variantSpecs}>Soda & Beverage Cans</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>250ml Sleek</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>330ml Std</Text>
                    </View>
                  </View>
                </View>

                {/* 3. UBC Tetra Pak Cartons (Citizen RVM) */}
                <View style={[styles.variantCard, styles.paperCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#EEF2FF' }]}>
                      <MaterialCommunityIcons name="package-variant-closed" size={24} color="#4F46E5" />
                    </View>
                    <Text style={styles.variantCountNumber}>{paperCount}</Text>
                  </View>
                  <Text style={styles.variantTitle}>UBC Tetra Pak</Text>
                  <Text style={styles.variantSpecs}>Juice & Milk Cartons</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>200ml Packs</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>1.0L UBC</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Intake Quality & Zero Rejection */}
                <View style={[styles.variantCard, styles.rejectCard]}>
                  <View style={styles.variantTopRow}>
                    <View style={[styles.variantIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <MaterialCommunityIcons name="check-decagram" size={24} color="#D97706" />
                    </View>
                    <Text style={[styles.variantCountNumber, { color: '#D97706' }]}>100%</Text>
                  </View>
                  <Text style={styles.variantTitle}>Clean Intake</Text>
                  <Text style={styles.variantSpecs}>0 Rejections Recorded</Text>
                  
                  <View style={styles.variantSubtagsContainer}>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>Empty Liquid</Text>
                    </View>
                    <View style={styles.variantTag}>
                      <Text style={styles.variantTagText}>Intact Barcode</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

          </View>

          {/* Last Recycling Timestamp & Point details */}
          <View style={styles.sessionMetaCard}>
            <MaterialCommunityIcons name="clock-check-outline" size={18} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.sessionMetaText}>
              Last recycled on: {localHistory?.recycledAt ? new Date(localHistory.recycledAt).toLocaleString() : 'Never'}
            </Text>
          </View>
        </View>


        {/* Recent Recycling Activity Log */}
        {recentSessions.length > 0 && (
          <View style={styles.activityCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="history" size={22} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Recent Recovery Activity</Text>
              </View>
            </View>

            {recentSessions.map((session, idx) => {
              const pCount = parseInt(session.plastic_count || session.bottles || 0);
              const aCount = parseInt(session.aluminium_count || session.cups || 0);
              const gCount = parseInt(session.glass_count || 0);
              const cardCount = parseInt(session.paper_cardboard_count || 0);
              const points = session.points_earned || session.points || (pCount * 10 + aCount * 15);
              const machine = session.machine_id || session.machineId || 'RVM Station';
              const dateStr = session.created_at || session.recycledAt || session.timestamp;

              return (
                <View key={session.session_id || idx} style={styles.activityItem}>
                  <View style={styles.activityIconCircle}>
                    <MaterialCommunityIcons 
                      name={pCount > 0 ? "bottle-soda-classic" : aCount > 0 ? "cup-water" : cardCount > 0 ? "coffee" : "recycle"} 
                      size={20} 
                      color="#0284C7" 
                    />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>
                      {pCount > 0 && `${pCount}x PET `}
                      {aCount > 0 && `${aCount}x Can `}
                      {gCount > 0 && `${gCount}x Glass `}
                      {cardCount > 0 && `${cardCount}x Cup/Carton `}
                      {session.item_variant ? `(${session.item_variant})` : ''}
                    </Text>
                    <Text style={styles.activitySubtext}>
                      {machine} • {dateStr ? new Date(dateStr).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  <View style={styles.activityPointsBadge}>
                    <Text style={styles.activityPointsText}>+{points} pts</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Get Rewards Card */}
        <TouchableOpacity 
          style={[styles.card, styles.getRewardsCard]}
          onPress={() => navigation.navigate('QrCode')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>Get Rewards</Text>
          <View style={styles.rewardsContainer}>
            <View style={styles.rewardsLeft}>
              <Text style={styles.rewardsText}>Deposit your bottles & cans</Text>
              <Text style={styles.rewardsText}>in our smart RVM machines</Text>
              <Text style={styles.rewardsText}>to earn points instantly!</Text>
            </View>
            <View style={styles.rewardsRight}>
              <Image source={RewardImage} style={styles.rewardImage} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Spend Rewards Card */}
        <TouchableOpacity 
          style={[styles.card, styles.spendRewardsCard]}
          onPress={() => navigation.navigate('Promotions')}
          activeOpacity={0.8}
        >
          <Text style={[styles.cardTitle, { color: '#059669' }]}>Spend Rewards</Text>
          <View style={styles.spendContainer}>
            <View style={styles.spendLeft}>
              <Text style={styles.availableCoins}>Available Points Balance</Text>
              <Text style={styles.coinsCount}>{localHistory?.points || 0}</Text>
              <Text style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                Redeem for vouchers & discounts
              </Text>
            </View>
            <View style={styles.spendRight}>
              <Image source={SpendImage} style={styles.spendImage} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Scrap Bazar Card */}
        <View style={[styles.card, styles.scrapBazarCard]}>
          <Text style={[styles.cardTitle, { color: '#D97706' }]}>Scrap Bazar</Text>
          <View style={styles.scrapContainer}>
            <View style={styles.scrapLeft}>
              <Text style={styles.availableCoins}>Direct Material Trade</Text>
              <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600' }}>Coming Soon</Text>
            </View>
            <View style={styles.scrapRight}>
              <Image source={ShopImage} style={styles.shopImage} />
            </View>
          </View>
        </View>

        {/* Data Backup & Cloud Sync Card (VISIBLE ONLY FOR SUPER ADMIN) */}
        {(localUser?.role === 'super_admin' || 
          localUser?.role === 'admin' || 
          localUser?.role_id === 'super_admin' || 
          localUser?.role_id === 'admin' || 
          localUser?.isSuperAdmin === true ||
          localUser?.username?.toLowerCase() === 'superadmin' ||
          localUser?.username?.toLowerCase() === 'admin' ||
          localUser?.username?.toLowerCase() === 'onenet') && (
          <View style={[styles.card, styles.backupCard]}>
            <View style={styles.backupHeader}>
              <MaterialCommunityIcons name="shield-crown" size={24} color="#0284C7" />
              <Text style={styles.cardTitle}>Admin Backup & Cloud Sync</Text>
            </View>
            
            <Text style={styles.backupSubtext}>
              {lastBackup ? `Last Backup: ${lastBackup}` : 'Super Admin data persistence & backup tools.'}
            </Text>

            <View style={styles.backupActionsRow}>
              <TouchableOpacity
                style={[styles.backupButton, styles.backupButtonPrimary]}
                onPress={handleBackup}
                disabled={backupLoading}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="sync" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.backupButtonText}>
                  {backupLoading ? 'Backing Up...' : 'Backup Now'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.backupButton, styles.exportButton]}
                onPress={handleExportJson}
                disabled={backupLoading}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="file-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.backupButtonText}>Export JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Eco Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar Chooser */}
              <Text style={styles.modalLabel}>Select Profile Avatar</Text>
              <View style={styles.modalAvatarGrid}>
                {PRESET_AVATARS.map((av) => (
                  <TouchableOpacity
                    key={av.id}
                    style={[
                      styles.modalAvatarItem,
                      editAvatar === av.id && styles.modalAvatarItemSelected
                    ]}
                    onPress={() => setEditAvatar(av.id)}
                  >
                    <MaterialCommunityIcons 
                      name={
                        av.id === 'female' ? 'account-heart' :
                        av.id === 'leaf' ? 'leaf' :
                        av.id === 'earth' ? 'earth' :
                        av.id === 'recycle' ? 'recycle-variant' :
                        av.id === 'star' ? 'star-shooting' :
                        'account-circle'
                      } 
                      size={24} 
                      color={editAvatar === av.id ? '#0284C7' : '#64748B'} 
                    />
                    <Text style={[styles.modalAvatarText, editAvatar === av.id && { color: '#0284C7', fontWeight: 'bold' }]}>
                      {av.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Full Name */}
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Full Name"
                placeholderTextColor="#94A3B8"
                value={editFullName}
                onChangeText={setEditFullName}
              />

              {/* Date of Birth */}
              <Text style={styles.modalLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 1998-08-24"
                placeholderTextColor="#94A3B8"
                value={editDob}
                onChangeText={setEditDob}
                maxLength={10}
              />

              {/* Email */}
              <Text style={styles.modalLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Email"
                placeholderTextColor="#94A3B8"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Action Buttons */}
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowEditModal(false)}
                  disabled={savingProfile}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Corporate Workplace & Employee ID Verification Modal */}
      <Modal
        visible={showCorporateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCorporateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.corporateLogoBox, { width: 34, height: 34, marginRight: 8 }]}>
                  <MaterialCommunityIcons name="domain" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Corporate Membership</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>PecoDrop Campus Recycling</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCorporateModal(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isEnterprise ? (
                /* Already Verified Enterprise Member View */
                <View>
                  <View style={styles.corpVerifiedBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#065F46' }}>
                        Verified Corporate Account
                      </Text>
                    </View>

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Organization:</Text>
                      <Text style={styles.corpVerifiedVal}>{orgName}</Text>
                    </View>

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Staff ID:</Text>
                      <Text style={styles.corpVerifiedVal}>{employeeId || 'Active Member'}</Text>
                    </View>

                    {department ? (
                      <View style={styles.corpVerifiedRow}>
                        <Text style={styles.corpVerifiedLabel}>Department:</Text>
                        <Text style={styles.corpVerifiedVal}>{department}</Text>
                      </View>
                    ) : null}

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Kiosk Access:</Text>
                      <Text style={[styles.corpVerifiedVal, { color: '#0284C7' }]}>
                        PecoDrop (⭕ Plastic, 🔺 Cans, 🟦 Paper)
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 16 }}>
                    Your recycling contributions are synchronized with {orgName}'s corporate ESG dashboard and cafeteria discount perks.
                  </Text>

                  <TouchableOpacity
                    style={styles.corpUnlinkBtn}
                    onPress={handleUnlinkCorporateAccount}
                    disabled={corpLoading}
                  >
                    {corpLoading ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="link-off" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={styles.corpUnlinkText}>Disconnect Corporate Workplace</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Citizen Linking View */
                <View>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 }}>
                    Working at a registered corporate campus? Enter your company code and employee ID to unlock exclusive cafeteria perks and PecoDrop smart kiosks.
                  </Text>

                  {/* Error Notification Alert */}
                  {Boolean(corpErrorMsg) && (
                    <View style={styles.corpAlertError}>
                      <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.corpAlertErrorText}>{corpErrorMsg}</Text>
                    </View>
                  )}

                  {/* Partner Quick-Select Chips */}
                  <Text style={styles.modalLabel}>Select Partner Company:</Text>
                  <View style={styles.corpChipGrid}>
                    {availableOrgs.map(org => {
                      const isSelected = corpCompanyCode.toUpperCase() === (org.code || '').toUpperCase() ||
                                         corpCompanyCode.toUpperCase() === (org.org_id || '').toUpperCase();
                      return (
                        <TouchableOpacity
                          key={org.org_id || org.name}
                          style={[styles.corpChip, isSelected && styles.corpChipSelected]}
                          onPress={() => selectPartnerOrg(org)}
                        >
                          <MaterialCommunityIcons 
                            name="domain" 
                            size={14} 
                            color={isSelected ? "#0284C7" : "#64748B"} 
                            style={{ marginRight: 4 }} 
                          />
                          <Text style={[styles.corpChipText, isSelected && styles.corpChipTextSelected]}>
                            {org.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Company Code Input */}
                  <Text style={styles.modalLabel}>Company Code or Corporate Domain *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. ALFALAH, ENGRO, UCP, METRO"
                    placeholderTextColor="#94A3B8"
                    value={corpCompanyCode}
                    onChangeText={(val) => {
                      setCorpCompanyCode(val);
                      setCorpErrorMsg('');
                      fetchOrgDepartments(val);
                    }}
                    autoCapitalize="characters"
                  />

                  {/* Employee ID Input */}
                  <Text style={styles.modalLabel}>Employee / Staff ID * (Required)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. BA-1001, ENG-201, UCP-501, MET-301"
                    placeholderTextColor="#94A3B8"
                    value={corpEmployeeId}
                    onChangeText={(val) => {
                      setCorpEmployeeId(val);
                      setCorpErrorMsg('');
                    }}
                    autoCapitalize="characters"
                  />
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>
                    🔒 Staff ID is strictly verified against your company's authorized HR employee roster.
                  </Text>

                  {/* Selectable Official Department Chips */}
                  {corpDepts.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.modalLabel}>Official Departments ({corpDepts.length}):</Text>
                      <View style={styles.corpChipGrid}>
                        {corpDepts.map(d => {
                          const isDeptSelected = corpDepartment === d.name;
                          return (
                            <TouchableOpacity
                              key={d.dept_id}
                              style={[styles.corpDeptChip, isDeptSelected && styles.corpDeptChipSelected]}
                              onPress={() => setCorpDepartment(d.name)}
                            >
                              <Text style={[styles.corpDeptChipText, isDeptSelected && styles.corpDeptChipTextSelected]}>
                                {d.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Department Custom / Fallback Input */}
                  <Text style={styles.modalLabel}>Selected Department</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Choose from departments above or type official name"
                    placeholderTextColor="#94A3B8"
                    value={corpDepartment}
                    onChangeText={setCorpDepartment}
                  />

                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setShowCorporateModal(false)}
                      disabled={corpLoading}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalSaveBtn, { backgroundColor: '#0284C7' }]}
                      onPress={handleLinkCorporateAccount}
                      disabled={corpLoading}
                    >
                      {corpLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.modalSaveText}>Verify & Link</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  birthdayTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  birthdaySubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  userHandle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  modalAvatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modalAvatarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  modalAvatarItemSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    borderWidth: 1.5,
  },
  modalAvatarText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    minWidth: 100,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  enterpriseBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  enterpriseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  citizenBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  citizenBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  corporateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  corporateLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  corporateOrgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },
  corporateMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  corporateKioskTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  corporateKioskTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  userInfoContainer: {
    marginBottom: 14,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  pointsBreakdownPanel: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pointsStatBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  pointsStatBoxPrimary: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  pointsStatBoxSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pointsStatBoxWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pointsStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  pointsStatNumber: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  pointsStatUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  cashConversionUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    elevation: 1,
  },
  quickActionBtnPrimary: {
    backgroundColor: '#0284C7',
  },
  quickActionBtnSuccess: {
    backgroundColor: '#059669',
  },
  quickActionBtnDefault: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  quickActionBtnTextPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionBtnTextSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionBtnTextDefault: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  milestoneGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderColor: '#FEF08A',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  milestoneGoalText: {
    fontSize: 11,
    color: '#854D0E',
    fontWeight: '500',
  },
  impactMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  impactMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  impactLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  variantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  totalBadgeEnterprise: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeTextEnterprise: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  variantsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  variantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  variantCard: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  petCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  canCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  paperCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  rejectCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pecoCircleCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  pecoTriangleCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pecoSquareCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  pecoEsgCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  variantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantCountNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  variantTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  variantSpecs: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  variantSubtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  variantTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variantTagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  sessionMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  sessionMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activitySubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activityPointsBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activityPointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  getRewardsCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  spendRewardsCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  scrapBazarCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsLeft: {
    flex: 1,
  },
  rewardsRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
  },
  rewardImage: {
    width: 80,
    height: 90,
    resizeMode: 'contain',
  },
  spendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spendLeft: {
    flex: 1,
  },
  spendRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableCoins: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  coinsCount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#059669',
  },
  spendImage: {
    width: 90,
    height: 80,
    resizeMode: 'contain',
  },
  scrapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrapLeft: {
    flex: 1,
  },
  scrapRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopImage: {
    width: 90,
    height: 80,
    resizeMode: 'contain',
  },
  backupCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backupSubtext: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 18,
  },
  backupActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  backupButtonPrimary: {
    backgroundColor: '#0284C7',
  },
  exportButton: {
    backgroundColor: '#10B981',
  },
  backupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  corporateLinkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  corporateLinkIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  corporateLinkTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
  },
  corporateLinkSubtitle: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  corporateNewPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  corporateNewPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCorpSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCorpSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalCorpLinkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalCorpOrgText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  modalCorpMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCorpManageBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modalCorpManageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  modalCorpUnlinkedRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCorpUnlinkedText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  modalCorpLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    borderRadius: 6,
  },
  modalCorpLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  corpChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  corpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  corpChipSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  corpChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  corpChipTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  corpVerifiedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  corpVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  corpVerifiedLabel: {
    fontSize: 12,
    color: '#4B5563',
    width: 95,
  },
  corpVerifiedVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  corpUnlinkBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  corpUnlinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  corpAlertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  corpAlertErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  corpDeptChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  corpDeptChipSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  corpDeptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  corpDeptChipTextSelected: {
    color: '#047857',
    fontWeight: '700',
  },
});

export default DashboardScreen;
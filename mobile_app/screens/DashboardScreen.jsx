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

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      ToastAndroid.show("Please enter your full name", ToastAndroid.SHORT);
      return;
    }
    setSavingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localUser?.id || localUser?.username,
          fullName: editFullName.trim(),
          dob: editDob.trim(),
          profileImage: editAvatar,
          email: editEmail.trim()
        })
      });
      const data = await response.json();
      if (data.success && data.user) {
        const mergedUser = { ...localUser, ...data.user };
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
        setLocalUser(mergedUser);
        setShowEditModal(false);
        ToastAndroid.show("Profile updated successfully! 🎉", ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(data.message || "Failed to update profile", ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      ToastAndroid.show("Network error while updating profile", ToastAndroid.SHORT);
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
  const totalEarned = parseInt(localHistory?.totalEarnedPoints ?? localHistory?.earnedPoints ?? currentBalance);
  const totalRedeemed = parseInt(localHistory?.totalRedeemedPoints ?? localHistory?.redeemedPoints ?? Math.max(0, totalEarned - currentBalance));

  const plasticCount = parseInt(localHistory?.plasticCount || localHistory?.bottles || 0);
  const aluminiumCount = parseInt(localHistory?.aluminiumCount || localHistory?.cups || 0);
  const glassCount = parseInt(localHistory?.glassCount || 0);
  const paperCount = parseInt(localHistory?.paperCount || 0);
  const totalItemsCount = parseInt(localHistory?.totalItems || (plasticCount + aluminiumCount + glassCount + paperCount) || 0);
  
  const totalWeightKg = localHistory?.totalWeightKg !== undefined
    ? localHistory.totalWeightKg 
    : (plasticCount * 0.025 + aluminiumCount * 0.015 + glassCount * 0.2 + paperCount * 0.03).toFixed(2);
    
  const co2AvoidedKg = localHistory?.co2AvoidedKg !== undefined
    ? localHistory.co2AvoidedKg 
    : (plasticCount * 0.08 + aluminiumCount * 0.15 + glassCount * 0.12 + paperCount * 0.05).toFixed(2);

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
          
          <Text style={styles.cardTitle}>Eco Dashboard</Text>
          
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
              </View>

              {/* 2. Total Lifetime Earned */}
              <View style={[styles.pointsStatBox, styles.pointsStatBoxSuccess]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <MaterialCommunityIcons name="star-circle" size={15} color="#059669" style={{ marginRight: 3 }} />
                  <Text style={styles.pointsStatLabel}>Earned</Text>
                </View>
                <Text style={[styles.pointsStatNumber, { color: '#059669' }]}>{totalEarned.toLocaleString()}</Text>
                <Text style={styles.pointsStatUnit}>Lifetime pts</Text>
              </View>

              {/* 3. Total Redeemed */}
              <View style={[styles.pointsStatBox, styles.pointsStatBoxWarning]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <MaterialCommunityIcons name="ticket-percent" size={15} color="#D97706" style={{ marginRight: 3 }} />
                  <Text style={styles.pointsStatLabel}>Redeemed</Text>
                </View>
                <Text style={[styles.pointsStatNumber, { color: '#D97706' }]}>{totalRedeemed.toLocaleString()}</Text>
                <Text style={styles.pointsStatUnit}>Used pts</Text>
              </View>
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
              <Text style={styles.impactLabel}>Items Recycled</Text>
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

        {/* Recovered Items & Material Variants Section */}
        <View style={styles.variantsCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="shape-outline" size={22} color="#0EA5E9" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Recovered Items & Variants</Text>
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalItemsCount} Total</Text>
            </View>
          </View>

          <Text style={styles.variantsSubtitle}>
            Detailed breakdown of all recyclable material variants deposited into RVMs:
          </Text>

          {/* 4 Variant Types Grid */}
          <View style={styles.variantGrid}>
            
            {/* 1. PET Plastic Bottles */}
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

            {/* 2. Aluminium Cans */}
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

            {/* 3. Glass Containers */}
            <View style={[styles.variantCard, styles.glassCard]}>
              <View style={styles.variantTopRow}>
                <View style={[styles.variantIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="glass-wine" size={24} color="#D97706" />
                </View>
                <Text style={styles.variantCountNumber}>{glassCount}</Text>
              </View>
              <Text style={styles.variantTitle}>Glass Bottles</Text>
              <Text style={styles.variantSpecs}>Beverages & Glass Jars</Text>
              
              <View style={styles.variantSubtagsContainer}>
                <View style={styles.variantTag}>
                  <Text style={styles.variantTagText}>Returnable</Text>
                </View>
                <View style={styles.variantTag}>
                  <Text style={styles.variantTagText}>Recyclable</Text>
                </View>
              </View>
            </View>

            {/* 4. Cups & Cartons */}
            <View style={[styles.variantCard, styles.paperCard]}>
              <View style={styles.variantTopRow}>
                <View style={[styles.variantIconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="coffee" size={24} color="#4F46E5" />
                </View>
                <Text style={styles.variantCountNumber}>{paperCount}</Text>
              </View>
              <Text style={styles.variantTitle}>Cups & Cartons</Text>
              <Text style={styles.variantSpecs}>Cups & Juice Cartons</Text>
              
              <View style={styles.variantSubtagsContainer}>
                <View style={styles.variantTag}>
                  <Text style={styles.variantTagText}>Cups</Text>
                </View>
                <View style={styles.variantTag}>
                  <Text style={styles.variantTagText}>Tetra Pak</Text>
                </View>
              </View>
            </View>

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
    color: '#0EA5E9',
    marginBottom: 12,
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
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
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
  glassCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  paperCard: {
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
});

export default DashboardScreen;
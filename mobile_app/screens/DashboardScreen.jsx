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
  ToastAndroid 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import RewardImage from '../assets/images/reward.png';
import ShopImage from '../assets/images/shop.png';
import SpendImage from '../assets/images/spend.png';
import StatsImage from '../assets/images/stats.png';

const DashboardScreen = ({ route }) => {
  const [localUser, setLocalUser] = useState(null);
  const [localHistory, setLocalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(1000);
  const [lastBackup, setLastBackup] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  
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
    heartbeatInterval = setInterval(sendHeartbeat, 30000); // Ping every 30s
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

  // Helper function to get data from AsyncStorage
  const getData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data:', e);
      return null;
    }
  };

  // Helper function to store data in AsyncStorage
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
        // First check if we have new data from route params
        const { user, hasRecycleHistory } = route.params || {};
        
        if (user || hasRecycleHistory) {
          // Store the new data
          if (user) await storeData('user', user);
          console.log("the recycle history is ", hasRecycleHistory);
          if (hasRecycleHistory) await storeData('recycleHistory', hasRecycleHistory);
          
          // Update local state
          setLocalUser(user || null);
          setLocalHistory(hasRecycleHistory || null);
        } else {
          // No new data, load from AsyncStorage
          const [userData, historyData] = await Promise.all([
            getData('user'),
            getData('recycleHistory')
          ]);
          
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
  }, [route.params]);

  // Update reward points when localHistory changes
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

  // Pull the current totals from the backend. `points` is the spendable
  // balance (what has been earned minus anything already claimed at the
  // counter), which is the same figure the admin dashboard shows.
  const fetchPoints = useCallback(async ({ silent } = {}) => {
    const user = await getData('user');
    if (!user?.mobile) {
      if (!silent) ToastAndroid.show("No phone number found!", ToastAndroid.SHORT);
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/get-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: user.mobile }),
    });

    const data = await response.json();
    if (!data || data.success === false) return false;

    await storeData("recycleHistory", data);
    setLocalHistory(data);
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

  // The cached totals go stale as soon as an admin redeems points or the user
  // visits a machine, so re-sync every time the screen comes into view. The
  // cache still renders immediately; this just corrects it in the background.
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
              // Clear auth-related data
              await AsyncStorage.multiRemove(['isLoggedIn', 'user', 'recycleHistory']);
              
              // Reset navigation stack
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistics Card */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={24} 
              color="red" 
            />
          </TouchableOpacity>
          
          <Text style={styles.cardTitle}>Statistics</Text>
          
          {/* User Information Section */}
          <View style={styles.userInfoContainer}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>
                {localUser?.username || "Welcome User"}
              </Text>
            </View>

            <View style={styles.refreshButton}>
              <Text style={styles.userPoints}>
                Points: {localHistory?.points || 0} / {rewardPoints}
              </Text>
              <TouchableOpacity 
                onPress={handleRefresh}
                accessibilityLabel="Refresh points"
                accessibilityHint="Updates your current points balance"
                disabled={refreshing}
              >
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <MaterialCommunityIcons 
                    name="refresh" 
                    size={20} 
                    color={refreshing ? "rgba(150, 150, 150, 1)" : "rgba(65, 68, 65, 1)"} 
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.statisticsContainer}>
            <View style={styles.statisticsLeft}>
              {localHistory ? (
                <>
                  <Text style={styles.recoveredText}>Recovered Items</Text>
                  
                  {/* Bottles */}
                  <View style={styles.statisticRow}>
                    <Image
                      source={require('../assets/images/bottle.png')}
                      style={styles.bottleIcon}
                    />
                    <Text style={styles.statisticLabel}>PET Bottles: {localHistory.bottles || 0}</Text>
                  </View>
                  
                  {/* Cups */}
                  <View style={styles.statisticRow}>
                    <Image
                      source={require('../assets/images/dustbin.png')}
                      style={styles.bottleIcon}
                    />
                    <Text style={styles.statisticLabel}>Cups: {localHistory.cups || 0}</Text>
                  </View>
                  
                  <Text style={styles.recoveredSubtext}>
                    Last recycled on: {localHistory.recycledAt ?
                    new Date(localHistory.recycledAt).toLocaleDateString() : 'Never'}
                  </Text>

                  {/* Points shown above are the spendable balance. When some
                      have already been claimed at the counter, show the split
                      so the drop in the total is not a mystery. */}
                  {localHistory.redeemedPoints > 0 && (
                    <Text style={styles.recoveredSubtext}>
                      Earned {localHistory.earnedPoints || 0} · claimed {localHistory.redeemedPoints}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recycling history yet</Text>
                  <Text style={styles.emptyStateSubtext}>Try our RVM and unlock new prizes!</Text>
                </View>
              )}
            </View>
            
            <View style={styles.statisticsRight}>
              {localHistory ? (
                <Image source={StatsImage} style={styles.statsImage1} />
              ) : (
                <Image 
                  source={require('../assets/images/recycle.png')}
                  style={styles.statsImage1}
                />
              )}
            </View>
          </View>
        </View>

        {/* Get Rewards Card */}
        <TouchableOpacity 
          style={[styles.card, styles.getRewardsCard]}
          onPress={() => navigation.navigate('QrCode')}
        >
          <Text style={styles.cardTitle}>Get Rewards</Text>
          <View style={styles.rewardsContainer}>
            <View style={styles.rewardsLeft}>
              <Text style={styles.rewardsText}>Please Recycle Through our</Text>
              <Text style={styles.rewardsText}>RVM and claim your</Text>
              <Text style={styles.rewardsText}>Reward</Text>
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
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>Spend Rewards</Text>
          <View style={styles.spendContainer}>
            <View style={styles.spendLeft}>
              <Text style={styles.availableCoins}>Available Coins</Text>
              <Text style={styles.coinsCount}>{localHistory?.points || 0}</Text>
            </View>
            <View style={styles.spendRight}>
              <Image source={SpendImage} style={styles.spendImage} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Scrap Bazar Card */}
        <View style={[styles.card, styles.scrapBazarCard]}>
          <Text style={styles.cardTitle}>Scrap Bazar</Text>
          <View style={styles.scrapContainer}>
            <View style={styles.scrapLeft}>
              <Text style={styles.availableCoins}>Coming soon</Text>
            </View>
            <View style={styles.scrapRight}>
              <Image source={ShopImage} style={styles.shopImage} />
            </View>
          </View>
        </View>

        {/* Data Backup & Cloud Sync Card */}
        <View style={[styles.card, styles.backupCard]}>
          <View style={styles.backupHeader}>
            <MaterialCommunityIcons name="cloud-upload" size={24} color="#0284C7" />
            <Text style={styles.cardTitle}>Data Backup & Cloud Sync</Text>
          </View>
          
          <Text style={styles.backupSubtext}>
            {lastBackup ? `Last Backup: ${lastBackup}` : 'No local backup found yet. Back up your profile and recycling history.'}
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
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="file-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.backupButtonText}>Export JSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  getRewardsCard: {
    backgroundColor: '#E0F2FE',
    shadowColor: '#7DD3FC',
  },
  spendRewardsCard: {
    backgroundColor: '#F0FDF4',
    shadowColor: '#86EFAC',
  },
  scrapBazarCard: {
    backgroundColor: '#FEF3C7',
    shadowColor: '#FCD34D',
    marginBottom: 80,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0EA5E9',
    marginBottom: 15,
  },
  userInfoContainer: {
    marginBottom: 15,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userPoints: {
    fontSize: 16,
    color: '#4CAF50',
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statisticsLeft: {
    flex: 1,
    paddingRight: 10,
  },
  statisticsRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveredText: {
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 8,
    fontWeight: '600',
  },
  statisticRow: {
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  statisticLabel: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  bottleIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  recoveredSubtext: {
    fontSize: 12,
    color: '#64748B',
    opacity: 0.8,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statsImage1: {
    borderRadius: 80,
    width: 150,
    height: 150,
    resizeMode: 'contain',
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
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  rewardImage: {
    width: 100,
    height: 150,
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
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  coinsCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#64748B',
  },
  spendImage: {
    width: 140,
    height: 100,
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
    width: 150,
    height: 100,
    resizeMode: 'contain',
  },
  backupCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
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
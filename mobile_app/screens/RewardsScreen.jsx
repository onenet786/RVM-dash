import React, { useEffect, useState } from 'react';
import { 
  ImageBackground, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl,
  ToastAndroid,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RewardsScreen = () => {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'cashout'
  const [rankingList, setRankingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cashout Modal State
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [claiming, setClaiming] = useState(false);

  const fetchData = async (showToast = false) => {
    try {
      // 1. Fetch current user data from AsyncStorage
      const userString = await AsyncStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      setCurrentUser(user);

      // 2. Fetch ranking data from API
      const response = await axios.get(`${API_BASE_URL}/usernames`);
      const users = response.data?.users || [];
      
      const sortedUsers = users.sort((a, b) => (b.totalPoints || b.points || 0) - (a.totalPoints || a.points || 0));
    
      const formattedData = sortedUsers.map((u, index) => ({
        id: index + 1,
        Points: (u.totalPoints || u.points || 0).toString(),
        place: (index + 1).toString().padStart(2, '0'),
        userName: u.fullName || u.userName || u.username || 'Anonymous',
        profileImage: u.profileImage || '',
        isBirthday: Boolean(u.isBirthday),
        bottles: (u.totalPoints || u.points || 0).toString()
      }));
      
      setRankingList(formattedData);
      
      if (showToast) {
        ToastAndroid.show('Refreshed Successfully!', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (showToast) {
        ToastAndroid.show('Failed to refresh data', ToastAndroid.SHORT);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  const isEnterprise = currentUser?.userType === 'ENTERPRISE' || Boolean(currentUser?.orgId);
  const currentPoints = parseInt(currentUser?.points_balance ?? currentUser?.points ?? 0);
  const cashEquivalentPkr = Math.floor(currentPoints * 0.10);

  const handleOpenClaim = (reward) => {
    if (currentPoints < reward.pointsRequired) {
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.pointsRequired.toLocaleString()} pts for this reward. Keep recycling at Smart Kiosks to earn more!`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedReward(reward);
    setAccountNumber(currentUser?.mobile || '');
    setClaimModalVisible(true);
  };

  const handleConfirmClaim = () => {
    if (!accountNumber.trim()) {
      Alert.alert('Required', 'Please enter your phone / account number.');
      return;
    }
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimModalVisible(false);
      Alert.alert(
        'Request Submitted! 🎉',
        `Your request for ${selectedReward?.title} has been logged. Processing within 24 hours to ${accountNumber}. Reference code: TRASH-${Date.now().toString().slice(-6)}`,
        [{ text: 'Great' }]
      );
    }, 1200);
  };

  const ParticipantAvatar = ({ avatar }) => (
    <View style={styles.avatar}>
      <MaterialCommunityIcons 
        name={
          avatar === 'female' ? 'account-heart' :
          avatar === 'leaf' ? 'leaf' :
          avatar === 'earth' ? 'earth' :
          avatar === 'recycle' ? 'recycle-variant' :
          avatar === 'star' ? 'star-shooting' :
          'account'
        } 
        size={20} 
        color="#fff" 
      />
    </View>
  );

  // Rewards catalog items
  const citizenRewards = [
    {
      id: 'easypaisa',
      title: 'EasyPaisa Cashout',
      amount: 'Rs 100 Cash',
      pointsRequired: 1000,
      icon: 'cash-fast',
      color: '#10B981',
      bgColor: '#ECFDF5',
      desc: 'Direct payout to your EasyPaisa mobile account'
    },
    {
      id: 'jazzcash',
      title: 'JazzCash Cashout',
      amount: 'Rs 100 Cash',
      pointsRequired: 1000,
      icon: 'cellphone-wireless',
      color: '#E11D48',
      bgColor: '#FFF1F2',
      desc: 'Direct payout to your JazzCash mobile account'
    },
    {
      id: 'mobile_load',
      title: 'Mobile Balance Recharge',
      amount: 'Rs 200 Airtime',
      pointsRequired: 2000,
      icon: 'signal-cellular-3',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      desc: 'Top-up for Jazz, Telenor, Zong or Ufone numbers'
    },
    {
      id: 'food_voucher',
      title: 'Merchant Food Voucher',
      amount: 'Rs 300 Off',
      pointsRequired: 2500,
      icon: 'food',
      color: '#D97706',
      bgColor: '#FFFBEB',
      desc: 'Instant promo code for Foodpanda / KFC / McDonald\'s'
    }
  ];

  const corporateRewards = [
    {
      id: 'cafeteria',
      title: 'Campus Cafeteria Credit',
      amount: 'Rs 250 Meal Pass',
      pointsRequired: 1000,
      icon: 'coffee',
      color: '#059669',
      bgColor: '#ECFDF5',
      desc: 'Redeem at your corporate campus cafeteria & coffee bar'
    },
    {
      id: 'fuel',
      title: 'Commute & Fuel Allowance',
      amount: 'Rs 500 Fuel Perk',
      pointsRequired: 2500,
      icon: 'gas-station',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      desc: 'Corporate subsidized fuel & transport benefit voucher'
    },
    {
      id: 'esg_cert',
      title: 'Official ESG Certificate',
      amount: 'CSR Platinum',
      pointsRequired: 1500,
      icon: 'certificate',
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      desc: 'Official verified corporate zero-waste contributor badge'
    },
    {
      id: 'corporate_lunch',
      title: 'Executive Lunch Voucher',
      amount: 'Rs 1,000 Off',
      pointsRequired: 4000,
      icon: 'silverware-fork-knife',
      color: '#D97706',
      bgColor: '#FFFBEB',
      desc: 'Subsidized team dining perk for campus sustainability heroes'
    }
  ];

  const activeRewardsList = isEnterprise ? corporateRewards : citizenRewards;

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/images/rankingbg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <Text style={{ fontWeight: '700', color: '#0F172A' }}>Loading Trash to Cash Rewards...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/rankingbg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#070C16' }}>Trash to Cash</Text>
            <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
              {isEnterprise ? 'Corporate Campus Perks & Leaderboard' : 'Eco Cashouts & Public Rankings'}
            </Text>
          </View>
          <View style={styles.pointsBadgePill}>
            <MaterialCommunityIcons name="wallet" size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.pointsBadgeText}>{currentPoints.toLocaleString()} pts</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <MaterialCommunityIcons 
              name={
                currentUser?.profileImage === 'female' ? 'account-heart' :
                currentUser?.profileImage === 'leaf' ? 'leaf' :
                currentUser?.profileImage === 'earth' ? 'earth' :
                currentUser?.profileImage === 'recycle' ? 'recycle-variant' :
                currentUser?.profileImage === 'star' ? 'star-shooting' :
                'account'
              } 
              size={24} 
              color="#fff" 
            />
          </View>
          <View style={styles.profileInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.welcomeText}>
                {currentUser?.fullName || currentUser?.username || 'Eco Recycler'}
              </Text>
              {currentUser?.isBirthday && (
                <Text style={{ marginLeft: 6, fontSize: 16 }}>🎂</Text>
              )}
            </View>
            <Text style={{ fontSize: 11, color: '#475569' }}>
              {isEnterprise 
                ? `${currentUser?.orgName || 'Corporate Campus'} • ID: ${currentUser?.employeeId || 'STAFF'}`
                : `Verified Citizen Recycler • Cash Val: Rs ${cashEquivalentPkr}`}
            </Text>
          </View>
        </View>

        {/* Two-Tab Navigation Switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabButtonActive]}
            onPress={() => setActiveTab('leaderboard')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="trophy" 
              size={16} 
              color={activeTab === 'leaderboard' ? '#FFFFFF' : '#334155'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'cashout' && styles.tabButtonActive]}
            onPress={() => setActiveTab('cashout')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="cash-multiple" 
              size={16} 
              color={activeTab === 'cashout' ? '#FFFFFF' : '#334155'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.tabText, activeTab === 'cashout' && styles.tabTextActive]}>
              {isEnterprise ? 'Perks & CSR' : 'Cashout (PKR)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {activeTab === 'leaderboard' ? (
        <>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.columnHeader}>Participant</Text>
            <Text style={styles.columnHeader}>Points</Text>
            <Text style={styles.columnHeader}>Place</Text>
          </View>

          {/* Ranking List */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0EA5E9']}
                tintColor="#0EA5E9"
                title="Refreshing..."
                titleColor="#666"
              />
            }
          >
            {rankingList.map((item) => (
              <View key={item.id} style={styles.rankingRow}>
                <View style={styles.participantSection}>
                  <ParticipantAvatar avatar={item.profileImage} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.userNameText} numberOfLines={1}>{item.userName}</Text>
                      {item.isBirthday && <Text style={{ marginLeft: 4, fontSize: 14 }}>🎂</Text>}
                    </View>
                  </View>
                </View>
                <View style={styles.bottlesSection}>
                  <View style={styles.bottleInfo}>
                    <MaterialCommunityIcons name="star-circle" size={18} color="#EAB308" />
                    <Text style={styles.bottlesText}>{item.Points}</Text>
                  </View>
                </View>
                <View style={styles.placeSection}>
                  {item.place === '01' ? (
                    <MaterialCommunityIcons name="medal" size={24} color="#FFD700" />
                  ) : item.place === '02' ? (
                    <MaterialCommunityIcons name="medal" size={24} color="#C0C0C0" />
                  ) : item.place === '03' ? (
                    <MaterialCommunityIcons name="medal" size={24} color="#CD7F32" />
                  ) : (
                    <Text style={styles.placeText}>{item.place}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        /* Cashout & Rewards Catalog */
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance conversion card */}
          <View style={styles.balanceCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Available Eco Points</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                {currentPoints.toLocaleString()} <Text style={{ fontSize: 14, color: '#059669' }}>pts</Text>
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669', marginTop: 2 }}>
                Cash Equivalent: ≈ Rs {cashEquivalentPkr} PKR
              </Text>
            </View>
            <View style={styles.balanceRateBadge}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>1,000 pts = Rs 100</Text>
            </View>
          </View>

          <Text style={styles.catalogHeading}>
            {isEnterprise ? 'Corporate Campus Perks' : 'Instant Cashout Options'}
          </Text>

          {activeRewardsList.map((rw) => (
            <TouchableOpacity 
              key={rw.id}
              style={[styles.rewardCard, { backgroundColor: rw.bgColor }]}
              onPress={() => handleOpenClaim(rw)}
              activeOpacity={0.8}
            >
              <View style={[styles.rewardIconCircle, { backgroundColor: '#FFFFFF' }]}>
                <MaterialCommunityIcons name={rw.icon} size={28} color={rw.color} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.rewardTitle}>{rw.title}</Text>
                <Text style={styles.rewardDesc}>{rw.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.rewardAmount, { color: rw.color }]}>{rw.amount}</Text>
                  <Text style={styles.rewardCost}> • {rw.pointsRequired.toLocaleString()} pts</Text>
                </View>
              </View>
              <View style={[styles.claimPill, { backgroundColor: rw.color }]}>
                <Text style={styles.claimPillText}>Claim</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Claim Dialog Modal */}
      <Modal
        visible={claimModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="ticket-confirmation" size={24} color="#059669" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Confirm Redemption</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              You are claiming: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{selectedReward?.title}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
              Required Points: <Text style={{ fontWeight: '700', color: '#059669' }}>{selectedReward?.pointsRequired} pts</Text> ({selectedReward?.amount})
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
              {isEnterprise ? 'Staff Phone / Employee ID' : 'Account Mobile Number (EasyPaisa / JazzCash)'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="e.g. 03001234567"
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setClaimModalVisible(false)}
                disabled={claiming}
              >
                <Text style={{ color: '#64748B', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={handleConfirmClaim}
                disabled={claiming}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {claiming ? 'Processing...' : 'Confirm Cashout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  header: {
    backgroundColor: '#C5D6D8',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
  },
  pointsBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 3,
    marginTop: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  columnHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  participantSection: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  bottlesSection: {
    flex: 1,
    alignItems: 'center',
  },
  bottleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottlesText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    marginLeft: 4,
  },
  placeSection: {
    flex: 0.8,
    alignItems: 'center',
  },
  placeText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  balanceRateBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  catalogHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rewardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rewardAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  rewardCost: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  claimPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  claimPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
});

export default RewardsScreen;
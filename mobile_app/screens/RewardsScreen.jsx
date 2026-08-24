import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState } from 'react';
import { 
  ImageBackground, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl,
  ToastAndroid 
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RewardsScreen = () => {
  const [rankingList, setRankingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showToast = false) => {
    try {
      // 1. Fetch current user data from AsyncStorage
      const userString = await AsyncStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      setCurrentUser(user);

      // 2. Fetch ranking data from API
      const response = await axios.get(`${API_BASE_URL}/usernames`);
      const users = response.data.users;
      
      const sortedUsers = users.sort((a, b) => b.totalPoints - a.totalPoints);
    
      const formattedData = sortedUsers.map((user, index) => ({
        id: index + 1,
        Points: user.totalPoints.toString(),
        place: (index + 1).toString().padStart(2, '0'),
        userName: user.fullName || user.userName || 'Anonymous',
        profileImage: user.profileImage || '',
        isBirthday: Boolean(user.isBirthday),
        bottles: user.totalPoints.toString()
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
    await fetchData(true); // Pass true to show toast message
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

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/images/rankingbg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
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
        <Text style={{ fontSize: 24, color: 'black', marginBottom: 10 }}>Eco Leaderboard</Text>
        <View style={styles.headerContent}>
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
                  Welcome, {currentUser?.fullName || currentUser?.username || 'Eco Hero'}
                </Text>
                {currentUser?.isBirthday && (
                  <Text style={{ marginLeft: 6, fontSize: 16 }}>🎂</Text>
                )}
              </View>
              
              <View style={styles.profileLines}>
                <View style={styles.profileLine1} />
                <View style={styles.profileLine2} />
                <View style={styles.profileLine3} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.columnHeader}>Participant</Text>
        <Text style={styles.columnHeader}>Points</Text>
        <Text style={styles.columnHeader}>Place</Text>
      </View>

      {/* Ranking List */}
      <ScrollView 
        style={styles.scrollView} 
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  header: {
    backgroundColor: '#B5C8CA',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomEndRadius: 30,
    borderBottomStartRadius: 30,
  },
  headerContent: {
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLines: {
    flex: 1,
  },
  profileLine1: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    marginBottom: 6,
    width: '60%',
  },
  profileLine2: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 5,
    marginBottom: 4,
    width: '80%',
  },
  profileLine3: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 5,
    width: '70%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  participantSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bottlesSection: {
    flex: 1,
    alignItems: 'center',
  },
  bottlesText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  placeSection: {
    flex: 1,
    alignItems: 'center',
  },
  placeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bottleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft:10
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default RewardsScreen;
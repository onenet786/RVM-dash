import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/DashboardScreen';
import RewardsScreen from '../screens/RewardsScreen';
import QrCode from '../screens/QrCode';
import Maps from '../screens/Maps';
import Promotions from '../screens/Promotions';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.navContainer}>
      <View style={styles.bottomNav}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const iconName = options.tabBarIconName;
          const label = options.tabBarLabel || route.name;
          const isFocused = state.index === index;
          const isQr = route.name === 'QrCode';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isQr) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.qrNavItem}
              >
                <View style={styles.qrInnerCircle}>
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrLabel}>Scan</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.navItem}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={isFocused ? '#10B981' : '#64748B'}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: isFocused ? '#10B981' : '#64748B', fontWeight: isFocused ? '700' : '500' }
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIconName: 'home-variant', tabBarLabel: 'Home' }} 
      />
      <Tab.Screen 
        name="Promotions" 
        component={Promotions} 
        options={{ tabBarIconName: 'gift-outline', tabBarLabel: 'Offers' }} 
      />
      <Tab.Screen 
        name="QrCode"  
        component={QrCode} 
        options={{ tabBarIconName: 'qrcode-scan', tabBarLabel: 'Scan' }} 
      />
      <Tab.Screen 
        name="location" 
        component={Maps} 
        options={{ tabBarIconName: 'map-marker-radius', tabBarLabel: 'Kiosks' }} 
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen} 
        options={{ tabBarIconName: 'trophy-award', tabBarLabel: 'Rank' }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#070C16',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 50,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 3,
  },
  qrNavItem: {
    alignItems: 'center',
    marginTop: -28,
  },
  qrInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#070C16',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  qrLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
});

export default TabNavigator;

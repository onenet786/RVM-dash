import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/DashboardScreen';
import RewardsScreen from '../screens/RewardsScreen';
import QrCode from '../screens/QrCode';
import Maps from '../screens/Maps';
import Promotions from '../screens/Promotions';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const iconName = options.tabBarIconName;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
  key={route.key}
  onPress={onPress}
  style={[
    styles.navItem,
    route.name === 'QrCode' && styles.qrNavItem, // Add custom style
  ]}
>
  <MaterialCommunityIcons
    name={iconName}
    size={route.name === 'QrCode' ? 40 : 24} // Bigger icon for QR
    color="#FFFFFF"
  />
</TouchableOpacity>

        );
      })}
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIconName: 'home' }} />
<Tab.Screen name="Promotions" component={Promotions} options={{ tabBarIconName: 'gift' }} />
<Tab.Screen name="QrCode"  component={QrCode} options={{ tabBarIconName: 'qrcode-scan' }} />
<Tab.Screen name="location" component={Maps} options={{ tabBarIconName: 'map-marker' }} />
<Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarIconName: 'trophy' }} />

    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 16,
    margin: 4,
    position: 'relative',
    bottom: 2,

  },
  navItem: {
    padding: 8,
  },
qrNavItem: {
  backgroundColor: '#0284C7',
  padding: 12,
  borderRadius: 50,
  marginTop: -30, // Push upward
  elevation: 5, // Optional shadow for Android
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
},

});

export default TabNavigator;

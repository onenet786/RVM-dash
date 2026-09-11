import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  ToastAndroid,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

const formatGpsCoordinates = (lat, lng) => {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return '';
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const latDir = latNum >= 0 ? 'N' : 'S';
  const lngDir = lngNum >= 0 ? 'E' : 'W';
  return `${Math.abs(latNum).toFixed(4)}° ${latDir}, ${Math.abs(lngNum).toFixed(4)}° ${lngDir}`;
};

const DEFAULT_MACHINES = [
  {
    machineId: 'RVM-007',
    name: 'Walled City Kiosk (RVM-007)',
    location: 'Katra Neem Wala, Walled City, Lahore, Punjab, Pakistan',
    latitude: 31.5826,
    longitude: 74.3276,
    status: 'ONLINE',
    isOnline: true,
    binFillPercentage: 0,
  },
  {
    machineId: 'peco001',
    name: 'Main Recycling Kiosk (peco001)',
    location: 'Main Entrance / Campus',
    latitude: 31.5204,
    longitude: 74.3587,
    status: 'ONLINE',
    isOnline: true,
    binFillPercentage: 15,
  },
  {
    machineId: 'RVM-RWP',
    name: 'Rawalpindi Saddar Hub (RVM-RWP)',
    location: 'Rawalpindi Saddar Branch',
    latitude: 33.5973,
    longitude: 73.0479,
    status: 'ONLINE',
    isOnline: true,
    binFillPercentage: 35,
  },
  {
    machineId: 'RVM-001',
    name: 'Islamabad Central Kiosk (RVM-001)',
    location: 'Islamabad Sector H-8 Campus',
    latitude: 33.7294,
    longitude: 73.0931,
    status: 'ONLINE',
    isOnline: true,
    binFillPercentage: 0,
  }
];

const Maps = () => {
  const [machines, setMachines] = useState(DEFAULT_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(DEFAULT_MACHINES[0]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);

  const fetchLiveMachines = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/machines`, { timeout: 8000 });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setMachines(res.data);
        if (!selectedMachine || !res.data.find(m => m.machineId === selectedMachine.machineId)) {
          setSelectedMachine(res.data[0]);
        }
        if (!silent && Platform.OS === 'android') {
          ToastAndroid.show(`Loaded ${res.data.length} live RVM kiosks!`, ToastAndroid.SHORT);
        }
      }
    } catch (err) {
      console.log('[Maps Fetch Note]', err.message);
      if (!silent && Platform.OS === 'android') {
        ToastAndroid.show('Showing registered kiosk locations', ToastAndroid.SHORT);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMachines();
    const interval = setInterval(() => fetchLiveMachines(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const focusOnMachine = (m, index = null) => {
    setSelectedMachine(m);
    if (mapRef.current && m.latitude && m.longitude) {
      mapRef.current.animateToRegion({
        latitude: m.latitude,
        longitude: m.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
    }
    if (index !== null && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (CARD_WIDTH + 14),
        animated: true,
      });
    }
  };

  const openDirections = (m) => {
    if (!m.latitude || !m.longitude) {
      Alert.alert('Location Pending', 'This machine has not reported GPS coordinates yet.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps app.');
    });
  };

  const initialLat = (machines[0] && machines[0].latitude) || 31.5204;
  const initialLng = (machines[0] && machines[0].longitude) || 74.3587;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
      >
        {machines.map((m, index) => {
          const isSelected = selectedMachine?.machineId === m.machineId;
          const isOnline = m.status === 'ONLINE' || m.isOnline;
          return (
            <Marker
              key={m.machineId || index}
              coordinate={{
                latitude: m.latitude || 31.5204,
                longitude: m.longitude || 74.3587,
              }}
              title={m.name || `RVM ${m.machineId}`}
              description={`${m.location || 'Campus'} • ${isOnline ? '🟢 Live' : '⚪ Offline'}`}
              onPress={() => focusOnMachine(m, index)}
              pinColor={isOnline ? '#059669' : '#94A3B8'}
            >
              <View style={[styles.customMarker, isSelected && styles.customMarkerSelected, isOnline ? styles.markerOnline : styles.markerOffline]}>
                <MaterialCommunityIcons name="recycle" size={20} color="#FFFFFF" />
              </View>
              <Callout onPress={() => openDirections(m)}>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>{m.name || m.machineId}</Text>
                  <Text style={styles.calloutSub}>{m.location || 'Location Pending'}</Text>
                  <Text style={styles.calloutAction}>Tap for Directions ↗</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Floating Info Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.topBarTitle}>RVM Smart Kiosks</Text>
            <Text style={styles.topBarSub}>{machines.length} active locations on map</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchLiveMachines(false)}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0284C7" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={20} color="#0284C7" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Horizontal Kiosk Cards Carousel */}
      <View style={styles.bottomCarouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselScroll}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 14}
        >
          {machines.map((m, index) => {
            const isSelected = selectedMachine?.machineId === m.machineId;
            const isOnline = m.status === 'ONLINE' || m.isOnline;
            return (
              <TouchableOpacity
                key={m.machineId || index}
                style={[styles.kioskCard, isSelected && styles.kioskCardSelected]}
                onPress={() => focusOnMachine(m, index)}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>{m.machineId}</Text>
                  </View>
                  <View style={[styles.statusBadge, isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                    <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                    <Text style={[styles.statusText, { color: isOnline ? '#065F46' : '#475569' }]}>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>
                  {m.name || `RVM ${m.machineId}`}
                </Text>

                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#0284C7" style={styles.locIcon} />
                  <Text style={styles.locationText} numberOfLines={2}>
                    {m.location || 'Location Pending'}
                  </Text>
                </View>

                {m.latitude != null && m.longitude != null && (
                  <View style={styles.coordBadge}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={13} color="#0284C7" />
                    <Text style={styles.coordText}>{formatGpsCoordinates(m.latitude, m.longitude)}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.fillInfo}>
                    <MaterialCommunityIcons name="delete-empty" size={16} color="#64748B" />
                    <Text style={styles.fillText}>
                      Bin Fill: <Text style={{ fontWeight: '800', color: m.binFillPercentage >= 80 ? '#DC2626' : '#059669' }}>{m.binFillPercentage || 0}%</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => openDirections(m)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="navigation-variant" size={15} color="#FFFFFF" />
                    <Text style={styles.navigateText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerOnline: {
    backgroundColor: '#059669',
  },
  markerOffline: {
    backgroundColor: '#64748B',
  },
  customMarkerSelected: {
    borderColor: '#38BDF8',
    borderWidth: 3.5,
    transform: [{ scale: 1.15 }],
  },
  calloutBox: {
    padding: 10,
    minWidth: 160,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#0F172A',
  },
  calloutSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  calloutAction: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: 'bold',
    marginTop: 4,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCarouselContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
  carouselScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  kioskCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  kioskCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  idText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeOnline: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeOffline: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locIcon: {
    marginRight: 4,
    marginTop: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  coordText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  fillInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fillText: {
    fontSize: 11,
    color: '#64748B',
  },
  navigateBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  navigateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default Maps;
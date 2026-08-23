import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Config from 'react-native-config';

const Maps = () => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const API_KEY = Config.API_KEY

  const locations = {
    rvm1: {
      title: 'Rvm1',
      description: 'First location',
      lat: 31.51224395902473,
      lng: 74.35422804427743,
    },
    rvm2: {
      title: 'Rvm2',
      description: 'Second location',
      lat: 31.447101066394122,
      lng: 74.26824232883584,
    },
    rvm3: {
      title: 'Rvm3',
      description: 'Third location',
      lat: 31.392538508512317,
      lng: 74.2420509,
    },
  };

  const decodePolyline = (encoded) => {
    const points = polyline.decode(encoded);
    return points.map(([latitude, longitude]) => ({ latitude, longitude }));
  };

  const fetchRoute = async () => {
    setShowModal(true);
  };

  const handleDestinationSelect = async (originKey, destKey) => {
    setShowModal(false);
    
    const origin = locations[originKey];
    const dest = locations[destKey];

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&mode=driving&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes.length) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        
        // Center the map on the route
        const coordinates = points.length > 0 ? points : [
          { latitude: origin.lat, longitude: origin.lng },
          { latitude: dest.lat, longitude: dest.lng }
        ];
        
        // You would need a mapRef to use fitToCoordinates
        // This is just to show the concept
        // mapRef.current?.fitToCoordinates(coordinates, {
        //   edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        //   animated: true,
        // });
      } else {
        Alert.alert('Error', 'No route found');
      }
    } catch (error) {
      console.error('Directions API error:', error);
      Alert.alert('Error', 'Failed to fetch directions');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: locations.rvm1.lat,
          longitude: locations.rvm1.lng,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
      >
        {Object.values(locations).map((location, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            title={location.title}
            description={location.description}
            image={require('../assets/images/reward.png')}
          />
        ))}
        
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="blue"
            strokeWidth={4}
          />
        )}
      </MapView>
{/* 
      <TouchableOpacity style={styles.button} onPress={fetchRoute}>
        <Icon name="route" size={24} color="#fff" />
      </TouchableOpacity> */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Route</Text>
            
            <TouchableOpacity 
              style={styles.routeOptionButton}
              onPress={() => handleDestinationSelect('rvm1', 'rvm2')}
            >
              <Text style={styles.routeOptionText}>Rvm1 to Rvm2</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.routeOptionButton}
              onPress={() => handleDestinationSelect('rvm2', 'rvm3')}
            >
              <Text style={styles.routeOptionText}>Rvm2 to Rvm3</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.routeOptionButton}
              onPress={() => handleDestinationSelect('rvm1', 'rvm3')}
            >
              <Text style={styles.routeOptionText}>Rvm1 to Rvm3</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  button: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    height: 50,
    width: 50,
    borderRadius: 100,
    backgroundColor: '#67B7D1',
    padding: 15,
    alignItems: 'center',
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  routeOptionButton: {
    padding: 15,
    backgroundColor: '#67B7D1',
    borderRadius: 10,
    marginBottom: 10,
  },
  routeOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
  cancelButton: {
    padding: 15,
    backgroundColor: '#f44336',
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
});

export default Maps;
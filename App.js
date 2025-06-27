import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

const GOOGLE_MAPS_APIKEY = 'YOUR_API_KEY_HERE'; // Replace with your GCP Maps API Key

const App = () => {
  const [riderLocation, setRiderLocation] = useState({ latitude: 37.7749, longitude: -122.4194 }); // Example: SF
  const [cafeLocation, setCafeLocation] = useState({ latitude: 37.7849, longitude: -122.4094 });   // Example: Nearby
  const [customerLocation, setCustomerLocation] = useState({ latitude: 37.7949, longitude: -122.3994 }); // Example: Nearby
  
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    requestLocationPermission();
    getDirections();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
    Geolocation.getCurrentPosition(
      position => {
        setRiderLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const getDirections = async () => {
    try {
      const origin = `${riderLocation.latitude},${riderLocation.longitude}`;
      const waypoint = `${cafeLocation.latitude},${cafeLocation.longitude}`;
      const destination = `${customerLocation.latitude},${customerLocation.longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoint}&alternatives=true&key=${GOOGLE_MAPS_APIKEY}&departure_time=now`;

      const response = await axios.get(url);
      if (response.data.routes.length) {
        const points = decodePolyline(response.data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        setDistance(response.data.routes[0].legs.reduce((total, leg) => total + leg.distance.text, ''));
        setDuration(response.data.routes[0].legs.reduce((total, leg) => total + leg.duration_in_traffic.text, ''));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const decodePolyline = (t, e) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={riderLocation} title="Rider" pinColor="blue" />
        <Marker coordinate={cafeLocation} title="Cafe" pinColor="green" />
        <Marker coordinate={customerLocation} title="Customer" pinColor="red" />
        <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
      </MapView>
      <View style={styles.info}>
        <Text>Total Distance: {distance}</Text>
        <Text>Estimated Time: {duration}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  info: { padding: 10, backgroundColor: '#fff' },
});

export default App;

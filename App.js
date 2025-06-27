import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';

const GOOGLE_MAPS_APIKEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE'; // Replace with your real key

const App = () => {
  const [riderLocation, setRiderLocation] = useState({ latitude: 16.7049873, longitude: 74.2432527 });
  const [cafeLocation, setCafeLocation] = useState({ latitude: 16.708425, longitude: 74.228245 });
  const [customerLocation, setCustomerLocation] = useState({ latitude: 16.711488, longitude: 74.226219 });

  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  const handleGetRoute = async () => {
    try {
      const origin = `${riderLocation.latitude},${riderLocation.longitude}`;
      const waypoint = `${cafeLocation.latitude},${cafeLocation.longitude}`;
      const destination = `${customerLocation.latitude},${customerLocation.longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoint}&alternatives=true&key=${GOOGLE_MAPS_APIKEY}&departure_time=now`;

      const response = await axios.get(url);

      if (response.data.routes.length) {
        const points = decodePolyline(response.data.routes[0].overview_polyline.points);
        setRouteCoords(points);

        const totalDistance = response.data.routes[0].legs.map(leg => leg.distance.text).join(' + ');
        const totalDuration = response.data.routes[0].legs.map(leg => leg.duration.text).join(' + ');

        setDistance(totalDistance);
        setDuration(totalDuration);
      } else {
        console.log('No routes found');
      }
    } catch (error) {
      console.log('Error fetching directions:', error);
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const renderCoordinateInputs = (label, location, setLocation) => (
    <View style={styles.inputGroup}>
      <Text>{label} Latitude:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Latitude"
        keyboardType="numeric"
        value={location.latitude.toString()}
        onChangeText={(text) => setLocation({ ...location, latitude: parseFloat(text.trim()) })}
      />
      <Text>{label} Longitude:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Longitude"
        keyboardType="numeric"
        value={location.longitude.toString()}
        onChangeText={(text) => setLocation({ ...location, longitude: parseFloat(text.trim()) })}
      />
    </View>
  );

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

      <ScrollView style={styles.form}>
        {renderCoordinateInputs('Rider', riderLocation, setRiderLocation)}
        {renderCoordinateInputs('Cafe', cafeLocation, setCafeLocation)}
        {renderCoordinateInputs('Customer', customerLocation, setCustomerLocation)}

        <Button title="Show Route" onPress={handleGetRoute} />

        <View style={styles.info}>
          <Text>Total Distance: {distance}</Text>
          <Text>Estimated Time: {duration}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 2 },
  form: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  inputGroup: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    marginVertical: 5,
    borderRadius: 5,
  },
  info: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});

export default App;

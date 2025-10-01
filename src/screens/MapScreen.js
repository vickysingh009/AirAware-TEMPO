// src/screens/MapScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

let MapView = null;
let Marker = null;
let Circle = null;
let PROVIDER_GOOGLE = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

// <-- set to your machine IP / server
const SERVER = 'http://192.168.1.3:4000';

export default function MapScreen({ route, navigation }) {
  const initial = route?.params?.loc ?? null;
  const [loc, setLoc] = useState(initial);
  const [selected, setSelected] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!loc) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        try {
          const l = await Location.getCurrentPositionAsync({});
          const coords = { latitude: l.coords.latitude, longitude: l.coords.longitude };
          setLoc(coords);
          setSelected(coords);
        } catch (e) {
          console.warn('Could not get device location:', e);
        }
      }
    })();
  }, []);

  if (!loc) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Getting location…</Text>
      </View>
    );
  }

  function onMapPress(evt) {
    const { latitude, longitude } = evt.nativeEvent.coordinate;
    setSelected({ latitude, longitude });
  }

  function onMarkerDragEnd(evt) {
    const { latitude, longitude } = evt.nativeEvent.coordinate;
    setSelected({ latitude, longitude });
  }

  async function useDeviceLocation() {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to use device location.');
        setLoading(false);
        return;
      }
      const p = await Location.getCurrentPositionAsync({});
      const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setSelected(coords);
      setLoc(coords);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to get device location.');
    } finally {
      setLoading(false);
    }
  }

  // IMPORTANT: fetch server for selected coords, then navigate back with aqData
  async function confirmLocation() {
    if (!selected) {
      Alert.alert('Select location', 'Please tap the map to choose a location.');
      return;
    }

    setLoading(true);
    try {
      const url = `${SERVER}/api/aq?lat=${selected.latitude}&lon=${selected.longitude}`;
      const resp = await axios.get(url, { timeout: 20000 });
      const aqData = resp.data;

      // Navigate back to Home and pass selectedLoc + aqData
      navigation.navigate('Home', { selectedLoc: selected, aqData });
    } catch (err) {
      console.error('Error fetching AQ for selected location:', err?.message ?? err);
      Alert.alert('Fetch error', 'Unable to fetch air quality for selected location. Returning selection only.');
      navigation.navigate('Home', { selectedLoc: selected });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' && MapView ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          onPress={onMapPress}
        >
          {selected && (
            <Marker
              coordinate={selected}
              draggable
              onDragEnd={onMarkerDragEnd}
              title="Selected location"
              description={`${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`}
            />
          )}

          {Circle && (
            <Circle
              center={selected || loc}
              radius={800}
              strokeWidth={1}
              strokeColor={'rgba(0,0,0,0.12)'}
              fillColor={'rgba(45,108,223,0.06)'}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.center}>
          <Text>Map not available on web.</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={useDeviceLocation} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Locating…' : 'Use current location'}</Text>
        </TouchableOpacity>

        <View style={{ width: 12 }} />

        <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={confirmLocation} disabled={loading}>
          <Text style={[styles.btnText, { color: '#fff' }]}>{loading ? 'Fetching…' : 'Set Location'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coordBox}>
        <Text style={{ fontSize: 12, color: '#374151' }}>
          Selected: {selected ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}` : '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  controls: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  confirmBtn: {
    backgroundColor: '#2d6cdf',
  },
  btnText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  coordBox: {
    position: 'absolute',
    bottom: 78,
    left: 14,
    right: 14,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    elevation: 2,
  },
});

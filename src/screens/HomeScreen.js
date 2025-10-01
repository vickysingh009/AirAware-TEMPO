// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import AQICard from '../components/AQICard';
import AQISummaryCard from '../components/AQISummaryCard';

// update to your server IP
const SERVER = 'http://192.168.1.3:4000';

// This is the mock forecast data. By defining it once here, we can use it in multiple places.
const mockHourlyData = {
  forecast: {
    hourly: [
      { aqi: 173, time: '11:00' },
      { aqi: 194, time: '13:00' },
      { aqi: 173, time: '15:00' },
      { aqi: 176, time: '17:00' },
      { aqi: 185, time: '19:00' },
      { aqi: 188, time: '21:00' },
      { aqi: 190, time: '23:00' },
      { aqi: 195, time: '1:00' },
      { aqi: 173, time: '3:00' },
      { aqi: 188, time: '5:00' },
      { aqi: 177, time: '7:00' },
      { aqi: 178, time: '9:00' },
    ],
  },
};

// --- COMPONENT FOR HOURLY FORECAST ---
const HourlyForecastCard = ({ data }) => {
  const hourlyData = data?.forecast?.hourly;
  if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.forecastContainer}>
      <Text style={styles.forecastTitle}>24-Hour Forecast</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {hourlyData.map((item, index) => (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.forecastValue}>{item.aqi}</Text>
            <Text style={styles.forecastTime}>{item.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default function HomeScreen({ navigation, route }) {
  const [loc, setLoc] = useState(null);
  const [aqData, setAqData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchAQ(coords) {
    if (!coords) {
      setError('Location unavailable');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER}/api/aq?lat=${coords.latitude}&lon=${coords.longitude}`);

      // Merge the real data from the API with our mock forecast data
      setAqData({ ...res.data, ...mockHourlyData });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('fetchAQ error:', err?.response?.data ?? err?.message ?? err);
      setError('Failed to fetch AQ data. Make sure the server is running and reachable.');
    } finally {
      setLoading(false);
    }
  }

  // initial device location + fetch
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }
        const l = await Location.getCurrentPositionAsync({});
        const coords = { latitude: l.coords.latitude, longitude: l.coords.longitude };
        setLoc(coords);
        await fetchAQ(coords);
      } catch (e) {
        console.error('Location / fetch error:', e);
        setError('Unable to get location or fetch data: ' + (e.message || e));
      }
    })();
  }, []);

  // Listen for selectedLoc + aqData from MapScreen
  useEffect(() => {
    const incomingAQ = route?.params?.aqData;
    const selected = route?.params?.selectedLoc;

    if (incomingAQ) {
      if (selected && selected.latitude && selected.longitude) setLoc(selected);

      setAqData({ ...incomingAQ, ...mockHourlyData });

      setLastUpdated(new Date());
      setError(null);
      try {
        navigation.setParams({ selectedLoc: null, aqData: null });
      } catch (e) {}
      return;
    }

    if (selected && selected.latitude && selected.longitude) {
      setLoc(selected);
      fetchAQ(selected);
      try {
        navigation.setParams({ selectedLoc: null });
      } catch (e) {}
    }
  }, [route?.params?.aqData, route?.params?.selectedLoc]);

  function openMap() {
    if (!loc) {
      Alert.alert('Location', 'Location not available yet.');
      return;
    }
    navigation.navigate('Map', { loc, aqData });
  }

  function openForecast() {
    navigation.navigate('Forecast', { aqData });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AirAware — Dashboard</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (loc) fetchAQ(loc);
            else Alert.alert('Location', 'Location not available yet.');
          }}
        >
          <Text style={styles.headerBtnText}>⟳ Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {/* --- CHANGE 1 --- Added contentContainerStyle prop for inner spacing */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContentContainer}
      >
        {loading && !aqData ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 8 }}>Loading air quality…</Text>
          </View>
        ) : (
          <>
            <AQISummaryCard data={aqData} loc={loc} onPressDetails={openForecast} />

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={openForecast}>
                <Text style={styles.actionText}>Open Forecast</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.lightBtn]}
                onPress={() => (loc ? fetchAQ(loc) : Alert.alert('Location', 'Location not available'))}
              >
                <Text style={[styles.actionText, styles.lightText]}>Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.warnBtn]} onPress={openMap}>
                <Text style={[styles.actionText, styles.warnText]}>View Map</Text>
              </TouchableOpacity>
            </View>

            <AQICard
              data={aqData}
              onPressForecast={openForecast}
              onRefresh={() => loc && fetchAQ(loc)}
              onPressMap={openMap}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              hideSummary={true}
            />

            <HourlyForecastCard data={aqData} />

            {!aqData && !loading && <Text style={styles.hint}>No AQ data yet — press Refresh or check your server.</Text>}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: {
    height: 64,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  title: { fontWeight: '700', fontSize: 18 },
  headerBtn: { padding: 8, backgroundColor: '#eef3ff', borderRadius: 8 },
  headerBtnText: { color: '#2d6cdf', fontWeight: '600' },

  content: { padding: 14 },

  // --- CHANGE 2 --- Added new style for the scroll view's inner container
  scrollContentContainer: {
    paddingBottom: 40,
  },

  center: { alignItems: 'center', justifyContent: 'center', height: 180 },

  forecastContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    elevation: 1,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastTime: {
    fontSize: 14,
    color: '#555',
  },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 1,
  },
  actionText: { fontWeight: '700' },
  lightBtn: { backgroundColor: '#eef3ff' },
  lightText: { color: '#2d6cdf' },
  warnBtn: { backgroundColor: '#fff6eb' },
  warnText: { color: '#d35400' },

  hint: { marginTop: 12, color: '#6b7280', textAlign: 'center' },
});
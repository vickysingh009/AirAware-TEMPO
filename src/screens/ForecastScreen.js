import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { pm25ToAQI } from '../utils/aqi';
import { simpleForecast } from '../services/forecast';

export default function ForecastScreen({ route }) {
  const { aqData } = route.params || {};
  const hourly = (aqData?.tempo?.hourly) || [];
  // prepare labels & data
  const labels = hourly.map(h => new Date(h.time).getUTCHours() + ':00');
  const pm25 = hourly.map(h => h.PM25);
  const aqi = pm25.map(v => pm25ToAQI(v) || 0);

  return (
    <ScrollView style={{flex:1, padding:12}}>
      <Text style={{fontSize:18, fontWeight:'600', marginBottom:8}}>Hourly TEMPO (mock) forecast</Text>
      {hourly.length === 0 ? <Text>No hourly TEMPO data available.</Text> : (
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data: aqi }]
          }}
          width={Dimensions.get('window').width - 24}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`
          }}
          bezier
          style={{ borderRadius: 8 }}
        />
      )}

      <View style={{height:20}}/>

      <Text style={{fontSize:16, fontWeight:'500'}}>Simple forecast (one-step):</Text>
      <Text style={{marginTop:8}}>
        {aqData ? `Forecast value (PM2.5 proxy): ${Math.round(simpleForecast({
          groundVals: (aqData.ground?.results?.[0]?.measurements || []).filter(m=>m.parameter==='pm25').map(m=>m.value).slice(0,6) || [0],
          satVals: pm25,
          weather: aqData.weather?.wind ? { wind_speed: aqData.weather.wind.speed, rain: aqData.weather.rain } : {}
        }))} µg/m³` : 'No data'}
      </Text>
    </ScrollView>
  );
}

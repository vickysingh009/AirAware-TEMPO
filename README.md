# AirQualityApp (Expo) + Aggregator (Node)
This is a minimal prototype scaffold for the TEMPO -> Action hackathon.

## Quick start (mobile app)
1. Install dependencies:
   npm install
2. From project root run:
   npx expo start
3. Run the Node aggregator server (in another terminal):
   cd server
   npm install
   npm start

Notes:
- The mobile app expects the aggregator at http://10.0.2.2:4000 by default (Android emulator).
  Change SERVER in src/screens/HomeScreen.js and src/services/api.js to your server IP (e.g., http://192.168.x.y:4000) when using a physical device.
- The TEMPO data included is a small mock (server/tempo-mock.json). Replace with real TEMPO ingestion when ready.

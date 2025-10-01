import axios from 'axios';
const SERVER = 'http://192.168.1.3:4000'; // change to your server address

export async function fetchAQ(lat, lon) {
  const res = await axios.get(`${SERVER}/api/aq?lat=${lat}&lon=${lon}`);
  return res.data;
}

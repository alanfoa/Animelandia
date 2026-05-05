import axios from 'axios';

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isDev ? 'http://localhost:3000' : 'https://animelandia-api-6wp2.onrender.com';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export default client;

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend API base URL
  withCredentials: true, // This is crucial for sending cookies
});

export default axiosInstance;
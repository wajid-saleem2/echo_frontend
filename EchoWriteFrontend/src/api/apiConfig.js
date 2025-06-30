// frontend/src/services/axiosInstance.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Your backend API URL

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true, // <<<< THIS IS THE CRUCIAL PART
});

// Optional: Add a request interceptor to include the JWT token
// This assumes you store your JWT token in localStorage
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('echowrite-token'); // Or however you store your token
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Add a response interceptor for global error handling (e.g., 401 unauthorized)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle 401 errors globally - e.g., logout user, redirect to login
            console.error("AXIOS INTERCEPTOR: Unauthorized (401). Logging out or redirecting.");
            // Example:
            // localStorage.removeItem('echowrite-token');
            // window.location.href = '/login'; // Or use React Router's navigate
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
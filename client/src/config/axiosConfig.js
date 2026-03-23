import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    withCredentials: true,
    timeout: 10000, // 10 second timeout
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
        const token = localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
    }
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response: ${response.status} from ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error(`❌ Response Error: ${error.response?.status || 'Network Error'} from ${error.config?.url}`);
        return Promise.reject(error);
    }
);

export default api;
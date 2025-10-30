
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "https://quickchatbackend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // allows cookies if backend uses them
});

export default api;

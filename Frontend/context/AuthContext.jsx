import { createContext, useEffect, useState } from "react";
import api from "../utils/api"; // use your custom axios instance
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Check authentication
  const checkAuth = async () => {
    if (!token) return;
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const { data } = await api.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      logout();
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await api.post(`/api/auth/${state.toLowerCase()}`, credentials);
      if (data.success) {
        setAuthUser(data.userData || data.user);
        api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message || `${state} successful`);
        connectSocket(data.userData || data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    api.defaults.headers.common["Authorization"] = null;
    toast.success("Logged out successfully");
    if (socket) socket.disconnect();
    setSocket(null);
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await api.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "https://quickchatbackend.onrender.com", {
      auth: { userId: userData._id },
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Socket connected:", newSocket.id));
    newSocket.on("getOnlineUsers", setOnlineUsers);
    newSocket.on("disconnect", () => console.log("Socket disconnected"));
  };

  useEffect(() => {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    checkAuth();
  }, []);

  const value = {
    api, // <-- use this in other components
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

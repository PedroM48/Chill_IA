// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

import { API_BASE_URL } from "../utils/api";

export const AuthContext = createContext({ token: null, userInfo: null });

export function AuthProvider({ children }) {
  // 1) Token sale del localStorage (persistencia) o del login
  const [token, setToken] = useState(() => localStorage.getItem("jwt") || null);
  const [userInfo, setUserInfo] = useState(null);

  // 2) Cada vez que cambie token ⇒ refrescamos perfil
  useEffect(() => {
    if (!token) return;                             // no hay token ⇒ no perfil
    axios
      .get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("PERFIL CARGADO:", res.data);
        setUserInfo(res.data);                      // ✔️ trae distrito
      })
      .catch((err) => {
        console.error("GET /profile error", err);
        // Si el token vence o es inválido, limpiamos sesión
        setToken(null);
        setUserInfo(null);
        localStorage.removeItem("jwt");
      });
  }, [token]);

  // 3) Funciones de login / logout
  const login = async (email, password) => {
    const { data } = await axios.post(
      "`${API_BASE_URL}/login`",
      { email, password }
    );
    setToken(data.token);
    localStorage.setItem("jwt", data.token);
    // 🚀   No navegues a MainPage hasta que userInfo se llene
  };

  const logout = () => {
    setToken(null);
    setUserInfo(null);
    localStorage.removeItem("jwt");
  };

  return (
    <AuthContext.Provider value={{ token, userInfo, setUserInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

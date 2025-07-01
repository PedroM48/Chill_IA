// src/pages/InicioPage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./InicioPage.css";
import { API_BASE_URL } from "../utils/api";

const InicioPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // 👈 importamos login desde el contexto

  const [formData, setFormData] = useState({
    usuario: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(password);
  };

  const handleLogin = async () => {
    if (!formData.usuario || !formData.password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(
        "La contraseña debe tener al menos 6 caracteres, una letra y un número"
      );
      return;
    }

    try {
      // 1) Llamamos a login(email, password) del contexto
      await login(formData.usuario, formData.password);

      // 2) Esperamos a que el AuthProvider haga el GET /profile y cargue userInfo
      //    (es posible que tardes algo de milisegundos). Luego navegamos:
      navigate("/main");
    } catch (err) {
      setError(err.message || "Error en login");
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="inicio-container">
      <h1 className="inicio-title">Iniciar Sesión</h1>
      <div className="inicio-form">
        <label>
          Usuario (correo)
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            placeholder="ejemplo@aloe.ulima.edu.pe"
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ingresa tu contraseña"
          />
        </label>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <div className="button-group">
          <button onClick={handleLogin} className="inicio-button">
            Ingresar
          </button>
          <button onClick={handleRegister} className="inicio-button registro">
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
};

export default InicioPage;

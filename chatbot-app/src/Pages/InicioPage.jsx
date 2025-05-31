import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InicioPage.css";
import { API_BASE_URL } from "../utils/api";


const InicioPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    usuario: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    setError("");
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@aloe\.ulima\.edu\.pe$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    // Mínimo 6 caracteres, al menos 1 letra y 1 número
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(password);
  };

  const handleLogin = () => {
    if (!formData.usuario || !formData.password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }

    if (!validateEmail(formData.usuario)) {
      setError("El usuario debe ser un correo válido de aloe.ulima.edu.pe");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(
        "La contraseña debe tener al menos 6 caracteres, una letra y un número"
      );
      return;
    }

    fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      email: formData.usuario,
      password: formData.password
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem("token", data.token); // guarda el token
        navigate("/main");
      } else {
        setError(data.message || "Error en login");
      }
    })
    .catch(() => setError("Error de conexión"));;
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

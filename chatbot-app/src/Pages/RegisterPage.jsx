import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import { API_BASE_URL } from "../utils/api";


const distritosLima = [
  "Ate",
  "Barranco",
  "Breña",
  "Carabayllo",
  "Chaclacayo",
  "Chorrillos",
  "Cieneguilla",
  "Comas",
  "El Agustino",
  "Independencia",
  "Jesús María",
  "La Molina",
  "La Victoria",
  "Lima",
  "Lince",
  "Los Olivos",
  "Lurigancho",
  "Lurin",
  "Magdalena del Mar",
  "Miraflores",
  "Pachacamac",
  "Pucusana",
  "Puente Piedra",
  "Pueblo Libre",
  "Puente Piedra",
  "Punta Hermosa",
  "Punta Negra",
  "Rímac",
  "San Bartolo",
  "San Borja",
  "San Isidro",
  "San Juan de Lurigancho",
  "San Juan de Miraflores",
  "San Luis",
  "San Martín de Porres",
  "San Miguel",
  "Santa Anita",
  "Santa María del Mar",
  "Santa Rosa",
  "Santiago de Surco",
  "Surquillo",
  "Villa El Salvador",
  "Villa María del Triunfo",
];

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    edad: "",
    contactoEmergenciaNombre: "",
    contactoEmergenciaCorreo: "",
    contactoEmergenciaWhatsApp: "",
    distrito: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    // Para nombre y apellidos: solo letras y espacios
    if (["nombre", "apellidos", "contactoEmergenciaNombre"].includes(e.target.name)) {
      const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
      if (!regexLetras.test(e.target.value)) {
        // No actualizar estado si no cumple
        return;
      }
    }

    // Para número WhatsApp solo números (input tipo tel ya limita pero validamos)
    if (e.target.name === "contactoEmergenciaWhatsApp") {
      const regexNumeros = /^[0-9\b]*$/;
      if (!regexNumeros.test(e.target.value)) {
        return;
      }
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateEmailUniversitario = (email) => {
    const regex = /^[^\s@]+@aloe\.ulima\.edu\.pe$/;
    return regex.test(email);
  };

  const validateEmailGmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(password);
  };

  const validateEdad = (edad) => {
    const num = Number(edad);
    return !isNaN(num) && num >= 10 && num <= 120;
  };

  const validateWhatsApp = (numero) => {
    const regex = /^9\d{8}$/;
    return regex.test(numero);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = "Este campo es obligatorio";
    if (!formData.apellidos.trim()) newErrors.apellidos = "Este campo es obligatorio";

    if (!formData.email) {
      newErrors.email = "Este campo es obligatorio";
    } else if (!validateEmailUniversitario(formData.email)) {
      newErrors.email = "El correo debe ser de aloe.ulima.edu.pe";
    }

    if (!formData.edad) {
      newErrors.edad = "Este campo es obligatorio";
    } else if (!validateEdad(formData.edad)) {
      newErrors.edad = "Ingresa una edad válida entre 10 y 120";
    }

    if (!formData.contactoEmergenciaNombre.trim())
      newErrors.contactoEmergenciaNombre = "Este campo es obligatorio";

    if (!formData.contactoEmergenciaCorreo) {
      newErrors.contactoEmergenciaCorreo = "Este campo es obligatorio";
    } else if (!validateEmailGmail(formData.contactoEmergenciaCorreo)) {
      newErrors.contactoEmergenciaCorreo = "El correo debe ser un gmail válido";
    }

    if (!formData.contactoEmergenciaWhatsApp) {
      newErrors.contactoEmergenciaWhatsApp = "Este campo es obligatorio";
    } else if (!validateWhatsApp(formData.contactoEmergenciaWhatsApp)) {
      newErrors.contactoEmergenciaWhatsApp = "Ingresa un número de WhatsApp válido (9 dígitos, empieza con 9)";
    }

    if (!formData.distrito) newErrors.distrito = "Este campo es obligatorio";

    if (!formData.password) {
      newErrors.password = "Este campo es obligatorio";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres, una letra y un número";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Este campo es obligatorio";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
        .then(res => res.json())
        .then(data => {
         if (data.userId) {
           alert("Registro exitoso");
           navigate("/");
         } else {
            alert(data.message || "Error en registro");
         }
        })
        .catch(() => alert("Error de conexión"));
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Registro</h2>
      <form onSubmit={handleSubmit} className="register-form" noValidate>
        <label>
          Nombre
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            required
          />
          {errors.nombre && <p className="error">{errors.nombre}</p>}
        </label>

        <label>
          Apellidos
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            placeholder="Apellidos"
            required
          />
          {errors.apellidos && <p className="error">{errors.apellidos}</p>}
        </label>

        <label>
          Correo Universitario (ejemplo@aloe.ulima.edu.pe)
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="ejemplo@aloe.ulima.edu.pe"
            required
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </label>

        <label>
          Edad
          <input
            type="number"
            name="edad"
            value={formData.edad}
            onChange={handleChange}
            placeholder="Edad"
            required
            min={10}
            max={120}
          />
          {errors.edad && <p className="error">{errors.edad}</p>}
        </label>

        <fieldset style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "15px" }}>
          <legend>Contacto de Emergencia</legend>

          <label>
            Nombre
            <input
              type="text"
              name="contactoEmergenciaNombre"
              value={formData.contactoEmergenciaNombre}
              onChange={handleChange}
              placeholder="Nombre"
              required
            />
            {errors.contactoEmergenciaNombre && <p className="error">{errors.contactoEmergenciaNombre}</p>}
          </label>

          <label>
            Correo (gmail)
            <input
              type="email"
              name="contactoEmergenciaCorreo"
              value={formData.contactoEmergenciaCorreo}
              onChange={handleChange}
              placeholder="correo@gmail.com"
              required
            />
            {errors.contactoEmergenciaCorreo && <p className="error">{errors.contactoEmergenciaCorreo}</p>}
          </label>

          <label>
            Número WhatsApp
            <input
              type="tel"
              name="contactoEmergenciaWhatsApp"
              value={formData.contactoEmergenciaWhatsApp}
              onChange={handleChange}
              placeholder="9 dígitos, empieza con 9"
              required
              maxLength={9}
              pattern="[9]{1}[0-9]{8}"
              title="Número de WhatsApp válido (9 dígitos, empieza con 9)"
            />
            {errors.contactoEmergenciaWhatsApp && <p className="error">{errors.contactoEmergenciaWhatsApp}</p>}
          </label>
        </fieldset>

        <label>
          Distrito
          <select
            name="distrito"
            value={formData.distrito}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un distrito</option>
            {distritosLima.map((distrito) => (
              <option key={distrito} value={distrito}>
                {distrito}
              </option>
            ))}
          </select>
          {errors.distrito && <p className="error">{errors.distrito}</p>}
        </label>

        <label>
          Contraseña
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            required
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </label>

        <label>
          Confirmar Contraseña
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirmar contraseña"
            required
          />
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        </label>

        <button type="submit" className="register-button">
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;

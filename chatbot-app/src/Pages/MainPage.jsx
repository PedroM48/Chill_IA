// File: src/components/MainPage.jsx

import React, { useState, useEffect, useContext } from "react";
import botAvatar from "../multimedia/bot.png";
import userAvatar from "../multimedia/user.png";
import "./MainPage.css";
import { AuthContext } from "../context/AuthContext";
import globales from "../data/globales.json";
import mensajesLeve from "../data/ansiedad_leve/mensajesLeve.json";
import solucionesLeve from "../data/ansiedad_leve/solucionesLeve.json";
import mensajesModerada from "../data/ansiedad_moderada/mensajesModerada.json";
import solucionesModerada from "../data/ansiedad_moderada/solucionesModerada.json";
import mensajesSevera from "../data/ansiedad_severa/mensajesSevera.json";
import solucionesSevera from "../data/ansiedad_severa/solucionesSevera.json";
import mensajesNoSintomas from "../data/no_sintomas/mensajesNoSintomas.json";
import mensajesEmergencia from "../data/emergencia/mensajesEmergencia.json";

const flows = {
  ...globales,
  ...mensajesLeve,
  ...solucionesLeve,
  ...mensajesModerada,
  ...solucionesModerada,
  ...mensajesSevera,
  ...solucionesSevera,
  ...mensajesNoSintomas,
  ...mensajesEmergencia,
};

export default function MainPage() {
  const { userInfo } = useContext(AuthContext);
  const INITIAL_ID = "id_1004";

  // ──────────────── Hooks y estado inicial ─────────────────
  const [messages, setMessages] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [typing, setTyping] = useState(false);

  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);

  const [isGadFlow, setIsGadFlow] = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex] = useState(0);
  const [scores, setScores] = useState([]);

  const [currentLevelPrefix, setCurrentLevelPrefix] = useState(null);
  const [solutionVisits, setSolutionVisits] = useState({});
  const [mediaActual, setMediaActual] = useState(null);

  // Helper para búsqueda insensible a mayúsculas
  const normalizar = (str) => (str || "").trim().toLowerCase();

  // ──────────────── 1. Primer mensaje con nombre inyectado ─────────────────
  useEffect(() => {
    if (!userInfo || !userInfo.nombre) return;

    const raw1004 = flows[`mensaje_${INITIAL_ID.split("_")[1]}`];
    const textoConNombre = raw1004.replace("{nombreUsuario}", userInfo.nombre);

    setMessages([{ from: "bot", text: textoConNombre }]);
    setCurrentId(INITIAL_ID);
  }, [userInfo]);

  // ──────────────── 2. Hook solución (nod0s aleatorios) ─────────────────
  const isSolutionNode = (id) => {
    if (!id) return false;
    const num = parseInt(id.split("_")[1], 10);
    return (num >= 210 && num <= 215) || (num >= 310 && num <= 317) || (num >= 410 && num <= 421);
  };

  useEffect(() => {
    if (!isSolutionNode(currentId)) return;

    const base = parseInt(currentId.split("_")[1], 10);
    const opciones = flows[`opciones_${base}`] || [];
    if (!opciones.length) return;

    const visits = solutionVisits[base] || 0;
    setSolutionVisits((prev) => ({ ...prev, [base]: visits + 1 }));

    const randomOpt = opciones[Math.floor(Math.random() * opciones.length)];

    setTyping(true);
    setTimeout(() => {
      if (randomOpt.multimedia && typeof randomOpt.multimedia === "object") {
        setMediaActual(randomOpt.multimedia);
      } else {
        setMediaActual(null);
      }

      setMessages((prev) => [...prev, { from: "bot", text: randomOpt.texto }]);

      if (visits >= 1 && randomOpt.mas_ayuda) {
        const ayudaId = randomOpt.mas_ayuda;
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: flows[`mensaje_${ayudaId.split("_")[1]}`] },
        ]);
        setCurrentId(ayudaId);
      } else {
        setPendingConfirmId(randomOpt.confirmacion);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: flows[`mensaje_1010`] },
        ]);
        setCurrentId("id_1010");
      }

      setTyping(false);
    }, 500);
  }, [currentId]);

  // ──────────────── 3. Prefijo de evaluación (id_1002) ─────────────────
  useEffect(() => {
    if (!currentId || currentId === "id_1002") return;
    const prefix = currentId.split("_")[1].charAt(0);
    setCurrentLevelPrefix(["1", "2", "3", "4", "5"].includes(prefix) ? prefix : null);
  }, [currentId]);

  // ──────────────── 4. Iniciar flujo GAD-7 ─────────────────
  const startGadFlow = () => {
    const raw = flows.opciones_1008;
    const questions = Array.from({ length: 7 }, (_, i) => ({
      id: raw[`id_1008${i + 1}`],
      text: raw[`text_1008${i + 1}`],
      options: raw[`options_1008${i + 1}`],
    }));
    setGadQuestions(questions);
    setGadIndex(0);
    setIsGadFlow(true);
    setMessages((prev) => [...prev, { from: "bot", text: questions[0].text }]);
  };

  // ──────────────── 5. Manejar clic en opciones ─────────────────
  const handleOption = (opt) => {
    const userText = opt.texto || `${opt.emoji} ${opt.label}`;
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setTyping(true);

    if (opt.multimedia && typeof opt.multimedia === "object") {
      setMediaActual(opt.multimedia);
    } else {
      setMediaActual(null);
    }

    if (opt.confirmacion) {
      setPendingConfirmId(opt.confirmacion);
    }

    setTimeout(() => {
      // Confirmación en id_1010
      if (currentId === "id_1010") {
        if (pendingConfirmId) {
          setMessages((prev) => [
            ...prev,
            { from: "bot", text: flows[`mensaje_${pendingConfirmId.split("_")[1]}`] },
          ]);
          setCurrentId(pendingConfirmId);
          setPendingConfirmId(null);
        } else {
          setMessages((prev) => [...prev, { from: "bot", text: "¡Gracias!" }]);
        }
        setTyping(false);
        return;
      }

      // Evaluación en id_1002
      if (currentId === "id_1002") {
        let nextId;
        const txt = opt.texto;
        if (currentLevelPrefix === "1") {
          if (["🫠 Todavía me cuesta", "🤷 Igual que antes"].includes(txt)) nextId = "id_203";
          else if (txt === "😌 Un poco mejor") nextId = "id_202";
          else nextId = "id_201";
        } else if (currentLevelPrefix === "2") {
          if (["🫠 Todavía me cuesta", "🤷 Igual que antes"].includes(txt)) nextId = "id_303";
          else if (txt === "😌 Un poco mejor") nextId = "id_302";
          else nextId = "id_301";
        } else if (currentLevelPrefix === "3") {
          if (["🫠 Todavía me cuesta", "🤷 Igual que antes"].includes(txt)) nextId = "id_403";
          else if (txt === "😌 Un poco mejor") nextId = "id_402";
          else nextId = "id_401";
        }
        if (nextId) {
          setMessages((prev) => [
            ...prev,
            { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] },
          ]);
          setCurrentId(nextId);
        }
        setTyping(false);
        return;
      }

      // Inicio de flujo GAD-7 (id_1008)
      if (opt.siguiente === "id_1008") {
        setMessages((prev) => [...prev, { from: "bot", text: flows.mensaje_1008 }]);
        startGadFlow();
        setTyping(false);
        return;
      }

      // Dentro de handleOption, después de detectar opt.siguiente:
if (opt.siguiente === "id_503") {
  // 1) Hacer POST al backend
  fetch("http://localhost:4000/api/helpEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt")}`, // o "token"
    },
  })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "✅ ¡Listo! He enviado el mensaje a tu contacto. 💌" },
      ]);
    })
    .catch(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "😕 No pude enviar el correo. Inténtalo de nuevo más tarde." },
      ]);
    });

  setCurrentId("id_1010");        // o a donde quieras volver
  setTyping(false);
  return;
}


      // Preguntas GAD-7 en progreso
      if (isGadFlow) {
        const newScores = [...scores, opt.score];
        setScores(newScores);
        const nextIdx = gadIndex + 1;
        if (nextIdx < gadQuestions.length) {
          setMessages((prev) => [
            ...prev,
            { from: "bot", text: gadQuestions[nextIdx].text },
          ]);
          setGadIndex(nextIdx);
        } else {
          const total = newScores.reduce((a, b) => a + b, 0);
          let nextId;
          if (total <= 4) nextId = "id_100";
          else if (total <= 9) nextId = "id_200";
          else if (total <= 14) nextId = "id_300";
          else nextId = "id_400";

          setMessages((prev) => [
            ...prev,
            { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] },
          ]);
          setCurrentId(nextId);
          setIsGadFlow(false);
          setScores([]);
        }
        setTyping(false);
        return;
      }

      // Flujos normales (avanzar por opt.siguiente)
      if (opt.siguiente) {
        const nextId = opt.siguiente;

        // Bloque especial para id_504
        if (nextId === "id_504") {
          const rawMsg = flows.mensaje_504;
          const ubicaciones = flows.ubicaciones_504 || {};
          const mapa = Object.fromEntries(
            Object.entries(ubicaciones).map(([k, v]) => [normalizar(k), v])
          );
          const distritoKey = normalizar(userInfo.distrito);
          const texto =
            mapa[distritoKey] || "No se encontraron contactos para tu ubicación.";
          const finalMsg = rawMsg.replace("{ubicaciones}", texto);

          setMessages((prev) => [...prev, { from: "bot", text: finalMsg }]);
          setCurrentId(nextId);
          setTyping(false);
          return;
        }

        // Si no es id_504, flujo normal
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] },
        ]);
        setCurrentId(nextId);
      } else {
        setMessages((prev) => [...prev, { from: "bot", text: "¡Hasta luego!" }]);
      }
      setTyping(false);
    }, 1500);
  };

  // ──────────────── 6. Renderizar opciones ─────────────────
  const renderOptions = () => {
    // Flujo GAD-7
    if (isGadFlow) {
      return (
        <div className="options-area">
          {gadQuestions[gadIndex].options.map((o, i) => (
            <button key={i} onClick={() => handleOption(o)} className="option-btn">
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      );
    }

    // Confirmación (id_1010) o evaluación (id_1002)
    if (["id_1010", "id_1002"].includes(currentId)) {
      const opts = flows[`opciones_${currentId.split("_")[1]}`] || [];
      return (
        <div className="options-area">
          {opts.map((o, i) => (
            <button key={i} onClick={() => handleOption(o)} className="option-btn">
              {o.texto}
            </button>
          ))}
        </div>
      );
    }

    // Nodo de solución
    if (isSolutionNode(currentId)) {
      return null;
    }

    // Flujo normal
    const opciones = flows[`opciones_${currentId.split("_")[1]}`] || [];
    return (
      <div className="options-area">
        {opciones.map((opt, i) => (
          <button key={i} onClick={() => handleOption(opt)} className="option-btn">
            {opt.texto}
          </button>
        ))}
      </div>
    );
  };

  // ──────────────── 7. Guard para mostrar loader ─────────────────
  if (!userInfo || !userInfo.distrito) {
    return (
      <div className="chat-container">
        <h1>CHILL IA 🤙</h1>
        <div className="chat-box">
          <div className="message-row bot">
            <img src={botAvatar} className="avatar" alt="Bot" />
            <div className="bubble bot">
              <span>Cargando tu perfil…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────── 8. Render final del chat ─────────────────
  return (
    <div className="chat-container">
      <h1>CHILL IA 🤙</h1>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.from}`}>
            <img
              src={msg.from === "bot" ? botAvatar : userAvatar}
              className="avatar"
              alt=""
            />
            <div className={`bubble ${msg.from}`}>
              {msg.from === "bot" && i === messages.length - 1 && mediaActual && (
                <div className="media-area">
                  {mediaActual.tipo === "audio" && (
                    <audio controls>
                      <source
                        src={`/multimedia/${mediaActual.archivo}`}
                        type="audio/mpeg"
                      />
                      Tu navegador no soporta el audio.
                    </audio>
                  )}
                  {mediaActual.tipo === "imagen" && (
                    <img
                      src={`/multimedia/${mediaActual.archivo}`}
                      alt="Visual"
                      className="media-img"
                    />
                  )}
                  {mediaActual.tipo === "video" && (
                    <video controls width="100%">
                      <source
                        src={`/multimedia/${mediaActual.archivo}`}
                        type="video/mp4"
                      />
                      Tu navegador no soporta el video.
                    </video>
                  )}
                </div>
              )}
              <span>{msg.text}</span>
              {i === messages.length - 1 && !typing && renderOptions()}
            </div>
          </div>
        ))}

        {typing && (
          <div className="message-row bot">
            <img src={botAvatar} className="avatar" alt="Bot" />
            <div className="bubble bot typing">
              <span>Chill IA está escribiendo...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

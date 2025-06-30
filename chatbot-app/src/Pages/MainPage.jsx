
import React, { useState, useEffect, useContext } from "react";
import botAvatar from "../multimedia/bot.png";
import userAvatar from "../multimedia/user.png";
import "./MainPage.css";
import { AuthContext } from "../context/AuthContext";

// ─── Conversational flows ──────────────────────────────────────────
import globales from "../data/globales.json";
// Leve
import mensajesLeve from "../data/ansiedad_leve/mensajesLeve.json";
import solucionesLeve from "../data/ansiedad_leve/solucionesLeve.json";
// Moderada
import mensajesModerada from "../data/ansiedad_moderada/mensajesModerada.json";
import solucionesModerada from "../data/ansiedad_moderada/solucionesModerada.json";
// Severa
import mensajesSevera from "../data/ansiedad_severa/mensajesSevera.json";
import solucionesSevera from "../data/ansiedad_severa/solucionesSevera.json";
// Otros
import mensajesNoSintomas from "../data/no_sintomas/mensajesNoSintomas.json";
import mensajesEmergencia from "../data/emergencia/mensajesEmergencia.json";

const API_URL = "http://localhost:4000/api";

// Combinar todos los flujos en un solo objeto
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
  const token = localStorage.getItem("jwt");
  const INITIAL_ID = "id_1004";

  // ─── Chat & Analytics ───────────────────────────────────────────
  const [chatSessionId, setChatSessionId] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // ─── Chat flow ──────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [typing, setTyping] = useState(false);

  // ─── GAD-7 ──────────────────────────────────────────────────────
  const [isGadFlow, setIsGadFlow] = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex] = useState(0);
  const [scores, setScores] = useState([]);

  // ─── Otros estados ─────────────────────────────────────────────
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const [mediaActual, setMediaActual] = useState(null);
  const [solutionVisits, setSolutionVisits] = useState({});
  const [currentLevelPrefix, setCurrentLevelPrefix] = useState(null); // 2=leve, 3=moderada, 4=severa
  const normalizar = (s = "") => s.trim().toLowerCase();
  // ─── Helpers ───────────────────────────────────────────────────
  const logEvent = (event, metadata = {}) => {
    if (!chatSessionId) return;
    fetch(`${API_URL}/analytics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event, chatSessionId, metadata }),
    }).catch((err) => console.warn("Error logging event", err));
  };

  const parseBotText = (rawText) =>
  rawText.replace("{nombreUsuario}", userInfo?.nombre || "");
  
  // ─── 1. Primer mensaje ─────────────────────────────────────────
  useEffect(() => {
    if (!userInfo?.nombre) return;
    const saludo = parseBotText(flows[`mensaje_${INITIAL_ID.split("_")[1]}`]);
    setMessages([{ from: "bot", text: saludo }]);
    setCurrentId(INITIAL_ID);
  }, [userInfo]);

  // ─── 2. Crear sesión en backend ────────────────────────────────
  useEffect(() => {
    if (!userInfo || hasStarted) return;
    fetch(`${API_URL}/chat/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then(({ chatSessionId }) => {
        setChatSessionId(chatSessionId);
        setHasStarted(true);
      })
      .catch((e) => console.error("Error starting chat", e));
  }, [userInfo, hasStarted]);

  // ─── 3. Nodos-solución (leve 210-215 · moderada 310-317 · severa 410-421)
  const isSolutionNode = (id) => {
    if (!id) return false;
    const n = parseInt(id.split("_")[1], 10);
    return (
      (n >= 210 && n <= 215) || // leve
      (n >= 310 && n <= 317) || // moderada
      (n >= 410 && n <= 421) // severa
    );
  };

  useEffect(() => {
    if (!isSolutionNode(currentId)) return;
    const base = parseInt(currentId.split("_")[1], 10);
    const opciones = flows[`opciones_${base}`] || [];
    if (!opciones.length) return;

    const visits = solutionVisits[base] || 0;
    setSolutionVisits((prev) => ({ ...prev, [base]: visits + 1 }));

    const choice = opciones[Math.floor(Math.random() * opciones.length)];
    setTyping(true);

    setTimeout(() => {
      setMediaActual(choice.multimedia || null);
      setMessages((prev) => [...prev, { from: "bot", text: choice.texto }]);

      if (visits >= 1 && choice.mas_ayuda) {
        const nextId = choice.mas_ayuda;
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] },
        ]);
        setCurrentId(nextId);
      } else {
        setPendingConfirmId(choice.confirmacion);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: flows["mensaje_1010"] },
        ]);
        setCurrentId("id_1010");
      }
      setTyping(false);
    }, 500);
  }, [currentId]);

  // ─── 4. Prefijo de nivel (2·3·4) ───────────────────────────────
  useEffect(() => {
    if (!currentId || ["id_1002", "id_1010"].includes(currentId)) return;
    const p = currentId.split("_")[1].charAt(0);
    setCurrentLevelPrefix(["1", "2", "3", "4", "5"].includes(p) ? p : null);
  }, [currentId]);

  // ─── 5. Iniciar GAD-7 ──────────────────────────────────────────
  const startGadFlow = () => {
    const raw = flows.opciones_1008;
    const qs = Array.from({ length: 7 }, (_, i) => ({
      id: raw[`id_1008${i + 1}`],
      text: raw[`text_1008${i + 1}`],
      options: raw[`options_1008${i + 1}`],
    }));
    setGadQuestions(qs);
    setGadIndex(0);
    setIsGadFlow(true);
    setMessages((prev) => [...prev, { from: "bot", text: qs[0].text }]);
  };

  // ─── 6. Manejar selección de opciones ──────────────────────────
  const handleOption = (opt) => {
    logEvent("option_selected", {
      questionId: currentId,
      optionId: opt.id || null,
    });

    const txtUsuario = opt.texto || `${opt.emoji} ${opt.label}`;
    setMessages((prev) => [...prev, { from: "user", text: txtUsuario }]);
    setTyping(true);
    setMediaActual(opt.multimedia || null);
    if (opt.confirmacion) setPendingConfirmId(opt.confirmacion);

    setTimeout(() => {
      /* ── 6.1 Evaluación manual (id_1002) ─────────────────────── */
      if (currentId === "id_1002") {
        let nextId;
        const txt = opt.texto;
        if (currentLevelPrefix === "2") {
          // LEVE 201-203
          if (["🫠 Todavía me cuesta", "🤷 Igual que antes"].includes(txt))
            nextId = "id_203";
          else if (txt === "😌 Un poco mejor") nextId = "id_202";
          else nextId = "id_201";
        } else if (currentLevelPrefix === "3") {
          // MODERADA 301-303
          if (["🫠 Todavía me cuesta", "🤷 Igual que antes"].includes(txt))
            nextId = "id_303";
          else if (txt === "😌 Un poco mejor") nextId = "id_302";
          else nextId = "id_301";
        } else if (currentLevelPrefix === "4") {
          // SEVERA 401-403
          if (["🫠 Todavía me cuesta", "🤷 Igual que antes"].includes(txt))
            nextId = "id_403";
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

      /* ── 6.2 Confirmación (id_1010) ─────────────────────────── */
      if (currentId === "id_1010") {
        if (pendingConfirmId) {
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: flows[`mensaje_${pendingConfirmId.split("_")[1]}`],
            },
          ]);
          setCurrentId(pendingConfirmId);
          setPendingConfirmId(null);
        } else {
          setMessages((prev) => [...prev, { from: "bot", text: "¡Gracias!" }]);
        }
        setTyping(false);
        return;
      }

      /* ── 6.3 Inicio GAD-7 ───────────────────────────────────── */
      if (opt.siguiente === "id_1008") {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: flows.mensaje_1008 },
        ]);
        startGadFlow();
        setTyping(false);
        return;
      }

      if (opt.siguiente === "id_506") {
    // 1) Hacer POST al backend
  fetch("http://localhost:4000/api/helpEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt")}`, // o "token"
    },
  })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then(() => {Add commentMore actions
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

  setCurrentId("id_1009");        // o a donde quieras volver
  setTyping(false);
  return;
}

      
      /* ── 6.4 Progreso GAD-7 ─────────────────────────────────── */
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
          // Fin del test → guardar
          const total = newScores.reduce((a, b) => a + b, 0);
          fetch(`${API_URL}/gad`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ score: total, responses: newScores }),
          }).catch(() => console.warn("Error guardando GAD"));
          logEvent("gad_completed", { score: total, responses: newScores });

          // Ruta inicial por nivel
          const nid =
            total <= 4
              ? "id_100"
              : total <= 9
              ? "id_200"
              : total <= 14
              ? "id_300"
              : "id_400";
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: flows[`mensaje_${nid.split("_")[1]}`],
            },
          ]);
          setCurrentId(nid);
          setIsGadFlow(false);
          setScores([]);
        }
        setTyping(false);
        return;
      }

      /* ── 6.5 Emergencia ────────────────────────────────────── */
      if (opt.siguiente === "id_500") logEvent("emergency_reached");

      /* ── 6.6 Flujo normal / cierre ─────────────────────────── */
      if (opt.siguiente) {
        const nextId = opt.siguiente;
          if (nextId === "id_504") {
    const rawMsg = flows.mensaje_504;
    const ubicaciones = flows.ubicaciones_504 || {};
    // normalizar claves y distrito
    const mapa = Object.fromEntries(
      Object.entries(ubicaciones).map(([k, v]) => [normalizar(k), v])
    );
    const distritoKey = normalizar(userInfo.distrito);
    const texto =
      mapa[distritoKey] ||
      "No se encontraron contactos para tu ubicación.";
    // reemplaza placeholder y también nombreUsuario si quieres
    const finalMsg = parseBotText(
     rawMsg.replace("{ubicaciones}", texto)
    );

    setMessages((prev) => [
      ...prev,
      { from: "bot", text: finalMsg }
    ]);
    setCurrentId(nextId);
    setTyping(false);
    return;
    }
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: flows[`mensaje_${opt.siguiente.split("_")[1]}`],
          },
        ]);
        setCurrentId(opt.siguiente);
      } else {
        setMessages((prev) => [...prev, { from: "bot", text: "¡Hasta luego!" }]);
        if (!hasEnded && chatSessionId) {
          fetch(`${API_URL}/chat/end`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ chatSessionId }),
          });
          logEvent("chat_ended");
          setHasEnded(true);
        }
      }
      setTyping(false);
    }, 1500);
  };

  // ─── 7. Render de opciones ──────────────────────────────────────
  const renderOptions = () => {
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

    if (isSolutionNode(currentId)) return null;

    const opts = flows[`opciones_${currentId?.split("_")[1]}`] || [];
    return (
      <div className="options-area">
        {opts.map((o, i) => (
          <button key={i} onClick={() => handleOption(o)} className="option-btn">
            {o.texto}
          </button>
        ))}
      </div>
    );
  };


  // ─── 9. Chat UI ────────────────────────────────────────────────
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
              {/* Multimedia */}
              {msg.from === "bot" &&
                i === messages.length - 1 &&
                mediaActual && (
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
                        Tu navegador no soporta el vídeo.
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

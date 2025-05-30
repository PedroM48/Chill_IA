import React, { useState, useEffect } from "react";
import globales from "../data/globales.json";
import botAvatar from "../multimedia/bot.png";
import userAvatar from "../multimedia/user.png";
import mensajesLeve from "../data/ansiedad_leve/mensajesLeve.json";
import solucionesLeve from "../data/ansiedad_leve/solucionesLeve.json";
import mensajesModerada from "../data/ansiedad_leve/mensajesLeve.json";
import solucionesModerada from "../data/ansiedad_leve/solucionesLeve.json";
import mensajesSevera from "../data/ansiedad_leve/mensajesLeve.json";
import solucionesSevera from "../data/ansiedad_leve/solucionesLeve.json";
import "./MainPage.css";

/**
 * Fusionamos todos los flujos en un único objeto para buscarlos por ID.
 */
const flows = {
  ...globales,
  ...mensajesLeve,
  ...solucionesLeve,
  ...mensajesModerada,
  ...solucionesModerada,
  ...mensajesSevera,
  ...solucionesSevera,
};

export default function MainPage() {
  const INITIAL_ID = "id_1004";

  /** MENSAJES que se muestran en la UI */
  const [messages, setMessages] = useState([
    { from: "bot", text: flows[`mensaje_${INITIAL_ID.split("_")[1]}`] },
  ]);

  /** CONTROL DE ESTADO */
  const [currentId, setCurrentId] = useState(INITIAL_ID);
  const [typing, setTyping]   = useState(false);
  const [nextAfterEval, setNextAfterEval] = useState(null);
  const [leveScores, setLeveScores]       = useState([]);

  /** GAD‑7 */
  const [isGadFlow, setIsGadFlow]       = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex]         = useState(0);
  const [scores, setScores]             = useState([]);

  /** MULTIMEDIA ACTUAL */
  const [mediaActual, setMediaActual]   = useState(null);

  /**
   * Al cambiar de ID mostramos automáticamente los mensajes encadenados con
   * `nextAfterEval` (ramas de decisión internas en tu JSON).
   */
  useEffect(() => {
    if (currentId !== "id_1002") return;  
    const step     = currentId.split("_")[1];
    const opciones = flows[`opciones_${step}`] || [];

    if (opciones.length && opciones[0].nextAfterEval) {
      const chosen = opciones[Math.floor(Math.random() * opciones.length)];
      setTyping(true);
      setNextAfterEval(chosen.nextAfterEval);

      setTimeout(() => {
        setMessages(prev => [...prev, { from: "bot", text: chosen.texto }]);

        const evalId = chosen.siguiente;
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${evalId.split("_")[1]}`] }]);
        setCurrentId(evalId);
        setTyping(false);
      }, 2000);
    }
  }, [currentId]);

  /** Inicializa flujo GAD‑7 */
  const startGadFlow = () => {
    const raw = flows.opciones_1008;
    const questions = Array.from({ length: 7 }, (_, i) => ({
      id:      raw[`id_1008${i + 1}`],
      text:    raw[`text_1008${i + 1}`],
      options: raw[`options_1008${i + 1}`],
    }));

    setGadQuestions(questions);
    setGadIndex(0);
    setIsGadFlow(true);
    setMessages(prev => [...prev, { from: "bot", text: questions[0].text }]);
  };

  /**
   * Maneja clic en opción del usuario
   */
  const handleOption = (opt) => {
    const userText = opt.texto || `${opt.emoji} ${opt.label}`;
    setMessages(prev => [...prev, { from: "user", text: userText }]);

    // 🔹 Actualiza multimedia (imagen / audio / video)
    if (typeof opt.multimedia === "object" && opt.multimedia !== null) {
      setMediaActual(opt.multimedia);
    } else {
      setMediaActual(null);
    }

    console.log("Multimedia recibida:", opt.multimedia);


    // Guarda nextAfterEval si aplica
    if (opt.nextAfterEval) setNextAfterEval(opt.nextAfterEval);

    // Entrar en GAD‑7
    if (opt.siguiente === "id_1008") {
      setTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { from: "bot", text: flows.mensaje_1008 }]);
        startGadFlow();
        setTyping(false);
      }, 3000); 
      return;
    }

    setTyping(true);
    setTimeout(() => {
      // -------------- GAD‑7 EN PROGRESO --------------
      if (isGadFlow) {
        const updated = [...scores, opt.score];
        setScores(updated);

        const nextIdx = gadIndex + 1;
        if (nextIdx < gadQuestions.length) {
          setMessages(prev => [...prev, { from: "bot", text: gadQuestions[nextIdx].text }]);
          setGadIndex(nextIdx);
        } else {
          const total = updated.reduce((s, n) => s + n, 0);
          let nextId;
          if (total <= 4)       nextId = "id_500";
          else if (total <= 9)  nextId = "id_200";
          else if (total <= 14) nextId = "id_300";
          else                  nextId = "id_400";

          setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] }]);
          setCurrentId(nextId);
          setIsGadFlow(false);
          setScores([]);
        }
        setTyping(false);
        return;
      }

      // -------------- FLUJO NORMAL --------------
      if (!opt.siguiente) {
        setMessages(prev => [...prev, { from: "bot", text: "¡Hasta luego! Hasta la próxima." }]);
        setTyping(false);
        return;
      }

      const rawNext = opt.siguiente === "{{nextAfterEval}}" && nextAfterEval
        ? nextAfterEval
        : opt.siguiente;

      // Nivel de ansiedad leve: promedia puntaje cada 3 preguntas
      if (opt.score !== undefined) {
        const newScores = [...leveScores, opt.score];
        setLeveScores(newScores);
        if (newScores.length === 3) {
          const avg = newScores.reduce((a, b) => a + b, 0) / 3;
          const evalId = avg > 3 ? "id_201" : avg > 2 ? "id_202" : "id_203";
          setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${evalId.split("_")[1]}`] }]);
          setCurrentId(evalId);
          setLeveScores([]);
          setTyping(false);
          return;
        }
      }

      setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${rawNext.split("_")[1]}`] }]);
      setCurrentId(rawNext);
      setTyping(false);
    }, 2000);
  };

  /** Renderiza botones de opciones */
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

    const opciones = flows[`opciones_${currentId.split("_")[1]}`] || [];
    if (!opciones.length) return null; // se manejará en useEffect

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

  console.log("MEDIA ACTUAL:", mediaActual);


  return (
    <div className="chat-container">
      <h1>CHILL IA 🤙</h1>
      <div className="chat-box">
        
        {messages.map((msg, i) => (
  <div key={i} className={`message-row ${msg.from}`}>
    <img src={msg.from === 'bot' ? botAvatar : userAvatar} className="avatar" alt="" />
    <div className={`bubble ${msg.from}`}>

      {msg.from === "bot" && i === messages.length - 1 && mediaActual && (
        <div className="media-area">
          {mediaActual.tipo === "audio" && (
            <audio controls>
              <source src={`/multimedia/${mediaActual.archivo}`} type="audio/mpeg" />
              Tu navegador no soporta el audio.
            </audio>
          )}
          {mediaActual.tipo === "imagen" && (
            <img src={`/multimedia/${mediaActual.archivo}`} alt="Visual" className="media-img" />
          )}
          {mediaActual.tipo === "video" && (
            <video controls width="100%">
              <source src={`/multimedia/${mediaActual.archivo}`} type="video/mp4" />
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

        {typing && (<div className="message-row bot"><img src={botAvatar} className="avatar" alt="" /><div className="bubble bot typing"><span>Chill IA está escribiendo...</span></div></div>)}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import globales from "../data/globales.json";
import botAvatar from "../multimedia/bot.png"; 
import userAvatar from "../multimedia/user.png";
import mensajesLeve from "../data/ansiedad_leve/mensajesLeve.json";
import solucionesLeve from "../data/ansiedad_leve/solucionesLeve.json";
import "./MainPage.css";

// Combina ambos flujos de mensajes
const flows = { 
    ...globales, 
    ...mensajesLeve,
    ...solucionesLeve,
  };

export default function MainPage() {
  const INITIAL_ID = "id_1004";

  // Estados generales
  const [messages, setMessages] = useState([
    { from: "bot", text: flows[`mensaje_${INITIAL_ID.split("_")[1]}`] }
  ]);
  const [currentId, setCurrentId] = useState(INITIAL_ID);
  const [typing, setTyping] = useState(false);

  // Estados para flujo GAD-7
  const [isGadFlow, setIsGadFlow] = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex] = useState(0);
  const [scores, setScores] = useState([]);

  // Inicia flujo GAD-7 extrayendo preguntas del JSON
  const startGadFlow = () => {
    const raw = flows.opciones_1008;
    const questions = [];
    for (let i = 1; i <= 7; i++) {
      questions.push({
        id: raw[`id_1008${i}`],
        text: raw[`text_1008${i}`],
        options: raw[`options_1008${i}`]
      });
    }
    setGadQuestions(questions);
    setGadIndex(0);
    setIsGadFlow(true);
    // Muestra la primera pregunta tras intro
    setMessages(prev => [...prev, { from: "bot", text: questions[0].text }]);
  };

  // Maneja selección de opción (flujo normal o GAD-7)
  const handleOption = (opt) => {
    // Añade respuesta del usuario
    const userText = opt.texto || `${opt.emoji} ${opt.label}`;
    setMessages(prev => [...prev, { from: "user", text: userText }]);

    // Entrada a GAD-7
    if (opt.siguiente === "id_1008") {
      setTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { from: "bot", text: flows.mensaje_1008 }]);
        startGadFlow();
        setTyping(false);
      }, 3000);
      return;
    }

    // Simula typing para normal o GAD-7
    setTyping(true);
    setTimeout(() => {
      if (isGadFlow) {
        // Registra score actual
        setScores(prev => [...prev, opt.score]);
        const nextIdx = gadIndex + 1;
        if (nextIdx < gadQuestions.length) {
          const nextQ = gadQuestions[nextIdx];
          setMessages(prev => [...prev, { from: "bot", text: nextQ.text }]);
          setGadIndex(nextIdx);
        } else {
          // Fin GAD-7: mensaje final y next flow
          const finalMsg =
            "Listo, ya tengo una mejor idea de cómo han estado tus días últimamente. Y tranqui, nada de lo que sientes está mal 😉.";
          setMessages(prev => [...prev, { from: "bot", text: finalMsg }]);
          // Avanza al nuevo flujo (id_200)
          const nextId = "id_200";
          const nextMsgKey = `mensaje_${nextId.split("_")[1]}`;
          setMessages(prev => [...prev, { from: "bot", text: flows[nextMsgKey] }]);
          setCurrentId(nextId);
          setIsGadFlow(false);
        }
      } else {
        // Flujo normal
        if (opt.siguiente) {
          const nextId = opt.siguiente;
          const msgKey = `mensaje_${nextId.split("_")[1]}`;
          setMessages(prev => [...prev, { from: "bot", text: flows[msgKey] }]);
          setCurrentId(nextId);
        } else {
          setMessages(prev => [...prev, { from: "bot", text: "¡Hasta luego! Hasta la próxima." }]);
        }
      }
      setTyping(false);
    }, 3000);
  };

  // Renderiza opciones según estado
  const renderOptions = () => {
    if (isGadFlow) {
      const q = gadQuestions[gadIndex];
      return (
        <div className="options-area">
          {q.options.map((o, i) => (
            <button key={i} onClick={() => handleOption(o)} className="option-btn">
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      );
    }
    const idNum = currentId.split("_")[1];
    const opc = flows[`opciones_${idNum}`] || [];
    return (
      <div className="options-area">
        {opc.map((opt, i) => (
          <button key={i} onClick={() => handleOption(opt)} className="option-btn">
            {opt.texto}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <h1>CHILL IA 🤙</h1>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.from}`}>
            <img
              src={msg.from === 'bot' ? botAvatar : userAvatar}
              className="avatar"
              alt={msg.from === 'bot' ? 'Bot' : 'Usuario'}
            />
            <div className={`bubble ${msg.from}`}>
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

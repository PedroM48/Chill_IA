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

// Unificamos todos los mensajes y opciones en un solo objeto de flujo
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
  const [messages, setMessages] = useState([
    { from: "bot", text: flows[`mensaje_${INITIAL_ID.split("_")[1]}`] }
  ]);
  const [currentId, setCurrentId] = useState(INITIAL_ID);
  const [typing, setTyping] = useState(false);
  const [nextAfterEval, setNextAfterEval] = useState(null);
  const [leveScores, setLeveScores] = useState([]);
  const [isGadFlow, setIsGadFlow] = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [mediaActual, setMediaActual] = useState(null);

  
  
  useEffect(() => {
    const step = currentId.split("_")[1];
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
    setMessages(prev => [...prev, { from: "bot", text: questions[0].text }]);
  };

  const handleOption = (opt) => {
  const userText = opt.texto || `${opt.emoji} ${opt.label}`;
  setMessages(prev => [...prev, { from: "user", text: userText }]);

  // ⬇️ Nuevo: guarda el multimedia si existe
  if (opt.multimedia) {
    setMediaActual(opt.multimedia);
  } else {
    setMediaActual(null);
  }

  if (opt.nextAfterEval) setNextAfterEval(opt.nextAfterEval);
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
    if (isGadFlow) {
      const updated = [...scores, opt.score];
      setScores(updated);
      const nextIdx = gadIndex + 1;
      if (nextIdx < gadQuestions.length) {
        setMessages(prev => [...prev, { from: "bot", text: gadQuestions[nextIdx].text }]);
        setGadIndex(nextIdx);
      } else {
        const total = updated.reduce((sum, s) => sum + s, 0);
        let nextId;
        if (total <= 4) nextId = "id_500";
        else if (total <= 9) nextId = "id_200";
        else if (total <= 14) nextId = "id_300";
        else nextId = "id_400";
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] }]);
        setCurrentId(nextId);
        setIsGadFlow(false);
        setScores([]);
      }
    } else {
      if (opt.siguiente) {
        let rawNext = opt.siguiente === "{{nextAfterEval}}" && nextAfterEval ? nextAfterEval : opt.siguiente;
        if (opt.score !== undefined) {
          const newScores = [...leveScores, opt.score];
          setLeveScores(newScores);
          if (newScores.length === 3) {
            const avg = newScores.reduce((a, b) => a + b, 0) / 3;
            let evalId;
            if (avg > 3) evalId = "id_201";
            else if (avg > 2) evalId = "id_202";
            else evalId = "id_203";
            setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${evalId.split("_")[1]}`] }]);
            setCurrentId(evalId);
            setLeveScores([]);
            setTyping(false);
            return;
          }
        }
        

        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${rawNext.split("_")[1]}`] }]);
        setCurrentId(rawNext);
      } else {
        setMessages(prev => [...prev, { from: "bot", text: "¡Hasta luego! Hasta la próxima." }]);
      }
    }
    setTyping(false);
  }, 3000);
};


  const renderOptions = () => {
    if (isGadFlow) {
      return (
        <div className="options-area">
          {gadQuestions[gadIndex].options.map((o, i) => (
            <button key={i} onClick={() => handleOption(o)} className="option-btn">{o.emoji} {o.label}</button>
          ))}
        </div>
      );
    }
    const opciones = flows[`opciones_${currentId.split("_")[1]}`] || [];
    if (opciones.length && opciones[0].nextAfterEval) return null;
    return (
      <div className="options-area">
        {opciones.map((opt, i) => (
          <button key={i} onClick={() => handleOption(opt)} className="option-btn">{opt.texto}</button>
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
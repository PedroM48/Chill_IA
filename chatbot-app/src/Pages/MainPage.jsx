import React, { useState, useEffect } from "react";
import botAvatar from "../multimedia/bot.png";
import userAvatar from "../multimedia/user.png";
import "./MainPage.css";

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
  const INITIAL_ID = "id_1004";
  const [messages, setMessages] = useState([
    { from: "bot", text: flows[`mensaje_${INITIAL_ID.split("_")[1]}`] }
  ]);
  const [currentId, setCurrentId] = useState(INITIAL_ID);
  const [typing, setTyping] = useState(false);

  // GAD flow state
  const [isGadFlow, setIsGadFlow] = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex] = useState(0);
  const [scores, setScores] = useState([]);

  // Confirm and level state
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const [currentLevelPrefix, setCurrentLevelPrefix] = useState(null);

  // Track visits to solution nodes
  const [solutionVisits, setSolutionVisits] = useState({});

  // Multimedia state
  const [mediaActual, setMediaActual] = useState(null);

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

  const isSolutionNode = id => {
    if (!id) return false;
    const num = parseInt(id.split("_")[1], 10);
    return (num >= 210 && num <= 215) || (num >= 310 && num <= 317) || (num >= 410 && num <= 421);
  };

  // Maintain level prefix except during evaluation node
  useEffect(() => {
    if (currentId === "id_1002") return;
    const prefix = currentId.split("_")[1].charAt(0);
    setCurrentLevelPrefix(["1","2","3","4","5"].includes(prefix) ? prefix : null);
  }, [currentId]);

  // Auto-handle solution nodes
  useEffect(() => {
    if (!isSolutionNode(currentId)) return;
    const base = parseInt(currentId.split("_")[1], 10);
    const opciones = flows[`opciones_${base}`] || [];
    if (!opciones.length) return;

    // manage visit count
    const visits = solutionVisits[base] || 0;
    const updatedVisits = { ...solutionVisits, [base]: visits + 1 };
    setSolutionVisits(updatedVisits);

    // choose random option
    const randomOpt = opciones[Math.floor(Math.random() * opciones.length)];

    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { from: "bot", text: randomOpt.texto }]);

      if (visits >= 1 && randomOpt.mas_ayuda) {
        const ayudaId = randomOpt.mas_ayuda;
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${ayudaId.split("_")[1]}`] }]);
        setCurrentId(ayudaId);
      } else {
        setPendingConfirmId(randomOpt.confirmacion);
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_1010`] }]);
        setCurrentId("id_1010");
      }
      setTyping(false);
    }, 500);
  }, [currentId]);

  const handleOption = opt => {
    const userText = opt.texto || `${opt.emoji} ${opt.label}`;
    setMessages(prev => [...prev, { from: "user", text: userText }]);
    setTyping(true);

    // multimedia
    if (typeof opt.multimedia === "object" && opt.multimedia !== null) {
      setMediaActual(opt.multimedia);
    } else {
      setMediaActual(null);
    }

    setTimeout(() => {
      // confirmation "Si" on id_1010
      if (currentId === "id_1010") {
        if (pendingConfirmId) {
          setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${pendingConfirmId.split("_")[1]}`] }]);
          setCurrentId(pendingConfirmId);
          setPendingConfirmId(null);
        } else {
          setMessages(prev => [...prev, { from: "bot", text: "¡Gracias!" }]);
        }
        setTyping(false);
        return;
      }

      // evaluation responses (id_1002)
      if (currentId === "id_1002") {
        let nextId;
        const txt = opt.texto;
        if (currentLevelPrefix === "1") {
          if (["🫠 Todavía me cuesta","🤷 Igual que antes"].includes(txt)) nextId = "id_203";
          else if (txt === "😌 Un poco mejor") nextId = "id_202";
          else nextId = "id_201";
        } else if (currentLevelPrefix === "2") {
          if (["🫠 Todavía me cuesta","🤷 Igual que antes"].includes(txt)) nextId = "id_303";
          else if (txt === "😌 Un poco mejor") nextId = "id_302";
          else nextId = "id_301";
        } else if (currentLevelPrefix === "3") {
          if (["🫠 Todavía me cuesta","🤷 Igual que antes"].includes(txt)) nextId = "id_403";
          else if (txt === "😌 Un poco mejor") nextId = "id_402";
          else nextId = "id_401";
        }
        if (nextId) {
          setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] }]);
          setCurrentId(nextId);
        }
        setTyping(false);
        return;
      }

      // start GAD
      if (opt.siguiente === "id_1008") {
        setMessages(prev => [...prev, { from: "bot", text: flows.mensaje_1008 }]);
        startGadFlow();
        setTyping(false);
        return;
      }

      // GAD flow
      if (isGadFlow) {
        const newScores = [...scores, opt.score];
        setScores(newScores);
        const nextIdx = gadIndex + 1;
        if (nextIdx < gadQuestions.length) {
          setMessages(prev => [...prev, { from: "bot", text: gadQuestions[nextIdx].text }]);
          setGadIndex(nextIdx);
        } else {
          const total = newScores.reduce((a,b) => a + b, 0);
          let nextId;
          if (total <= 4) nextId = "id_100";
          else if (total <= 9) nextId = "id_200";
          else if (total <= 14) nextId = "id_300";
          else nextId = "id_400";
          setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] }]);
          setCurrentId(nextId);
          setIsGadFlow(false);
          setScores([]);
        }
        setTyping(false);
        return;
      }

      // normal flows
      if (opt.siguiente) {
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${opt.siguiente.split("_")[1]}`] }]);
        setCurrentId(opt.siguiente);
      } else {
        setMessages(prev => [...prev, { from: "bot", text: "¡Hasta luego!" }]);
      }
      setTyping(false);
    }, 1500);
  };

  const renderOptions = () => {
    if (isGadFlow) {
      return (
        <div className="options-area">
          {gadQuestions[gadIndex].options.map((o,i) => (
            <button key={i} onClick={() => handleOption(o)} className="option-btn">
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      );
    }
    if (["id_1010","id_1002"].includes(currentId)) {
      const opts = flows[`opciones_${currentId.split("_")[1]}`] || [];
      return (
        <div className="options-area">
          {opts.map((o,i) => (
            <button key={i} onClick={() => handleOption(o)} className="option-btn">
              {o.texto}
            </button>
          ))}
        </div>
      );
    }
    if (isSolutionNode(currentId)) return null;
    const opciones = flows[`opciones_${currentId.split("_")[1]}`] || [];
    return (
      <div className="options-area">
        {opciones.map((opt,i) => (
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
        {messages.map((msg,i) => (
          <div key={i} className={`message-row ${msg.from}`}>
            <img src={msg.from==='bot'?botAvatar:userAvatar} className="avatar" alt="" />
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
              {i===messages.length-1 && !typing && renderOptions()}
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

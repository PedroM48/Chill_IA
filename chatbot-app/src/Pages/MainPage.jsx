// File: src/components/MainPage.jsx

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

  /** Mensajes que se muestran en la UI */
  const [messages, setMessages] = useState([
    { from: "bot", text: flows[`mensaje_${INITIAL_ID.split("_")[1]}`] }
  ]);
  const [currentId, setCurrentId] = useState(INITIAL_ID);
  const [typing, setTyping] = useState(false);

  /** Confirmación en nodos de “solución” (id_1010) */
  const [pendingConfirmId, setPendingConfirmId] = useState(null);

  /** Lectura de “confirmación” desde cada opción en JSON */
  const [confirmacion, setConfirmacion] = useState(null);

  /** GAD-7 */
  const [isGadFlow, setIsGadFlow] = useState(false);
  const [gadQuestions, setGadQuestions] = useState([]);
  const [gadIndex, setGadIndex] = useState(0);
  const [scores, setScores] = useState([]);

  /** Prefijo del nivel sólo durante nodos “evaluación” (id_1002) */
  const [currentLevelPrefix, setCurrentLevelPrefix] = useState(null);

  /** Conteo de visitas a nodos de “solución” para usar “mas_ayuda” en la segunda ronda */
  const [solutionVisits, setSolutionVisits] = useState({});

  /** Multimedia actual a mostrar (audio/imagen/video) */
  const [mediaActual, setMediaActual] = useState(null);

  /** Inicia flujo GAD-7 */
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

  /** Detecta si un ID corresponde a un “nodo de solución” (210–215, 310–317, 410–421) */
  const isSolutionNode = (id) => {
    if (!id) return false;
    const num = parseInt(id.split("_")[1], 10);
    return (num >= 210 && num <= 215) || (num >= 310 && num <= 317) || (num >= 410 && num <= 421);
  };

  /**
   * 1) Al cambiar a un nodo de “solución” (ej. id_210, id_310, id_410, etc),
   *    se escoge UNA de las opciones del JSON de manera aleatoria.
   * 2) Antes de mostrar el texto, guardamos la multimedia (si existe) para que
   *    se muestre en la burbuja del bot.
   * 3) En la primera visita mostramos “¿Todo bien? ¿Seguimos? (id_1010)”.
   * 4) En la segunda visita, si existe “mas_ayuda”, saltamos a ese nodo.
   */
  useEffect(() => {
    if (!isSolutionNode(currentId)) return;

    const base = parseInt(currentId.split("_")[1], 10);
    const opciones = flows[`opciones_${base}`] || [];
    if (!opciones.length) return;

    // Conteo de visitas para esa base
    const visits = solutionVisits[base] || 0;
    const updatedVisits = { ...solutionVisits, [base]: visits + 1 };
    setSolutionVisits(updatedVisits);

    // Elegimos una opción aleatoria
    const randomOpt = opciones[Math.floor(Math.random() * opciones.length)];

    setTyping(true);
    setTimeout(() => {
      // 1) Si la opción trae multimedia, la guardamos para que aparezca debajo del texto.
      if (randomOpt.multimedia && typeof randomOpt.multimedia === "object") {
        setMediaActual(randomOpt.multimedia);
      } else {
        setMediaActual(null);
      }

      // 2) Mostramos el texto de esa opción
      setMessages(prev => [...prev, { from: "bot", text: randomOpt.texto }]);

      // 3) Si ya visitamos ≥1 vez y existe “mas_ayuda”, vamos a ese nodo;
      //    en otro caso, vamos a la confirmación id_1010
      if (visits >= 1 && randomOpt.mas_ayuda) {
        const ayudaId = randomOpt.mas_ayuda;
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${ayudaId.split("_")[1]}`] }]);
        setCurrentId(ayudaId);
      } else {
        // guardamos confirmation para la respuesta “Si” en id_1010
        setPendingConfirmId(randomOpt.confirmacion);
        setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_1010`] }]);
        setCurrentId("id_1010");
      }

      setTyping(false);
    }, 500);
  }, [currentId]);

  /**
   *  Mantiene “currentLevelPrefix” para que funcione la lógica de id_1002.
   *  Al momento de evaluar (id_1002) usamos el prefijo (1,2,3) según corresponda.
   */
  useEffect(() => {
    if (currentId === "id_1002") return;
    const prefix = currentId.split("_")[1].charAt(0);
    setCurrentLevelPrefix(["1","2","3","4","5"].includes(prefix) ? prefix : null);
  }, [currentId]);

  /**
   *  Maneja clic en cualquiera de las opciones disponibles.
   *  - Agrega el mensaje del usuario al historial
   *  - Si trae “multimedia”, la guardamos temporalmente en mediaActual
   *  - Si es confirmación en id_1010, mostramos directamente el texto de confirmación
   *  - Si es evaluación (id_1002), calculamos nextId según el prefijo
   *  - Si es GAD-7 (id_1008), arrancamos ese flujo
   *  - Si está dentro de flujo GAD-7, manejamos preguntas y respuestas
   *  - En caso “normal”, simplemente avanzamos a opt.siguiente
   */
  const handleOption = (opt) => {
    const userText = opt.texto || `${opt.emoji} ${opt.label}`;
    setMessages(prev => [...prev, { from: "user", text: userText }]);
    setTyping(true);

    // 1) Si trae multimedia (audio/imagen/video), la guardamos para que aparezca.
    if (opt.multimedia && typeof opt.multimedia === "object") {
      setMediaActual(opt.multimedia);
    } else {
      setMediaActual(null);
    }

    // 2) Guardamos la “confirmación” si esta opción la trae
    if (opt.confirmacion) {
      setPendingConfirmId(opt.confirmacion);
    }

    setTimeout(() => {
      // ==== CONFIRMACIÓN EN id_1010 ====
      if (currentId === "id_1010") {
        if (pendingConfirmId) {
          // Mostramos el mensaje apuntado en pendingConfirmId
          setMessages(prev => [
            ...prev,
            { from: "bot", text: flows[`mensaje_${pendingConfirmId.split("_")[1]}`] }
          ]);
          setCurrentId(pendingConfirmId);
          setPendingConfirmId(null);
        } else {
          // Si no hay confirmación concreta, simplemente agradecemos
          setMessages(prev => [...prev, { from: "bot", text: "¡Gracias!" }]);
        }
        setTyping(false);
        return;
      }

      // ==== EVALUACIÓN EN id_1002 ====
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
          setMessages(prev => [...prev, { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] }]);
          setCurrentId(nextId);
        }
        setTyping(false);
        return;
      }

      // ==== INICIO DE FLUJO GAD-7 (id_1008) ====
      if (opt.siguiente === "id_1008") {
        setMessages(prev => [...prev, { from: "bot", text: flows.mensaje_1008 }]);
        startGadFlow();
        setTyping(false);
        return;
      }

      // ==== PREGUNTAS GAD-7 EN PROGRESO ====
      if (isGadFlow) {
        const newScores = [...scores, opt.score];
        setScores(newScores);
        const nextIdx = gadIndex + 1;
        if (nextIdx < gadQuestions.length) {
          setMessages(prev => [
            ...prev,
            { from: "bot", text: gadQuestions[nextIdx].text }
          ]);
          setGadIndex(nextIdx);
        } else {
          const total = newScores.reduce((a, b) => a + b, 0);
          let nextId;
          if (total <= 4) nextId = "id_100";
          else if (total <= 9) nextId = "id_200";
          else if (total <= 14) nextId = "id_300";
          else nextId = "id_400";

          setMessages(prev => [
            ...prev,
            { from: "bot", text: flows[`mensaje_${nextId.split("_")[1]}`] }
          ]);
          setCurrentId(nextId);
          setIsGadFlow(false);
          setScores([]);
        }
        setTyping(false);
        return;
      }

      // ==== FLUJOS NORMALES (avanzar por opt.siguiente) ====
      if (opt.siguiente) {
        setMessages(prev => [
          ...prev,
          { from: "bot", text: flows[`mensaje_${opt.siguiente.split("_")[1]}`] }
        ]);
        setCurrentId(opt.siguiente);
      } else {
        setMessages(prev => [...prev, { from: "bot", text: "¡Hasta luego!" }]);
      }
      setTyping(false);
    }, 1500);
  };

  /** Renderiza los botones de opciones según el estado actual */
  const renderOptions = () => {
    // 1) Si estamos en flujo GAD-7:
    if (isGadFlow) {
      return (
        <div className="options-area">
          {gadQuestions[gadIndex].options.map((o, i) => (
            <button
              key={i}
              onClick={() => handleOption(o)}
              className="option-btn"
            >
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      );
    }

    // 2) Si estamos en confirmación (id_1010) o evaluación (id_1002):
    if (["id_1010", "id_1002"].includes(currentId)) {
      const opts = flows[`opciones_${currentId.split("_")[1]}`] || [];
      return (
        <div className="options-area">
          {opts.map((o, i) => (
            <button
              key={i}
              onClick={() => handleOption(o)}
              className="option-btn"
            >
              {o.texto}
            </button>
          ))}
        </div>
      );
    }

    // 3) Si es nodo de “solución”, no mostramos opciones (se maneja con auto‐handle)
    if (isSolutionNode(currentId)) {
      return null;
    }

    // 4) Flujo normal: mostramos opciones tal como vienen en JSON
    const opciones = flows[`opciones_${currentId.split("_")[1]}`] || [];
    return (
      <div className="options-area">
        {opciones.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOption(opt)}
            className="option-btn"
          >
            {opt.texto}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <h1>CHILL IA 🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙🤙</h1>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.from}`}>
            <img
              src={msg.from === "bot" ? botAvatar : userAvatar}
              className="avatar"
              alt=""
            />
            <div className={`bubble ${msg.from}`}>
              {/* Si es el último mensaje de “bot” y hay mediaActual, la mostramos */}
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

              {/* Texto del mensaje */}
              <span>{msg.text}</span>

              {/* Botones de opción sólo si es el último mensaje y no se está tipando */}
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

import React, { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    { from: "bot", text: 
        "Hola [Nombre], ¿qué tal? 👋 Soy Chill IA, tu amigo virtual para esos momentos en los que la ansiedad te quiere ganar 😵‍💫. Estoy aquí para acompañarte, tranqui 😌, sin presiones ni nada por el estilo. Si quieres, podemos tomarnos un rato chill para hablar de tu situación 🧘‍♂️." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { from: "user", text: input }]);

    // Simula una respuesta del chatbot
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Estoy procesando tu mensaje: " + input }
      ]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="chat-container">
      <h1>CHILL IA 🤙</h1>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={msg.from}>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
}

export default App;

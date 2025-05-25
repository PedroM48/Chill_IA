import React, { useState } from "react";
import axios from "axios";
import "./MainPage.css";

function MainPage() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        "Hola [Nombre], ¿qué tal? 👋 Soy Chill IA, tu amigo virtual para esos momentos en los que la ansiedad te quiere ganar 😵‍💫. Estoy aquí para acompañarte, tranqui 😌, sin presiones ni nada por el estilo. Si quieres, podemos tomarnos un rato chill para hablar de tu situación 🧘‍♂️.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Eres un amigo virtual empático llamado Chill IA. Hablas con un tono relajado y juvenil, ayudando a personas que se sienten ansiosas. Responde con cercanía, sin tecnicismos ni lenguaje clínico.",
            },
            { role: "user", content: input },
          ],
          temperature: 0.7,
          max_tokens: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply = response.data.choices[0].message.content;

      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (error) {
      console.error("Error al contactar con OpenAI:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "Oh no 😞, parece que estoy teniendo problemas para entenderte ahora. Pero no te preocupes, aquí estaré cuando quieras seguir charlando. 💙",
        },
      ]);
    } finally {
      setLoading(false);
    }
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
        {loading && (
          <div className="bot">
            <span>Escribiendo...</span>
          </div>
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>
          Enviar
        </button>
      </div>
    </div>
  );
}

export default MainPage;
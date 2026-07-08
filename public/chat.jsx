// chat.jsx — 可試聊的對話原型
const { useState, useEffect, useRef } = React;

function ChatDemo({ persona }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState([]);
  const bodyRef = useRef(null);
  const busyRef = useRef(false);

  // reset conversation whenever persona changes
  useEffect(() => {
    setMessages([{ who: "them", text: persona.greeting }]);
    setUsed([]);
    setTyping(false);
    busyRef.current = false;
  }, [persona.id]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  async function getReply(text) {
    // Try the real model first; gracefully fall back to scripted lines.
    try {
      if (window.claude && window.claude.complete) {
        const history = messages.slice(-4).map(m =>
          (m.who === "me" ? "使用者：" : persona.name + "：") + m.text
        ).join("\n");
        const prompt =
          persona.persona_prompt +
          "\n以下是最近的對話：\n" + history +
          "\n使用者剛剛說：「" + text + "」\n" +
          "請以這個人設、用繁體中文回覆 1～2 句，自然、像真人男友，不要用旁白或括號動作，不要過多 emoji。直接給出回覆內容：";
        const out = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });
        if (out && out.trim()) return out.trim().replace(/^["「]|["」]$/g, "");
      }
    } catch (e) { /* fall through to scripted */ }
    return persona.replies[text] || persona.fallback;
  }

  async function send(text) {
    const t = (text || "").trim();
    if (!t || busyRef.current) return;
    busyRef.current = true;
    setInput("");
    setUsed(u => [...u, t]);
    setMessages(m => [...m, { who: "me", text: t }]);
    setTyping(true);
    const reply = await getReply(t);
    // pacing for realism
    await new Promise(r => setTimeout(r, 650 + Math.min(900, reply.length * 28)));
    setTyping(false);
    setMessages(m => [...m, { who: "them", text: reply }]);
    busyRef.current = false;
  }

  const suggestions = persona.suggestions.filter(s => !used.includes(s));

  return (
    <div className="phone">
      <div className="phone-head">
        <div className="ph-glyph">{persona.glyph}</div>
        <div className="ph-who">
          <b>{persona.name}</b>
          <span>{persona.online}</span>
        </div>
      </div>
      <div className="phone-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={"msg " + m.who}>{m.text}</div>
        ))}
        {typing && (
          <div className="typing"><i></i><i></i><i></i></div>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
      <form className="phone-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"傳訊息給" + persona.name + "…"}
          aria-label="輸入訊息"
        />
        <button type="submit" disabled={!input.trim()} aria-label="送出">↑</button>
      </form>
    </div>
  );
}

window.ChatDemo = ChatDemo;

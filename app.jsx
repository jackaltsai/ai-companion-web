// app.jsx — 心辰 主程式
const { useState: uS, useEffect: uE, useRef: uR } = React;

const THEME_MAP = { "午夜玫瑰": "rose", "暗金奢華": "gold", "冷夜霓虹": "indigo" };

const APP_CONFIG = {
  "style": "午夜玫瑰",
  "defaultPersona": "沉 · 成熟穩重",
  "motion": true
};

function Toast({ msg, onDone }) {
  uE(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}

function useReveal(active, dep) {
  uE(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!active) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(e => { e.classList.remove("in"); io.observe(e); });
    return () => io.disconnect();
  }, [active, dep]);
}

function App() {
  const t = APP_CONFIG;
  const personas = window.PERSONAS;

  const initId = (personas.find(p => (p.name + " · " + p.archetype) === t.defaultPersona) || personas[0]).id;
  const [selId, setSel] = uS(initId);
  const [toast, setToast] = uS("");

  const persona = personas.find(p => p.id === selId) || personas[0];
  const theme = persona.theme || "rose";

  useReveal(t.motion, theme + selId);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
  }
  const LINE_URL = "https://line.me/R/ti/p/@491zwjgn";
  const onStart = () => window.open(LINE_URL, "_blank");

  return (
    <div className="app" data-theme={theme}>
      <Nav onStart={onStart} />
      <Hero persona={persona} onStart={onStart} />
      <Features />
      <PersonaSection personas={personas} selId={selId} setSel={setSel} />
      <ChatSection persona={persona} />
      <Pricing />
      <FAQ />
      <FinalCTA persona={persona} onStart={onStart} />
      <Footer />

      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

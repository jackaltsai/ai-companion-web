// app.jsx — 心辰 主程式
const { useState: uS, useEffect: uE, useRef: uR } = React;

const THEME_MAP = { "午夜玫瑰": "rose", "暗金奢華": "gold", "冷夜霓虹": "indigo" };
const PERSONA_LABELS = window.PERSONAS.map(p => p.name + " · " + p.archetype);

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "午夜玫瑰",
  "defaultPersona": "沉 · 成熟穩重",
  "motion": true
}/*EDITMODE-END*/;

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
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const personas = window.PERSONAS;

  const initId = (personas.find(p => (p.name + " · " + p.archetype) === t.defaultPersona) || personas[0]).id;
  const [selId, setSel] = uS(initId);
  const [toast, setToast] = uS("");

  // keep selection in sync when the default-persona tweak changes
  uE(() => {
    const match = personas.find(p => (p.name + " · " + p.archetype) === t.defaultPersona);
    if (match) setSel(match.id);
  }, [t.defaultPersona]);

  const persona = personas.find(p => p.id === selId) || personas[0];
  const theme = persona.theme || "rose";

  useReveal(t.motion, theme + selId);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
  }
  const LINE_URL = "https://line.me/R/ti/p/@491zwjgn";
  const onStart = () => window.open(LINE_URL, "_blank");
  const onPick = (plan) => {
    if (plan === "free") { window.open(LINE_URL, "_blank"); return; }
    const label = { topup: "加值方案 NT$299／1,500 則" }[plan];
    setToast("示範模式：前往「" + label + "」LinePay 結帳 ✓");
  };

  return (
    <div className="app" data-theme={theme}>
      <Nav onStart={onStart} />
      <Hero persona={persona} onStart={onStart} />
      <Features />
      <PersonaSection personas={personas} selId={selId} setSel={setSel} />
      <ChatSection persona={persona} />
      <Pricing onPick={onPick} />
      <FAQ />
      <FinalCTA persona={persona} onStart={onStart} />
      <Footer />

      <Toast msg={toast} onDone={() => setToast("")} />

      <TweaksPanel>
        <TweakSection label="內容" />
        <TweakSelect label="預設人設" value={t.defaultPersona}
          options={PERSONA_LABELS}
          onChange={(v) => setTweak("defaultPersona", v)} />
        <TweakToggle label="進場動畫" value={t.motion}
          onChange={(v) => setTweak("motion", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

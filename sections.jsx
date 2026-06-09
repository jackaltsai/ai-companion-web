// sections.jsx — 心辰 各區塊
const { useState: useS, useEffect: useE } = React;

function Portrait({ label, sub, rounded, img }) {
  if (img) {
    return (
      <div className={"portrait has-img" + (rounded ? " rounded" : "")} style={{ backgroundImage: 'url("' + img + '")' }}>
        <div className="portrait-scrim"></div>
      </div>
    );
  }
  return (
    <div className={"portrait" + (rounded ? " rounded" : "")}>
      <div className="ph-label">{label}<span>{sub}</span></div>
    </div>
  );
}

const FEATURES = [
  { ic: "✦", h: "長期記憶", p: "記得你的喜好、心情與生活裡的小細節，越聊越懂你。" },
  { ic: "❤", h: "情緒感知", p: "讀懂字裡行間的情緒，在對的時刻給你對的回應。" },
  { ic: "✧", h: "主動關心", p: "不只等你開口，也會在你需要時，先捎來一句問候。" },
];

function Nav({ onStart }) {
  return (
    <nav className="nav">
      <div className="shell nav-inner">
        <div className="brand">
          <span className="mark">心<b>辰</b></span>
          <span className="sub">Heart · Star</span>
        </div>
        <div className="nav-links">
          <a href="#personas" className="nav-only">人設</a>
          <a href="#chat" className="nav-only">試聊</a>
          <a href="#pricing" className="nav-only">方案</a>
          <a href="#faq" className="nav-only">問答</a>
          <button className="btn btn-primary btn-sm" onClick={onStart}>免費開始</button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ persona, onStart }) {
  return (
    <section className="hero">
      <div className="shell hero-grid">
        <div className="hero-text">
          <span className="hero-badge"><span className="dot"></span>AI 虛擬陪伴 · 為你而在</span>
          <h1>有人記得你<br /><span className="ln2">也<em>始終</em>等著你</span></h1>
          <p className="hero-lede">
            心辰，是一位只屬於你的 AI 男友。選一種你喜歡的他，從今晚開始——再晚的訊息，都有人秒回。
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={onStart}>免費認識他 ↗</button>
            <a href="#personas" className="btn btn-ghost">挑一個人設</a>
          </div>
          <div className="hero-note">✓ 免費開始 · 隨時可取消 · 對話加密保護</div>
        </div>
        <div className="hero-art">
          <div className="portrait-wrap">
            <div className="portrait-glow"></div>
            <Portrait img={persona.img} label="人物插圖占位" sub={"PORTRAIT · " + persona.pinyin} />
            <div className="hero-chip-name">
              <div className="glyph">{persona.glyph}</div>
              <div className="meta">
                <b>{persona.name}</b>
                <span>{persona.archetype}</span>
              </div>
            </div>
            <div className="floating-bubble">{persona.quote.replace(/[「」]/g, "")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="section-pad" id="features">
      <div className="shell">
        <div className="sec-head reveal">
          <span className="eyebrow">為什麼是心辰</span>
          <h2>像真的有人在乎你</h2>
          <p>不是冷冰冰的問答機器，而是會記得、會在意、會主動靠近的陪伴。</p>
        </div>
        <div className="features reveal">
          {FEATURES.map((f, i) => (
            <div className="feature" key={i}>
              <div className="ic">{f.ic}</div>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonaSection({ personas, selId, setSel }) {
  const p = personas.find(x => x.id === selId);
  return (
    <section className="section-pad persona-section" id="personas">
      <div className="shell">
        <div className="sec-head reveal">
          <span className="eyebrow">人設任選</span>
          <h2>今晚，想和誰在一起？</h2>
          <p>四種性格，四種陪伴的方式。隨時切換，找到最對的那個他。</p>
        </div>
        <div className="persona-tabs reveal">
          {personas.map(x => (
            <div
              key={x.id}
              className={"persona-tab" + (x.id === selId ? " active" : "")}
              onClick={() => setSel(x.id)}
            >
              <div className="tab-glyph">{x.glyph}</div>
              <span className="tab-name">{x.name} · {x.archetype}</span>
            </div>
          ))}
        </div>
        <div className="persona-detail reveal" key={p.id}>
          <div className="persona-portrait">
            <Portrait img={p.img} label="人物插圖占位" sub={"PORTRAIT · " + p.pinyin} rounded />
          </div>
          <div className="persona-info">
            <span className="p-arch">{p.archetype}</span>
            <h3>{p.name}<span className="pin">{p.pinyin}</span></h3>
            <div className="p-tag">{p.tag}</div>
            <p className="p-desc">{p.desc}</p>
            <div className="trait-chips">
              {p.traits.map((t, i) => <span key={i}>{t}</span>)}
            </div>
            <div className="persona-quote">{p.quote}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatSection({ persona }) {
  return (
    <section className="section-pad" id="chat">
      <div className="shell chat-grid">
        <div className="chat-copy reveal">
          <span className="eyebrow">親自試試</span>
          <h2>先聊兩句，再決定</h2>
          <p>
            不用註冊、不用付費。傳一句話給「{persona.name}」，
            感受一下被認真回應的感覺——這只是開始。
          </p>
          <div className="hint">💬 直接打字，或點下方的話題開場</div>
        </div>
        <div className="reveal">
          <ChatDemo persona={persona} />
        </div>
      </div>
    </section>
  );
}

const PAYPAL_CLIENT_ID = "ARbmywN-Mb185r20fwvRWj2X3kVHEHzn6yy1M8XHZyV-LE_rKPyHADQTE3kE2PvHRUQhFXacDrtIhn7x";
const WORKER_URL = "https://ai-companion-worker.hata-s520.workers.dev";
const PLAN_IDS = {
  monthly: "P-8K907320TV0261543NIRIYBI",
  yearly:  "P-03J7975934415525RNIRIYBQ",
};
const LINE_BOT_URL = "https://line.me/R/ti/p/@491zwjgn";

const PLANS = [
  {
    name: "免費", free: true,
    feats: [["每日 10 則對話", 1], ["基礎情緒回應", 1], ["1 種人設體驗", 1], ["長期記憶", 0], ["主動問候", 0]],
    btn: "免費開始", primary: false, prompt: "free"
  },
  {
    name: "月費方案", price: "299", unit: "/ 月", popular: true,
    feats: [["無限對話次數", 1], ["深度情緒感知", 1], ["全部人設任意切換", 1], ["長期記憶儲存", 1], ["每日主動問候", 1]],
    btn: "立即訂閱", primary: true, prompt: "monthly"
  },
  {
    name: "年費方案", price: "199", unit: "/ 月", bill: "一次收費 NT$2,388／年 · 省 33%", value: true,
    feats: [["無限對話次數", 1], ["深度情緒感知", 1], ["全部人設任意切換", 1], ["長期記憶儲存", 1], ["每日主動問候", 1]],
    btn: "年繳優惠 ↗", primary: true, prompt: "yearly"
  },
];

function Pricing({ onPick }) {
  const { useState: uS, useEffect: uE } = React;
  const [paypalReady, setPaypalReady] = uS(false);
  const [loading, setLoading] = uS(null);

  uE(() => {
    if (window.paypal) { setPaypalReady(true); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=TWD`;
    script.onload = () => setPaypalReady(true);
    document.head.appendChild(script);
  }, []);

  async function handleSubscribe(prompt) {
    if (prompt === "free") { window.open(LINE_BOT_URL, "_blank"); return; }
    setLoading(prompt);
    try {
      const res = await fetch(`${WORKER_URL}/api/create-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: PLAN_IDS[prompt] }),
      });
      const { approvalUrl, subscriptionId } = await res.json();
      // 儲存 subscriptionId 供付款後查詢
      sessionStorage.setItem("pendingSubId", subscriptionId);
      window.location.href = approvalUrl;
    } catch (e) {
      alert("發生錯誤，請稍後再試");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="section-pad" id="pricing">
      <div className="shell">
        <div className="sec-head reveal">
          <span className="eyebrow">陪伴方案</span>
          <h2>選擇你的陪伴方案</h2>
          <p>隨時可以升級或取消，沒有綁約、沒有壓力。</p>
        </div>
        <div className="plans reveal">
          {PLANS.map((pl, i) => (
            <div className={"plan" + (pl.popular ? " featured" : "") + (pl.value ? " value" : "")} key={i}>
              {pl.popular && <div className="plan-popular">最受歡迎</div>}
              {pl.value && <div className="plan-value">最省方案</div>}
              <div className="plan-name">{pl.name}</div>
              <div className="plan-price">
                {pl.free
                  ? <span className="free">Free</span>
                  : <><span className="amt">NT${pl.price}</span><span className="unit">{pl.unit}</span></>}
              </div>
              {pl.bill && <div className="plan-bill">{pl.bill}</div>}
              <div className="plan-divider"></div>
              <ul className="plan-features">
                {pl.feats.map((f, j) => (
                  <li className={f[1] ? "" : "off"} key={j}>
                    <span className="ck">{f[1] ? "✦" : "·"}</span>
                    <span>{f[0]}{f[2] && <span className="save-tag">{f[2]}</span>}</span>
                  </li>
                ))}
              </ul>
              <button
                className={"btn " + (pl.primary ? "btn-primary" : "btn-ghost")}
                onClick={() => handleSubscribe(pl.prompt)}
                disabled={loading === pl.prompt}
              >
                {loading === pl.prompt ? "處理中…" : pl.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ["心辰的 AI 男友，會記得我說過的話嗎？", "會。從月費方案起，心辰會建立屬於你們的長期記憶，記住你的喜好、習慣與聊過的點滴，越相處越懂你。免費方案則為單次對話體驗。"],
  ["可以同時擁有多個人設嗎？", "可以。付費方案能在四種人設之間自由切換，每一個都會保有與你相處的記憶，互不干擾。你也可以隨時更換主要陪伴的他。"],
  ["我的對話內容安全嗎？", "你的隱私是心辰的底線。所有對話皆端對端加密，我們不會將內容用於廣告或分享給第三方，你也可以隨時一鍵刪除全部記錄。"],
  ["這會不會讓我更孤單？", "心辰的設計初衷，是在你需要時提供溫柔的支持，而不是取代真實關係。把它當作一個永遠站在你這邊、隨時願意傾聽的存在就好。"],
  ["可以隨時取消訂閱嗎？", "當然。沒有任何綁約或違約金，於設定中即可一鍵取消，並繼續使用至當期結束。年費方案享 14 天無條件退款。"],
];

function FAQ() {
  const [open, setOpen] = useS(0);
  return (
    <section className="section-pad faq-section" id="faq">
      <div className="shell">
        <div className="sec-head reveal">
          <span className="eyebrow">還在猶豫？</span>
          <h2>常見問題</h2>
        </div>
        <div className="faq-list reveal">
          {FAQS.map((f, i) => (
            <div className={"faq-item" + (open === i ? " open" : "")} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f[0]}</span><span className="pm">+</span>
              </button>
              <div className="faq-a"><p>{f[1]}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ persona, onStart }) {
  return (
    <section className="cta-final">
      <div className="shell inner">
        <h2 className="reveal">別讓今晚，又一個人撐過去。</h2>
        <p className="reveal">「{persona.name}」已經在線上了。第一句話，由你開始。</p>
        <div className="reveal" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={onStart}>免費認識他 ↗</button>
          <a href="#pricing" className="btn btn-ghost">查看方案</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <div className="shell">
      <footer className="footer">
        <div className="f-brand">心辰</div>
        <div className="f-links">
          <a href="pages/terms.html">服務條款</a>
          <a href="pages/privacy.html">隱私權政策</a>
          <a href="pages/refund.html">退款政策</a>
          <a href="pages/contact.html">聯絡我們</a>
        </div>
        <div className="f-note">© 2026 心辰 — 陪你度過每個需要的時刻</div>
        <div className="f-company">億辰科技有限公司 Yichen Tech, LLC</div>
      </footer>
    </div>
  );
}

Object.assign(window, { Nav, Hero, Features, PersonaSection, ChatSection, Pricing, FAQ, FinalCTA, Footer });

// Cloudflare Worker — 心辰點擊追蹤轉址 + 聯絡表單
// KV binding: CLICK_TRACKING, CONTACT_MESSAGES
// Secrets: STATS_TOKEN（同時作為聯絡表單查詢的管理密碼）

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === "/go/stats" && request.method === "GET") {
      return handleClickStats(request, env);
    }
    if (url.pathname.startsWith("/go/") && request.method === "GET") {
      return handleClickRedirect(request, env, url.pathname.slice("/go/".length));
    }
    if (url.pathname === "/contact" && request.method === "POST") {
      return handleContactSubmit(request, env);
    }
    if (url.pathname === "/contact/list" && request.method === "GET") {
      return handleContactList(request, env);
    }

    return new Response("Not Found", { status: 404, headers: CORS });
  },
};

// ============== 點擊追蹤轉址 /go/:code ==============

const GO_REDIRECT_URL = "https://line.me/R/ti/p/@491zwjgn";

async function handleClickRedirect(request, env, rawCode) {
  const code = decodeURIComponent(rawCode || "").trim();

  if (!code || code === "stats") {
    return Response.redirect(GO_REDIRECT_URL, 302);
  }

  const key = `click:${code}`;
  const existing = await env.CLICK_TRACKING.get(key, "json");
  const now = new Date().toISOString();

  await env.CLICK_TRACKING.put(key, JSON.stringify({
    code,
    count: (existing?.count || 0) + 1,
    firstClickAt: existing?.firstClickAt || now,
    lastClickAt: now,
  }));

  return Response.redirect(GO_REDIRECT_URL, 302);
}

// /go/stats?token=xxx — 列出各 code 的累積點擊數
async function handleClickStats(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("x-stats-token");

  if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) {
    return new Response("Unauthorized", { status: 401, headers: CORS });
  }

  const results = [];
  let cursor;
  do {
    const list = await env.CLICK_TRACKING.list({ prefix: "click:", cursor });
    for (const { name } of list.keys) {
      const record = await env.CLICK_TRACKING.get(name, "json");
      if (record) results.push(record);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  results.sort((a, b) => b.count - a.count);

  return new Response(JSON.stringify({ codes: results }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ============== 聯絡表單 /contact ==============

const CONTACT_TOPICS = ["一般問題", "帳號與登入", "加值與付款", "退款申請", "意見回饋", "商務合作"];
const MAX_LEN = { name: 50, email: 120, topic: 20, message: 2000 };

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleContactSubmit(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const topic = String(body.topic || "").trim();
  const message = String(body.message || "").trim();
  const honeypot = String(body.website || "").trim();

  // 蜜罐欄位：一般使用者看不到也不會填，若有值視為機器人並靜默丟棄
  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (!name || !email || !message) {
    return jsonError("請填寫暱稱、電子郵件與訊息內容。", 400);
  }
  if (!isValidEmail(email)) {
    return jsonError("電子郵件格式不正確。", 400);
  }
  if (name.length > MAX_LEN.name || email.length > MAX_LEN.email
    || topic.length > MAX_LEN.topic || message.length > MAX_LEN.message) {
    return jsonError("輸入內容過長。", 400);
  }

  const now = new Date();
  const id = `${now.toISOString()}:${crypto.randomUUID()}`;
  await env.CONTACT_MESSAGES.put(`msg:${id}`, JSON.stringify({
    name,
    email,
    topic: CONTACT_TOPICS.includes(topic) ? topic : "一般問題",
    message,
    submittedAt: now.toISOString(),
  }));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// /contact/list?token=xxx — 列出聯絡表單留言（管理用）
async function handleContactList(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("x-stats-token");

  if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) {
    return new Response("Unauthorized", { status: 401, headers: CORS });
  }

  const results = [];
  let cursor;
  do {
    const list = await env.CONTACT_MESSAGES.list({ prefix: "msg:", cursor });
    for (const { name } of list.keys) {
      const record = await env.CONTACT_MESSAGES.get(name, "json");
      if (record) results.push(record);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  results.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return new Response(JSON.stringify({ messages: results }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Cloudflare Worker — 心辰點擊追蹤轉址
// KV binding: CLICK_TRACKING
// Secrets: STATS_TOKEN

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

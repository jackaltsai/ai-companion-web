// Cloudflare Worker — 心辰訂閱後端
// KV binding: SUBSCRIPTIONS
// Secrets: PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_WEBHOOK_ID

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

    if (url.pathname === "/paypal/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    if (url.pathname === "/api/subscription" && request.method === "GET") {
      return handleCheckSubscription(request, env);
    }

    if (url.pathname === "/api/create-subscription" && request.method === "POST") {
      return handleCreateSubscription(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

// ── 建立訂閱（前端呼叫，取得 approval URL）──────────────────────────────
async function handleCreateSubscription(request, env) {
  const { planId } = await request.json();
  const token = await getPayPalToken(env);

  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "心辰",
        locale: "zh-TW",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${new URL(request.url).origin}/payment-success`,
        cancel_url: `${new URL(request.url).origin}/payment-cancel`,
      },
    }),
  });

  const data = await res.json();
  const approvalLink = data.links?.find((l) => l.rel === "approve")?.href;

  return new Response(JSON.stringify({ subscriptionId: data.id, approvalUrl: approvalLink }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── PayPal Webhook 處理 ──────────────────────────────────────────────────
async function handleWebhook(request, env) {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  const isValid = await verifyWebhook(body, headers, env);
  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body);
  const eventType = event.event_type;
  const sub = event.resource;

  if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
    await env.SUBSCRIPTIONS.put(
      `sub:${sub.id}`,
      JSON.stringify({
        id: sub.id,
        status: "ACTIVE",
        planId: sub.plan_id,
        email: sub.subscriber?.email_address || "",
        startTime: sub.start_time,
        activatedAt: new Date().toISOString(),
      }),
      { expirationTtl: 60 * 60 * 24 * 400 } // 400 天後自動清除
    );
  }

  if (eventType === "BILLING.SUBSCRIPTION.CANCELLED" || eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
    const existing = await env.SUBSCRIPTIONS.get(`sub:${sub.id}`, "json");
    if (existing) {
      await env.SUBSCRIPTIONS.put(`sub:${sub.id}`, JSON.stringify({ ...existing, status: eventType.split(".").pop() }));
    }
  }

  return new Response("OK", { status: 200 });
}

// ── 查詢訂閱狀態（前端付款後查詢）──────────────────────────────────────
async function handleCheckSubscription(request, env) {
  const url = new URL(request.url);
  const subscriptionId = url.searchParams.get("id");

  if (!subscriptionId) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: CORS });
  }

  // 先查 KV
  const cached = await env.SUBSCRIPTIONS.get(`sub:${subscriptionId}`, "json");
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // KV 尚未寫入時直接查 PayPal（webhook 可能有延遲）
  const token = await getPayPalToken(env);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  return new Response(JSON.stringify({ id: data.id, status: data.status, planId: data.plan_id }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── 工具函式 ─────────────────────────────────────────────────────────────
async function getPayPalToken(env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function verifyWebhook(body, headers, env) {
  const token = await getPayPalToken(env);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  });
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

// Cloudflare Worker — 心辰訂閱／加值後端
// KV binding: SUBSCRIPTIONS
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Secrets: LINEPAY_CHANNEL_ID, LINEPAY_CHANNEL_SECRET
// Vars (optional): LINEPAY_API_BASE = https://sandbox-api-pay.line.me (預設) 或 https://api-pay.line.me（正式）

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

const SITE_URL = "https://ai-companion-web.hata-s520.workers.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === "/stripe/create-checkout" && request.method === "POST") {
      return handleStripeCheckout(request, env);
    }
    if (url.pathname === "/stripe/webhook" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }
    if (url.pathname === "/stripe/session" && request.method === "GET") {
      return handleStripeSession(request, env);
    }

    if (url.pathname === "/linepay/create-payment" && request.method === "POST") {
      return handleLinePayCreate(request, env);
    }
    if (url.pathname === "/linepay/confirm" && request.method === "GET") {
      return handleLinePayConfirm(request, env);
    }
    if (url.pathname === "/linepay/order" && request.method === "GET") {
      return handleLinePayOrder(request, env);
    }

    return new Response("Not Found", { status: 404, headers: CORS });
  },
};

async function handleStripeCheckout(request, env) {
  const { priceId } = await request.json();

  const params = new URLSearchParams({
    "mode": "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "success_url": `${SITE_URL}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
    "cancel_url": `${SITE_URL}/#pricing`,
    "locale": "zh",
    "allow_promotion_codes": "true",
  });

  const res = await stripeApi(env, "POST", "/v1/checkout/sessions", params);
  if (res.error) {
    return new Response(JSON.stringify({ error: res.error.message }), { status: 400, headers: CORS });
  }

  return new Response(JSON.stringify({ url: res.url }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  const isValid = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) return new Response("Unauthorized", { status: 401 });

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await env.SUBSCRIPTIONS.put(
      `stripe:${session.subscription}`,
      JSON.stringify({
        id: session.subscription,
        sessionId: session.id,
        status: "ACTIVE",
        email: session.customer_details?.email || "",
        activatedAt: new Date().toISOString(),
      }),
      { expirationTtl: 60 * 60 * 24 * 400 }
    );
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.paused") {
    const sub = event.data.object;
    const existing = await env.SUBSCRIPTIONS.get(`stripe:${sub.id}`, "json");
    if (existing) {
      await env.SUBSCRIPTIONS.put(`stripe:${sub.id}`, JSON.stringify({
        ...existing,
        status: event.type === "customer.subscription.deleted" ? "CANCELLED" : "PAUSED",
      }));
    }
  }

  return new Response("OK", { status: 200 });
}

async function handleStripeSession(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Missing session_id" }), { status: 400, headers: CORS });
  }

  const res = await stripeApi(env, "GET", `/v1/checkout/sessions/${sessionId}`);
  if (res.error) {
    return new Response(JSON.stringify({ error: res.error.message }), { status: 400, headers: CORS });
  }

  const subscriptionId = res.subscription;
  const cached = subscriptionId
    ? await env.SUBSCRIPTIONS.get(`stripe:${subscriptionId}`, "json")
    : null;

  return new Response(JSON.stringify({
    sessionId,
    subscriptionId,
    status: cached?.status || (res.payment_status === "paid" ? "ACTIVE" : "PENDING"),
    email: res.customer_details?.email || "",
  }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function stripeApi(env, method, path, params) {
  const options = {
    method,
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  };
  if (params) {
    options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = params.toString();
  }
  const res = await fetch(`https://api.stripe.com${path}`, options);
  return res.json();
}

// ============== LINE Pay（一次性買斷加值方案）==============

function linePayApiBase(env) {
  return env.LINEPAY_API_BASE || "https://sandbox-api-pay.line.me";
}

// 建立加值訂單，導向 LINE Pay 付款頁
async function handleLinePayCreate(request, env) {
  const { amount, quota, name } = await request.json();

  if (!amount || !quota || !name) {
    return new Response(JSON.stringify({ error: "Missing amount/quota/name" }), { status: 400, headers: CORS });
  }

  const orderId = crypto.randomUUID();

  const body = {
    amount,
    currency: "TWD",
    orderId,
    packages: [{
      id: "topup",
      amount,
      name: "心辰",
      products: [{ name, quantity: 1, price: amount }],
    }],
    redirectUrls: {
      confirmUrl: `${SITE_URL}/linepay/confirm`,
      cancelUrl: `${SITE_URL}/#pricing`,
    },
  };

  const res = await linePayApi(env, "POST", "/v3/payments/request", body);
  if (res.returnCode !== "0000") {
    return new Response(JSON.stringify({ error: res.returnMessage || "LINE Pay 建立付款失敗" }), { status: 400, headers: CORS });
  }

  // 訂單先存為 PENDING，待 confirm 成功後才核發額度
  await env.SUBSCRIPTIONS.put(
    `linepay:${orderId}`,
    JSON.stringify({ orderId, amount, quota, status: "PENDING", createdAt: new Date().toISOString() }),
    { expirationTtl: 60 * 60 * 24 } // 付款連結 24 小時內有效
  );

  return new Response(JSON.stringify({ url: res.info.paymentUrl.web }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// LINE Pay 付款完成後的 redirect callback：確認付款並核發對話額度
async function handleLinePayConfirm(request, env) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId");
  const orderId = url.searchParams.get("orderId");

  if (!transactionId || !orderId) {
    return Response.redirect(`${SITE_URL}/#pricing`, 302);
  }

  const order = await env.SUBSCRIPTIONS.get(`linepay:${orderId}`, "json");
  if (!order || order.status !== "PENDING") {
    return Response.redirect(`${SITE_URL}/#pricing`, 302);
  }

  const res = await linePayApi(env, "POST", `/v3/payments/${transactionId}/confirm`, {
    amount: order.amount,
    currency: "TWD",
  });

  if (res.returnCode !== "0000") {
    await env.SUBSCRIPTIONS.put(`linepay:${orderId}`, JSON.stringify({ ...order, status: "FAILED" }));
    return Response.redirect(`${SITE_URL}/#pricing`, 302);
  }

  // TODO: 將 quota 核發給對應使用者帳號（需有使用者識別機制，例如 LINE userId / email）
  await env.SUBSCRIPTIONS.put(`linepay:${orderId}`, JSON.stringify({
    ...order,
    transactionId,
    status: "CONFIRMED",
    confirmedAt: new Date().toISOString(),
  }));

  return Response.redirect(`${SITE_URL}/pages/payment-success.html?order_id=${orderId}`, 302);
}

// 查詢加值訂單狀態，供 payment-success.html 顯示結果
async function handleLinePayOrder(request, env) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400, headers: CORS });
  }

  const order = await env.SUBSCRIPTIONS.get(`linepay:${orderId}`, "json");
  if (!order) {
    return new Response(JSON.stringify({ error: "找不到訂單資訊" }), { status: 404, headers: CORS });
  }

  return new Response(JSON.stringify({
    orderId: order.orderId,
    status: order.status,
    quota: order.quota,
    amount: order.amount,
  }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// LINE Pay API 簽章與請求：https://pay.line.me/jp/developers/apis/onlineApis
async function linePayApi(env, method, path, body) {
  const nonce = crypto.randomUUID();
  const bodyText = body ? JSON.stringify(body) : "";
  const signature = await linePaySign(env.LINEPAY_CHANNEL_SECRET, path, bodyText, nonce);

  const res = await fetch(`${linePayApiBase(env)}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-LINE-ChannelId": env.LINEPAY_CHANNEL_ID,
      "X-LINE-Authorization-Nonce": nonce,
      "X-LINE-Authorization": signature,
    },
    body: bodyText || undefined,
  });
  return res.json();
}

async function linePaySign(channelSecret, path, bodyText, nonce) {
  const message = channelSecret + path + bodyText + nonce;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyStripeSignature(body, sig, secret) {
  if (!sig || !secret) return false;
  const parts = sig.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});
  const payload = `${parts.t}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}

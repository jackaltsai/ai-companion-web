// Cloudflare Worker — 心辰訂閱後端
// KV binding: SUBSCRIPTIONS
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//          PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_WEBHOOK_ID

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

const SITE_URL = "https://ai-companion-web.pages.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // ── Stripe ──────────────────────────────────────────
    if (url.pathname === "/stripe/create-checkout" && request.method === "POST") {
      return handleStripeCheckout(request, env);
    }
    if (url.pathname === "/stripe/webhook" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }
    if (url.pathname === "/stripe/session" && request.method === "GET") {
      return handleStripeSession(request, env);
    }

    // ── PayPal ──────────────────────────────────────────
    if (url.pathname === "/paypal/webhook" && request.method === "POST") {
      return handlePaypalWebhook(request, env);
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

// ════════════════════════════════════════════════════════
//  STRIPE
// ════════════════════════════════════════════════════════

async function handleStripeCheckout(request, env) {
  const { priceId } = await request.json();

  const params = new URLSearchParams({
    "mode": "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "success_url": `${SITE_URL}/pages/payment-success.html?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    "cancel_url": `${SITE_URL}/#pricing`,
    "locale": "zh",
    "allow_promotion_codes": "true",
  });

  const res = await stripeApi(env, "POST", "/v1/checkout/sessions", params);
  if (res.error) {
    return new Response(JSON.stringify({ error: res.error.message }), { status: 400, headers: CORS });
  }

  return new Response(JSON.stringify({ url: res.url, sessionId: res.id }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  // 驗證 Webhook 簽名
  const isValid = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const subscriptionId = session.subscription;
    const email = session.customer_details?.email || "";

    await env.SUBSCRIPTIONS.put(
      `stripe:${subscriptionId}`,
      JSON.stringify({
        id: subscriptionId,
        sessionId: session.id,
        status: "ACTIVE",
        provider: "stripe",
        email,
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

  // 先查 KV（找對應的 subscription）
  const res = await stripeApi(env, "GET", `/v1/checkout/sessions/${sessionId}`);
  if (res.error) {
    return new Response(JSON.stringify({ error: res.error.message }), { status: 400, headers: CORS });
  }

  const subscriptionId = res.subscription;
  const cached = subscriptionId
    ? await env.SUBSCRIPTIONS.get(`stripe:${subscriptionId}`, "json")
    : null;

  const status = cached?.status || (res.payment_status === "paid" ? "ACTIVE" : "PENDING");

  return new Response(JSON.stringify({
    sessionId,
    subscriptionId,
    status,
    email: res.customer_details?.email || "",
    provider: "stripe",
  }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ════════════════════════════════════════════════════════
//  PAYPAL
// ════════════════════════════════════════════════════════

async function handleCreateSubscription(request, env) {
  const { planId } = await request.json();
  const token = await getPayPalToken(env);

  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "心辰",
        locale: "zh-TW",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${SITE_URL}/pages/payment-success.html?provider=paypal`,
        cancel_url: `${SITE_URL}/#pricing`,
      },
    }),
  });

  const data = await res.json();
  const approvalLink = data.links?.find((l) => l.rel === "approve")?.href;

  return new Response(JSON.stringify({ subscriptionId: data.id, approvalUrl: approvalLink }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function handlePaypalWebhook(request, env) {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  const isValid = await verifyPaypalWebhook(body, headers, env);
  if (!isValid) return new Response("Unauthorized", { status: 401 });

  const event = JSON.parse(body);
  const sub = event.resource;

  if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
    await env.SUBSCRIPTIONS.put(
      `sub:${sub.id}`,
      JSON.stringify({
        id: sub.id,
        status: "ACTIVE",
        provider: "paypal",
        planId: sub.plan_id,
        email: sub.subscriber?.email_address || "",
        activatedAt: new Date().toISOString(),
      }),
      { expirationTtl: 60 * 60 * 24 * 400 }
    );
  }

  if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED" || event.event_type === "BILLING.SUBSCRIPTION.SUSPENDED") {
    const existing = await env.SUBSCRIPTIONS.get(`sub:${sub.id}`, "json");
    if (existing) {
      await env.SUBSCRIPTIONS.put(`sub:${sub.id}`, JSON.stringify({
        ...existing, status: event.event_type.split(".").pop(),
      }));
    }
  }

  return new Response("OK", { status: 200 });
}

async function handleCheckSubscription(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: CORS });

  const cached = await env.SUBSCRIPTIONS.get(`sub:${id}`, "json");
  if (cached) return new Response(JSON.stringify(cached), { headers: { ...CORS, "Content-Type": "application/json" } });

  const token = await getPayPalToken(env);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/billing/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return new Response(JSON.stringify({ id: data.id, status: data.status, planId: data.plan_id }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ════════════════════════════════════════════════════════
//  工具函式
// ════════════════════════════════════════════════════════

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

async function verifyStripeSignature(body, sig, secret) {
  if (!sig || !secret) return false;
  const parts = sig.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}

async function getPayPalToken(env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function verifyPaypalWebhook(body, headers, env) {
  const token = await getPayPalToken(env);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

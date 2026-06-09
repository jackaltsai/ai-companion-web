// Cloudflare Worker — 心辰訂閱後端
// KV binding: SUBSCRIPTIONS
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

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

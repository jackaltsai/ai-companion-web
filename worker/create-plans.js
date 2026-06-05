// 執行方式：node create-plans.js
// 會自動建立月費和年費訂閱方案並印出 Plan ID

const CLIENT_ID = "ARbmywN-Mb185r20fwvRWj2X3kVHEHzn6yy1M8XHZyV-LE_rKPyHADQTE3kE2PvHRUQhFXacDrtIhn7x";
const SECRET    = "EGbGgzlDmR_I8zIdommo7v3aKI9VY1T0FnNEdOOePRAlanEFcUEBoRgZB_t4ratypHOi2hScKpTpuYCv";
const BASE      = "https://api-m.paypal.com"; // 正式環境

async function getToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("取得 Token 失敗：" + JSON.stringify(data));
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "心辰 AI 陪伴服務",
      description: "AI 虛擬男友陪伴訂閱服務",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error("建立 Product 失敗：" + JSON.stringify(data));
  console.log("✓ Product ID：", data.id);
  return data.id;
}

async function createPlan(token, productId, { name, intervalUnit, intervalCount, price }) {
  const res = await fetch(`${BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      name,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: intervalUnit, interval_count: intervalCount },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: price, currency_code: "TWD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`建立方案「${name}」失敗：` + JSON.stringify(data));
  return data.id;
}

(async () => {
  try {
    const token = await getToken();
    console.log("✓ Token 取得成功");

    const productId = await createProduct(token);

    const monthlyId = await createPlan(token, productId, {
      name: "心辰月費方案",
      intervalUnit: "MONTH",
      intervalCount: 1,
      price: "299",
    });
    console.log("✓ 月費 Plan ID：", monthlyId);

    const yearlyId = await createPlan(token, productId, {
      name: "心辰年費方案",
      intervalUnit: "YEAR",
      intervalCount: 1,
      price: "2388",
    });
    console.log("✓ 年費 Plan ID：", yearlyId);

    console.log("\n===== 複製以下兩行填入 sections.jsx =====");
    console.log(`  monthly: "${monthlyId}",`);
    console.log(`  yearly:  "${yearlyId}",`);
  } catch (e) {
    console.error("✘ 錯誤：", e.message);
  }
})();

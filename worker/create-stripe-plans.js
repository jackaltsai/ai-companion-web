// 執行方式：node create-stripe-plans.js
// 需要先設定環境變數：STRIPE_SECRET_KEY=sk_test_...
// 或直接把下方 SECRET_KEY 替換成你的 sk_test_ 金鑰

const SECRET_KEY = process.env.STRIPE_SECRET_KEY || "請填入sk_test_金鑰";
const BASE = "https://api.stripe.com/v1";

async function stripe(path, params) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (data.error) throw new Error(`${path} 失敗：${data.error.message}`);
  return data;
}

(async () => {
  try {
    // 1. 建立產品
    const product = await stripe("/products", {
      name: "心辰 AI 陪伴服務",
      description: "AI 虛擬男友陪伴訂閱服務",
    });
    console.log("✓ Product ID：", product.id);

    // 2. 月費方案 NT$299/月
    const monthly = await stripe("/prices", {
      product: product.id,
      unit_amount: 29900,        // 單位：分（TWD 無小數，29900 = NT$299）
      currency: "twd",
      "recurring[interval]": "month",
      "recurring[interval_count]": 1,
      nickname: "月費方案 NT$299",
    });
    console.log("✓ 月費 Price ID：", monthly.id);

    // 3. 年費方案 NT$2388/年
    const yearly = await stripe("/prices", {
      product: product.id,
      unit_amount: 238800,       // NT$2388
      currency: "twd",
      "recurring[interval]": "year",
      "recurring[interval_count]": 1,
      nickname: "年費方案 NT$2388",
    });
    console.log("✓ 年費 Price ID：", yearly.id);

    console.log("\n===== 複製以下兩行 =====");
    console.log(`  monthly: "${monthly.id}",`);
    console.log(`  yearly:  "${yearly.id}",`);
  } catch (e) {
    console.error("✘ 錯誤：", e.message);
  }
})();

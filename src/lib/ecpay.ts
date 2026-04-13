/**
 * ECPay AIO 金流整合工具庫
 * CheckMacValue 實作依據 ECPay API Skill guides/13-checkmacvalue.md (TypeScript 區段)
 * AIO 參數依據 ECPay API Skill guides/01-payment-aio.md
 */
import crypto from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

type EcpayParams = Record<string, string>;
type HashMethod = "sha256" | "md5";

// ── ECPay 專用 URL Encode ────────────────────────────────────────────────────

/**
 * ECPay 專用 URL 編碼（僅用於 CheckMacValue 計算）：
 * encodeURIComponent → 空格→+，~→%7e，'→%27 → toLowerCase → .NET 特殊字元還原
 * 注意：此函式與 AES 用的 aesUrlEncode 完全不同，請勿混用
 */
function ecpayUrlEncode(source: string): string {
  let encoded = encodeURIComponent(source)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7e")
    .replace(/'/g, "%27");
  encoded = encoded.toLowerCase();
  const replacements: Record<string, string> = {
    "%2d": "-",
    "%5f": "_",
    "%2e": ".",
    "%21": "!",
    "%2a": "*",
    "%28": "(",
    "%29": ")",
  };
  for (const [old, char] of Object.entries(replacements)) {
    encoded = encoded.split(old).join(char);
  }
  return encoded;
}

// ── CheckMacValue ────────────────────────────────────────────────────────────

/**
 * 產生 CheckMacValue（SHA256 或 MD5）
 * AIO 金流固定使用 sha256 + EncryptType=1
 */
export function generateCheckMacValue(
  params: EcpayParams,
  hashKey: string,
  hashIv: string,
  method: HashMethod = "sha256"
): string {
  // 1. 移除既有 CheckMacValue
  const filtered: EcpayParams = Object.fromEntries(
    Object.entries(params).filter(([k]) => k !== "CheckMacValue")
  );
  // 2. Key 不區分大小寫排序
  const sorted = Object.keys(filtered).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  // 3. 組合字串
  const paramStr = sorted.map((k) => `${k}=${filtered[k]}`).join("&");
  const raw = `HashKey=${hashKey}&${paramStr}&HashIV=${hashIv}`;
  // 4. ECPay URL encode
  const encoded = ecpayUrlEncode(raw);
  // 5. Hash + 6. 轉大寫
  return crypto.createHash(method).update(encoded, "utf8").digest("hex").toUpperCase();
}

/**
 * 驗證 CheckMacValue（timing-safe）
 * 用於 notify callback 驗證
 */
export function verifyCheckMacValue(
  params: EcpayParams,
  hashKey: string,
  hashIv: string,
  method: HashMethod = "sha256"
): boolean {
  const received = params.CheckMacValue ?? "";
  const calculated = generateCheckMacValue(params, hashKey, hashIv, method);
  const a = Buffer.from(received);
  const b = Buffer.from(calculated);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ── MerchantTradeNo ──────────────────────────────────────────────────────────

/**
 * 產生唯一的 MerchantTradeNo（最多 20 碼，英數字）
 * 格式：ORD + yyMMddHHmmss (12) + 4 位亂數 = 19 碼
 */
export function generateMerchantTradeNo(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = [
    String(now.getFullYear()).slice(2),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ORD${ts}${rand}`;
}

// ── Build ECPay AIO 參數 ──────────────────────────────────────────────────────

export function buildECPayParams(order: {
  merchantTradeNo: string;
  amount: number;
  itemName: string;
  tradeDesc: string;
}): EcpayParams {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  // 格式：yyyy/MM/dd HH:mm:ss (guides/01 步驟 1)
  const tradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // ItemName 長度限制：建議不超過 200 字元（guides/01 前置確認清單）
  const itemName = order.itemName.slice(0, 200);

  return {
    MerchantID: process.env.ECPAY_MERCHANT_ID!,
    MerchantTradeNo: order.merchantTradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: "aio",
    TotalAmount: String(order.amount),
    TradeDesc: order.tradeDesc,
    ItemName: itemName,
    ReturnURL: `${baseUrl}/api/ecpay/notify`,     // Server-to-Server callback
    OrderResultURL: `${baseUrl}/api/ecpay/return`, // 使用者付款後導回
    ChoosePayment: "Credit",
    EncryptType: "1",                              // SHA256
  };
}

// ── 產生自動提交的 HTML 表單 ─────────────────────────────────────────────────

/**
 * 產生自動提交到 ECPay 的 HTML 頁面
 * API route 回傳 Content-Type: text/html，瀏覽器執行後自動跳轉到綠界付款頁
 */
export function generateECPayForm(params: EcpayParams): string {
  const checkMacValue = generateCheckMacValue(
    params,
    process.env.ECPAY_HASH_KEY!,
    process.env.ECPAY_HASH_IV!
  );
  const allParams = { ...params, CheckMacValue: checkMacValue };
  const paymentUrl = process.env.ECPAY_PAYMENT_URL!;

  const inputs = Object.entries(allParams)
    .map(
      ([k, v]) =>
        `<input type="hidden" name="${k}" value="${v.replace(/"/g, "&quot;")}" />`
    )
    .join("\n    ");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>付款中...</title></head>
<body>
  <form id="ecpay-form" method="POST" action="${paymentUrl}">
    ${inputs}
  </form>
  <script>document.getElementById("ecpay-form").submit();</script>
</body>
</html>`;
}

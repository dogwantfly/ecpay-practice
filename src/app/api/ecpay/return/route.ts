/**
 * ECPay 付款完成後消費者導回 (OrderResultURL)
 * 綠界付款頁完成後 POST 至此，導向訂單結果頁
 * 見 ECPay API Skill guides/01-payment-aio.md
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const text = await req.text();
  const params = Object.fromEntries(new URLSearchParams(text));
  const { MerchantTradeNo } = params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(
    new URL(`/orders/result?ref=${encodeURIComponent(MerchantTradeNo)}`, baseUrl)
  );
}

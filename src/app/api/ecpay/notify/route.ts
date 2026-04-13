/**
 * ECPay Server-to-Server 付款通知 (ReturnURL)
 * 綠界付款完成後會呼叫此端點，必須回應 "1|OK"
 * 見 ECPay API Skill guides/01-payment-aio.md 步驟 3
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCheckMacValue } from "@/lib/ecpay";

export async function POST(req: NextRequest) {
  const text = await req.text();
  const params = Object.fromEntries(new URLSearchParams(text));

  // 1. 驗證 CheckMacValue
  const isValid = verifyCheckMacValue(
    params,
    process.env.ECPAY_HASH_KEY!,
    process.env.ECPAY_HASH_IV!
  );
  if (!isValid) {
    console.warn("[ECPay notify] CheckMacValue mismatch", params);
    return new Response("0|ErrorMessage", { status: 200 });
  }

  const { MerchantTradeNo, TradeNo, RtnCode } = params;
  const status = RtnCode === "1" ? "PAID" : "FAILED";

  try {
    const order = await prisma.order.update({
      where: { merchantTradeNo: MerchantTradeNo },
      data: { status, ecpayTradeNo: TradeNo ?? null },
    });

    // 付款成功時累加活動金額
    if (status === "PAID") {
      await prisma.campaign.update({
        where: { id: order.campaignId },
        data: { currentAmount: { increment: order.amount } },
      });
    }

    console.log(`[ECPay notify] ${MerchantTradeNo} → ${status}`);
  } catch (err) {
    console.error("[ECPay notify] DB error", err);
    // 仍回傳 1|OK 避免綠界重複通知（訂單可能已處理過）
  }

  // 綠界要求固定回應 "1|OK"
  return new Response("1|OK", { status: 200 });
}

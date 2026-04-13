"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface OrderResult {
  status: string;
  amount: number;
  buyerName: string;
  campaignTitle: string;
  merchantTradeNo: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";

  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!ref) return;

    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/result?ref=${encodeURIComponent(ref)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        if (data.status === "PENDING" && polls < 5) {
          setTimeout(() => setPolls((p) => p + 1), 2000);
        }
      }
      setLoading(false);
    };

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, polls]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 mt-4">查詢訂單中...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">找不到訂單資訊</p>
        <Link href="/" className="mt-4 inline-block text-emerald-600 hover:underline">
          返回首頁
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "PAID";
  const isFailed = order.status === "FAILED";
  const isPending = order.status === "PENDING";

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto text-center">
      {isPaid && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">捐款成功！感謝您的支持</h1>
          <p className="text-gray-500 mb-4">
            NT$ {order.amount.toLocaleString()} 已成功捐款至《{order.campaignTitle}》
          </p>
        </>
      )}
      {isFailed && (
        <>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">付款失敗</h1>
          <p className="text-gray-500 mb-4">很抱歉，您的付款未能完成，請稍後重試。</p>
        </>
      )}
      {isPending && (
        <>
          <div className="inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">付款處理中</h1>
          <p className="text-gray-500 mb-4">系統正在確認您的付款，請稍候...</p>
        </>
      )}

      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 mb-6">
        訂單編號：{order.merchantTradeNo}
      </div>

      <Link
        href="/"
        className="inline-block bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
      >
        返回活動列表
      </Link>
    </div>
  );
}

export default function ResultPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <Link href="/" className="text-2xl font-bold text-emerald-600">捐款平台</Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Suspense fallback={<div className="text-center py-16 text-gray-400">載入中...</div>}>
          <ResultContent />
        </Suspense>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";

interface SupportFormProps {
  campaignId: string;
  campaignTitle: string;
}

const PRESET_AMOUNTS = [100, 300, 500, 1000];

export default function SupportForm({ campaignId, campaignTitle }: SupportFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(300);
  const [customAmount, setCustomAmount] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount =
    selectedAmount !== null
      ? selectedAmount
      : customAmount
      ? parseInt(customAmount, 10)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || amount < 1) {
      setError("請輸入有效的捐款金額");
      return;
    }
    if (!buyerName.trim()) {
      setError("請輸入您的姓名");
      return;
    }
    if (!buyerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setError("請輸入有效的電子信箱");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, amount, buyerName: buyerName.trim(), buyerEmail: buyerEmail.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "發生錯誤，請稍後再試");
        setLoading(false);
        return;
      }

      // 取得 ECPay 自動提交 HTML，替換頁面以觸發跳轉
      const html = await res.text();
      document.open();
      document.write(html);
      document.close();
    } catch {
      setError("網路錯誤，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          選擇捐款金額（NT$）
        </label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setSelectedAmount(a);
                setCustomAmount("");
              }}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedAmount === a
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
              }`}
            >
              {a.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="自訂金額"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          min={1}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {amount > 0 && (
          <p className="text-sm text-emerald-600 mt-1">捐款金額：NT$ {amount.toLocaleString()}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
        <input
          type="text"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          placeholder="您的姓名"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">電子信箱</label>
        <input
          type="email"
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "處理中..." : `捐款 NT$ ${amount > 0 ? amount.toLocaleString() : "--"}`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        點擊捐款後將導向綠界金流（ECPay）安全付款頁面
      </p>
    </form>
  );
}

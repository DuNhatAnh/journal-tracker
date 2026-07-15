import React, { memo } from "react";

interface Props {
  driver: "gemini" | "ollama";
}

export const AiTipsPanel = memo(function AiTipsPanel({ driver }: Props) {
  if (driver !== 'gemini') return null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30">
      <h3 className="text-sm font-bold text-on-surface mb-3">
        Lưu ý khi chọn Model Gemini
      </h3>
      <ul className="text-xs text-on-surface-variant list-disc pl-4 space-y-2">
        <li><strong className="text-primary">gemini-embedding-001</strong>: Phiên bản ổn định trên API v1beta, ít lỗi 404 nhất. <b>(Khuyên dùng)</b></li>
        <li><strong className="text-primary">text-embedding-004</strong>: Đời mới hơn nhưng thường xuyên bị lỗi 404 (Not Found) trên một số tài khoản miễn phí do Google chưa mở hoàn toàn.</li>
      </ul>
    </div>
  );
});

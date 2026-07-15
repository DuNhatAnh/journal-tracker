import React, { memo } from "react";
import { Cpu, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { AiModelsWhitelist, AiSettings } from "../../../pages/Admin/AiSettings";

interface Props {
  driver: "gemini" | "ollama";
  apiKey: string;
  setApiKey: (key: string) => void;
  showApiKey: boolean;
  setShowApiKey: (show: boolean) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  chatModel: string;
  setChatModel: (model: string) => void;
  embeddingModel: string;
  setEmbeddingModel: (model: string) => void;
  models: AiModelsWhitelist | null;
  settings: AiSettings | null;
  handleSave: () => void;
  saving: boolean;
}

export const AiConnectionForm = memo(function AiConnectionForm({
  driver, apiKey, setApiKey, showApiKey, setShowApiKey, baseUrl, setBaseUrl,
  chatModel, setChatModel, embeddingModel, setEmbeddingModel, models, settings, handleSave, saving
}: Props) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 space-y-6">
      <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary" /> Thông số kết nối
      </h2>

      {driver === "gemini" && (
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.driver === 'gemini' && settings.api_key_configured ? "(Đã cấu hình. Nhập key mới để thay đổi)" : "AIzaSy..."}
              className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setApiKey(text);
                  } catch (err) {
                    console.error("Failed to read clipboard contents: ", err);
                  }
                }}
                className="p-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                PASTE
              </button>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {driver === "ollama" && (
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">Ollama Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">Chat Model</label>
          <select
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary outline-none"
          >
            {models?.[driver]?.chat_models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">Embedding Model</label>
          <div className="flex gap-2">
            <select
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary outline-none"
            >
              {models?.[driver]?.embedding_models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              type="button"
              title="Lưu nhanh Model"
              onClick={handleSave}
              disabled={saving}
              className="shrink-0 flex items-center justify-center aspect-square h-full p-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-xl border border-green-500/20 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

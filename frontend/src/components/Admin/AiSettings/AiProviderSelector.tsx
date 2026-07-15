import React, { memo } from "react";
import { Server } from "lucide-react";

interface Props {
  driver: "gemini" | "ollama";
  onDriverChange: (driver: "gemini" | "ollama") => void;
}

export const AiProviderSelector = memo(function AiProviderSelector({ driver, onDriverChange }: Props) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30">
      <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
        <Server className="w-5 h-5 text-primary" /> Provider (Driver)
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <label 
          className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
            driver === 'gemini' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container'
          }`}
          onClick={() => onDriverChange("gemini")}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <div className="text-sm">
                <p className={`font-bold ${driver === 'gemini' ? 'text-primary' : 'text-on-surface'}`}>Google Gemini</p>
                <p className="text-on-surface-variant text-xs mt-1">Sử dụng API của Google (Khuyên dùng)</p>
              </div>
            </div>
            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${driver === 'gemini' ? 'border-primary' : 'border-outline-variant'}`}>
              {driver === 'gemini' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </div>
          </div>
        </label>

        <label 
          className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
            driver === 'ollama' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container'
          }`}
          onClick={() => onDriverChange("ollama")}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <div className="text-sm">
                <p className={`font-bold ${driver === 'ollama' ? 'text-primary' : 'text-on-surface'}`}>Ollama (Local)</p>
                <p className="text-on-surface-variant text-xs mt-1">Chạy model local (Llama3, Mistral...)</p>
              </div>
            </div>
            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${driver === 'ollama' ? 'border-primary' : 'border-outline-variant'}`}>
              {driver === 'ollama' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
});

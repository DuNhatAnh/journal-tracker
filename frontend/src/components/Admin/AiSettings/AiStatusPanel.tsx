import React, { memo } from "react";
import { CheckCircle2, XCircle, AlertCircle, Server, Loader2, Save, RotateCcw } from "lucide-react";
import { AiSettings } from "../../../pages/Admin/AiSettings";

interface Props {
  connectionStatus: "valid" | "invalid" | "rate_limited" | null;
  connectionMessage: string;
  settings: AiSettings | null;
  testing: boolean;
  saving: boolean;
  resetting: boolean;
  handleTestConnection: () => void;
  handleSave: () => void;
  handleReset: () => void;
}

export const AiStatusPanel = memo(function AiStatusPanel({
  connectionStatus, connectionMessage, settings, testing, saving, resetting,
  handleTestConnection, handleSave, handleReset
}: Props) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-on-surface">Trạng thái</h2>
        <div className="mt-4 flex items-start gap-3">
          {connectionStatus === "valid" && <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />}
          {connectionStatus === "invalid" && <XCircle className="w-6 h-6 text-error flex-shrink-0" />}
          {connectionStatus === "rate_limited" && <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />}
          {!connectionStatus && <Server className="w-6 h-6 text-on-surface-variant flex-shrink-0" />}
          
          <div>
            <p className={`font-bold ${
              connectionStatus === "valid" ? "text-green-500" :
              connectionStatus === "invalid" ? "text-error" :
              connectionStatus === "rate_limited" ? "text-orange-500" :
              "text-on-surface-variant"
            }`}>
              {connectionStatus === "valid" ? "Connected" :
               connectionStatus === "invalid" ? "Invalid / Error" :
               connectionStatus === "rate_limited" ? "Rate Limited (429)" :
               "Chưa kiểm tra"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {connectionMessage || (settings?.configured ? "Hệ thống đang sử dụng cấu hình đã lưu." : "Hệ thống chưa được cấu hình AI.")}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-outline-variant/20 space-y-3">
        <button
          onClick={handleTestConnection}
          disabled={testing || saving}
          className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          Test Connection
        </button>
        
        <button
          onClick={handleSave}
          disabled={testing || saving}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>

        <button
          onClick={handleReset}
          disabled={testing || saving || resetting}
          className="w-full py-3 rounded-xl bg-error/10 text-error font-bold hover:bg-error/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Reset to Default
        </button>
      </div>
    </div>
  );
});

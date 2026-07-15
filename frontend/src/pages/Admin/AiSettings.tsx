import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { AiProviderSelector } from "../../components/Admin/AiSettings/AiProviderSelector";
import { AiConnectionForm } from "../../components/Admin/AiSettings/AiConnectionForm";
import { AiRagPanel } from "../../components/Admin/AiSettings/AiRagPanel";
import { AiStatusPanel } from "../../components/Admin/AiSettings/AiStatusPanel";
import { AiTipsPanel } from "../../components/Admin/AiSettings/AiTipsPanel";
import { AiRecentActivities } from "../../components/Admin/AiSettings/AiRecentActivities";
import { AiChunkViewerModal } from "../../components/Admin/AiSettings/AiChunkViewerModal";

export interface AiModelsWhitelist {
  gemini: {
    default_chat_model: string;
    default_embedding_model: string;
    chat_models: string[];
    embedding_models: string[];
  };
  ollama: {
    default_chat_model: string;
    default_embedding_model: string;
    chat_models: string[];
    embedding_models: string[];
  };
}

export interface AiSettings {
  configured: boolean;
  driver: "gemini" | "ollama";
  chat_model: string;
  embedding_model: string;
  api_key_configured: boolean;
  status: string;
}

export default function AiSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isChunkViewerOpen, setIsChunkViewerOpen] = useState(false);

  // Initialize from cache if available
  const [models, setModels] = useState<AiModelsWhitelist | null>(() => {
    const cached = localStorage.getItem("ai_models_cache");
    return cached ? JSON.parse(cached) : null;
  });

  const [settings, setSettings] = useState<AiSettings | null>(() => {
    const cached = localStorage.getItem("ai_settings_cache");
    return cached ? JSON.parse(cached) : null;
  });

  const [indexingStats, setIndexingStats] = useState<{
    total_papers: number,
    chunked_papers: number,
    unchunked_papers: number,
    total_chunks?: number,
    recent_activities?: { time: string, message: string, type: string }[],
    is_running?: boolean
  } | null>(() => {
    const cached = localStorage.getItem("ai_stats_cache");
    return cached ? JSON.parse(cached) : null;
  });

  // Form State
  const [driver, setDriver] = useState<"gemini" | "ollama">(() => {
    const cached = localStorage.getItem("ai_settings_cache");
    return cached ? JSON.parse(cached).driver : "gemini";
  });

  const [indexLimit, setIndexLimit] = useState<string>("100");
  const [indexing, setIndexing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434");
  const [chatModel, setChatModel] = useState<string>(() => {
    const cachedSettings = localStorage.getItem("ai_settings_cache");
    const cachedModels = localStorage.getItem("ai_models_cache");
    if (cachedSettings && cachedModels) {
      const parsedS = JSON.parse(cachedSettings);
      const parsedM = JSON.parse(cachedModels);
      return parsedS.chat_model || parsedM[parsedS.driver]?.default_chat_model || "";
    }
    return "";
  });
  const [embeddingModel, setEmbeddingModel] = useState<string>(() => {
    const cachedSettings = localStorage.getItem("ai_settings_cache");
    const cachedModels = localStorage.getItem("ai_models_cache");
    if (cachedSettings && cachedModels) {
      const parsedS = JSON.parse(cachedSettings);
      const parsedM = JSON.parse(cachedModels);
      return parsedS.embedding_model || parsedM[parsedS.driver]?.default_embedding_model || "";
    }
    return "";
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // Connection Status (null = not tested yet)
  const [connectionStatus, setConnectionStatus] = useState<"valid" | "invalid" | "rate_limited" | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [activityPage, setActivityPage] = useState(1);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [modelsRes, settingsRes, statsRes] = await Promise.all([
        api.get<AiModelsWhitelist>("/admin/settings/ai/models"),
        api.get<AiSettings>("/admin/settings/ai"),
        api.get<any>("/admin/settings/ai/indexing-stats").catch(() => null)
      ]);

      setModels(modelsRes);
      localStorage.setItem("ai_models_cache", JSON.stringify(modelsRes));

      setSettings(settingsRes);
      localStorage.setItem("ai_settings_cache", JSON.stringify(settingsRes));

      if (statsRes) {
        setIndexingStats(statsRes);
        localStorage.setItem("ai_stats_cache", JSON.stringify(statsRes));

        // Automatically stop auto-refresh if no jobs are running in backend
        if (statsRes.is_running === false && statsRes.unchunked_papers > 0) {
          setAutoRefresh(false);

          if (searchParams.get("auto_index") === "true") {
            setTimeout(() => {
              handleStartIndexing();
            }, 500);
            setSearchParams({}); // Clear param
          }
        }
      }

      // Initialize form
      setDriver(settingsRes.driver);

      // Update models if not already set by cache or if cache was empty
      setChatModel(settingsRes.chat_model || modelsRes[settingsRes.driver].default_chat_model);
      setEmbeddingModel(settingsRes.embedding_model || modelsRes[settingsRes.driver].default_embedding_model);

      setApiKey(""); // Don't prefill api key
    } catch (err: any) {
      toast.error("Lỗi khi tải cấu hình AI: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsOnly = async () => {
    try {
      const statsRes = await api.get<any>("/admin/settings/ai/indexing-stats");
      setIndexingStats(statsRes);
      localStorage.setItem("ai_stats_cache", JSON.stringify(statsRes));
      if (statsRes.is_running === false && statsRes.unchunked_papers > 0) {
        setAutoRefresh(false);
      }
      if (statsRes.unchunked_papers === 0) {
        setAutoRefresh(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Poll for indexing stats
  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchStatsOnly, 3000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle Driver Change
  const handleDriverChange = (newDriver: "gemini" | "ollama") => {
    setDriver(newDriver);
    if (models) {
      setChatModel(models[newDriver].default_chat_model);
      setEmbeddingModel(models[newDriver].default_embedding_model);
    }
    setConnectionStatus(null);
  };

  const preparePayload = () => {
    const payload: any = {
      driver,
      chat_model: chatModel,
      embedding_model: embeddingModel,
    };

    if (driver === "gemini") {
      if (apiKey) {
        payload.api_key = apiKey;
      } else if (!settings?.api_key_configured) {
        throw new Error("Vui lòng nhập API Key cho Gemini.");
      }
    } else if (driver === "ollama") {
      payload.base_url = baseUrl;
    }

    return payload;
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setConnectionStatus(null);
      const payload = preparePayload();

      const res = await api.post<{ message: string; status: string }>("/admin/settings/ai/test", payload);
      setConnectionStatus("valid");
      setConnectionMessage(res.message);
      toast.success("Kết nối thành công!");
    } catch (err: any) {
      if (err.status === 429) {
        setConnectionStatus("rate_limited");
      } else {
        setConnectionStatus("invalid");
      }
      setConnectionMessage(err.message || "Kết nối thất bại.");
      toast.error(err.message || "Lỗi khi kiểm tra kết nối.");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = preparePayload();

      await api.post("/admin/settings/ai", payload);
      toast.success("Đã lưu cấu hình AI thành công!");
      await fetchSettings();
      setConnectionStatus(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ cấu hình AI?")) return;
    try {
      setResetting(true);
      await api.delete("/admin/settings/ai");
      toast.success("Đã xóa cấu hình AI.");
      await fetchSettings();
      setConnectionStatus(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa cấu hình.");
    } finally {
      setResetting(false);
    }
  };

  const handleStartIndexing = async () => {
    try {
      setIndexing(true);
      const res = await api.post<any>("/admin/settings/ai/start-indexing");
      toast.success(res.message || "Đã đẩy toàn bộ vào Queue!");
      setAutoRefresh(true);
      await fetchStatsOnly();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi bắt đầu Indexing.");
    } finally {
      setIndexing(false);
    }
  };

  const handleStopIndexing = async () => {
    try {
      setIndexing(true);
      const res = await api.post<any>("/admin/settings/ai/stop-indexing");
      toast.success(res.message || "Đã dừng tiến trình ngầm!");
      setAutoRefresh(false);
      await fetchStatsOnly();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi dừng tiến trình.");
    } finally {
      setIndexing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      {/* Lớp màng mỏng thông báo đang đồng bộ ngầm nếu cần */}
      {loading && !models && (
        <div className="absolute top-0 right-0 flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full font-medium">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang đồng bộ...
        </div>
      )}

      <div>
        <h1 className="text-3xl font-display font-black text-on-background tracking-tight">Cấu hình AI (LLM)</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl">
          Quản lý nhà cung cấp AI, lựa chọn model Chat và Embedding cho toàn hệ thống RAG.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AiProviderSelector driver={driver} onDriverChange={handleDriverChange} />

          <AiConnectionForm
            driver={driver}
            apiKey={apiKey}
            setApiKey={setApiKey}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            baseUrl={baseUrl}
            setBaseUrl={setBaseUrl}
            chatModel={chatModel}
            setChatModel={setChatModel}
            embeddingModel={embeddingModel}
            setEmbeddingModel={setEmbeddingModel}
            models={models}
            settings={settings}
            handleSave={handleSave}
            saving={saving}
          />

          <AiRagPanel
            indexingStats={indexingStats}
            indexing={indexing}
            handleStartIndexing={handleStartIndexing}
            handleStopIndexing={handleStopIndexing}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            loading={loading}
            onOpenChunkViewer={() => setIsChunkViewerOpen(true)}
          />
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <AiStatusPanel
            connectionStatus={connectionStatus}
            connectionMessage={connectionMessage}
            settings={settings}
            testing={testing}
            saving={saving}
            resetting={resetting}
            handleTestConnection={handleTestConnection}
            handleSave={handleSave}
            handleReset={handleReset}
          />

          <AiTipsPanel driver={driver} />

          <AiRecentActivities
            activities={indexingStats?.recent_activities}
            activityPage={activityPage}
            setActivityPage={setActivityPage}
          />
        </div>
      </div>
      
      <AiChunkViewerModal 
        isOpen={isChunkViewerOpen} 
        onClose={() => setIsChunkViewerOpen(false)} 
      />
    </div>
  );
}
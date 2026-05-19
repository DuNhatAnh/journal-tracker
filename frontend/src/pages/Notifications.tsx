import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, History, Info, TrendingUp, BookOpenText, LibraryBig, ArrowRight } from "lucide-react";
import { api } from "@/src/lib/api";

type NotificationItem = {
  id: string;
  type?: string;
  data: Record<string, any>;
  created_at: string;
  is_read?: boolean;
  read_at?: string | null;
};

const iconMap: Record<string, typeof BellRing> = {
  trend: TrendingUp,
  publication: BookOpenText,
  summary: LibraryBig,
  alert: Info,
  activity: History,
};

function getNotificationType(notification: NotificationItem) {
  const type = notification.data?.type || notification.type || "";

  if (typeof type === "string") {
    if (type.toLowerCase().includes("trend") || type.toLowerCase().includes("xu hướng")) return "trend";
    if (type.toLowerCase().includes("publication") || type.toLowerCase().includes("article") || type.toLowerCase().includes("paper")) return "publication";
    if (type.toLowerCase().includes("summary") || type.toLowerCase().includes("tóm tắt")) return "summary";
    if (type.toLowerCase().includes("alert") || type.toLowerCase().includes("warning") || type.toLowerCase().includes("cảnh báo")) return "alert";
  }

  return "activity";
}

function getNotificationTitle(notification: NotificationItem) {
  return (
    notification.data?.title ||
    notification.data?.subject ||
    notification.data?.heading ||
    notification.data?.message ||
    "Thông báo mới"
  );
}

function getNotificationDescription(notification: NotificationItem) {
  return (
    notification.data?.description ||
    notification.data?.body ||
    notification.data?.message ||
    ""
  );
}

function formatTimeAgo(dateStr: string) {
  const createdAt = new Date(dateStr).getTime();
  const diffMinutes = Math.floor((Date.now() - createdAt) / 60000);

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function getDayLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();

  const isSameDay = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay) return "Hôm nay";
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ data: NotificationItem[] }>("/notifications");
      setNotifications(response.data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setError(null);

    try {
      await api.post("/notifications/read-all");
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || "Không thể đánh dấu tất cả.");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const groupedNotifications = notifications.reduce((groups: Record<string, NotificationItem[]>, notification) => {
    const label = getDayLabel(notification.created_at);
    groups[label] = groups[label] || [];
    groups[label].push(notification);
    return groups;
  }, {} as Record<string, NotificationItem[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-8 gap-4">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface">Thông báo</h2>
          <p className="text-on-surface-variant mt-2 font-medium">Cập nhật các xu hướng nghiên cứu mới nhất và cảnh báo hệ thống.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={notifications.length === 0 || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" /> Đánh dấu tất cả đã đọc
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-2xl bg-error-container/20 border border-error/40 text-error text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
          <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
          <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-surface p-10 text-center text-on-surface-variant">
          <p className="text-lg font-semibold text-on-surface">Chưa có thông báo mới.</p>
          <p className="mt-2 text-sm">Hệ thống sẽ hiển thị khi có cảnh báo hoặc cập nhật từ dữ liệu của bạn.</p>
        </div>
      ) : (
        (Object.entries(groupedNotifications) as [string, NotificationItem[]][]).map(([label, items]) => (
          <section key={label} className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-4">
              {items.map((notification) => {
                const SectionIcon = iconMap[getNotificationType(notification)] || BellRing;
                const title = getNotificationTitle(notification);
                const description = getNotificationDescription(notification);
                const timeAgo = formatTimeAgo(notification.created_at);
                const unread = !notification.is_read && !notification.read_at;

                return (
                  <div
                    key={notification.id}
                    className={`glass-panel rounded-2xl p-6 flex gap-6 relative overflow-hidden group transition-all ${unread ? "border border-tertiary/30 bg-tertiary/5" : "bg-surface"}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <SectionIcon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                        <h3 className="text-xl font-bold text-on-surface leading-tight">{title}</h3>
                        <span className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">{timeAgo}</span>
                      </div>
                      {description && <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>}
                      {unread && (
                        <span className="mt-4 inline-flex px-2 py-1 rounded-full bg-primary/10 text-[10px] font-semibold uppercase tracking-widest text-primary">
                          Chưa đọc
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

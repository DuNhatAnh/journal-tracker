import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, History, Info, TrendingUp, BookOpenText, LibraryBig, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/src/lib/api";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";

type NotificationItem = {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  data?: Record<string, any>;
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
  const type = notification.type || notification.data?.type || "";

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
    notification.title ||
    notification.data?.title ||
    notification.data?.subject ||
    notification.data?.heading ||
    notification.data?.message ||
    "Thông báo mới"
  );
}

function getNotificationDescription(notification: NotificationItem) {
  return (
    notification.content ||
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // useApiQuery for the first page of notifications
  const { 
    data: firstPageData, 
    loading: loading, 
    setData: setFirstPageData, 
    refetch: refetchFirstPage 
  } = useApiQuery<{ data: NotificationItem[], current_page: number, last_page: number }>(
    "/notifications?page=1&per_page=5",
    { persist: true }
  );

  // Synchronize firstPageData with local notifications state
  useEffect(() => {
    if (firstPageData) {
      const newData = firstPageData.data || [];
      const isLastPage = (firstPageData.current_page || 1) >= (firstPageData.last_page || 1);
      
      if (page === 1) {
        setNotifications(newData);
        setHasMore(!isLastPage && newData.length > 0);
      }
    }
  }, [firstPageData, page]);

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      api.patch(`/notifications/${notification.id}/read`).catch(console.error);
      
      // Update local state instantly
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
      
      // Update firstPageData cache if notification is part of page 1
      if (firstPageData) {
        const updatedList = firstPageData.data.map((n: any) => 
          n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        );
        const updatedData = { ...firstPageData, data: updatedList };
        setFirstPageData(updatedData);
        queryCache.set("/notifications?page=1&per_page=5", updatedData);
      }
    }
  };

  const handleActionClick = (notification: NotificationItem) => {
    const filterType = notification.data?.filter_type;
    const filterValue = notification.data?.filter_value;

    if (filterType && filterValue) {
      if (filterType === "journals") {
        navigate(`/search?journal=${Array.isArray(filterValue) ? filterValue.join(",") : filterValue}`);
      } else if (filterType === "keywords") {
        navigate(`/search?keyword=${Array.isArray(filterValue) ? filterValue.join(",") : filterValue}`);
      } else if (filterType === "trending") {
        navigate(`/search?sort=bookmarks_desc`);
      }
    }
  };

  const loadMoreNotifications = async () => {
    setLoadingMore(true);
    setError(null);
    const nextPage = page + 1;

    try {
      const response = await api.get<{ data: NotificationItem[], current_page: number, last_page: number }>(
        `/notifications?page=${nextPage}&per_page=5`
      );
      const newData = response.data || [];
      const isLastPage = (response.current_page || 1) >= (response.last_page || 1);
      
      setNotifications(prev => [...prev, ...newData]);
      setHasMore(!isLastPage && newData.length > 0);
      setPage(nextPage);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông báo.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    setError(null);
    try {
      await api.post("/notifications/read-all");
      // Update local state instantly
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      
      // Update firstPageData in cache
      if (firstPageData) {
        const updatedData = {
          ...firstPageData,
          data: firstPageData.data.map((n: any) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        };
        setFirstPageData(updatedData);
        queryCache.set("/notifications?page=1&per_page=5", updatedData);
      }
      refetchFirstPage();
    } catch (err: any) {
      setError(err.message || "Không thể đánh dấu tất cả.");
    }
  };

  const groupedNotifications = notifications.reduce((groups: Record<string, NotificationItem[]>, notification: NotificationItem) => {
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
        Object.entries(groupedNotifications).map(([label, items]) => {
          const notificationItems = items as NotificationItem[];
          return (
            <section key={label} className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="space-y-4">
                {notificationItems.map((notification: NotificationItem) => {
                const SectionIcon = iconMap[getNotificationType(notification)] || BellRing;
                const title = getNotificationTitle(notification);
                const description = getNotificationDescription(notification);
                const timeAgo = formatTimeAgo(notification.created_at);
                const unread = !notification.is_read && !notification.read_at;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`glass-panel rounded-2xl p-6 flex gap-6 relative overflow-hidden group transition-all cursor-pointer hover:border-primary/50 ${unread ? "border border-tertiary/30 bg-tertiary/5" : "bg-surface"}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <SectionIcon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                        <h3 className="text-xl font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">{title}</h3>
                        <span className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">{timeAgo}</span>
                      </div>
                      {description && <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>}
                      {unread && (
                        <span className="mt-4 inline-flex px-2 py-1 rounded-full bg-primary/10 text-[10px] font-semibold uppercase tracking-widest text-primary w-fit">
                          Chưa đọc
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );})
      )}

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMoreNotifications}
            disabled={loadingMore}
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-on-surface text-sm font-bold hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {loadingMore ? "Đang tải..." : "Tải thêm thông báo"}
          </button>
        </div>
      )}

      {/* Quick Info Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedNotification(null)}>
          <div 
            className="w-full max-w-lg bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-on-surface">Thông tin nhanh</h3>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-lg font-semibold text-on-surface">{getNotificationTitle(selectedNotification)}</p>
              <p className="text-on-surface-variant leading-relaxed">
                {getNotificationDescription(selectedNotification)}
              </p>
              {selectedNotification.data?.filter_value && (
                <div className="p-4 rounded-xl bg-surface-container border border-white/5 flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">Gợi ý hành động:</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Hệ thống đã chuẩn bị sẵn bộ lọc cho "{Array.isArray(selectedNotification.data.filter_value) ? selectedNotification.data.filter_value.join(", ") : selectedNotification.data.filter_value}".
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface hover:bg-white/5 transition-colors"
              >
                Đóng
              </button>
              {selectedNotification.data?.filter_type && (
                <button 
                  onClick={() => handleActionClick(selectedNotification)}
                  className="px-5 py-2.5 rounded-full font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  Khám phá ngay <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

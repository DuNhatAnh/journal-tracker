import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api } from "@/src/lib/api";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";
import { NotificationHeader } from "./components/Notifications/NotificationHeader";
import { NotificationItem, NotificationItemCard, getNotificationType } from "./components/Notifications/NotificationItemCard";
import { NotificationDetailModal } from "./components/Notifications/NotificationDetailModal";
import { NotificationSkeleton } from "./components/Notifications/NotificationSkeleton";

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

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "publication" | "trend" | "alert">("all");

  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmation dialog states
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const [confirmDeleteRead, setConfirmDeleteRead] = useState(false);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);

  // useApiQuery for the first page of notifications (persist: false ensures loading skeleton shows on entry)
  const { 
    data: firstPageData, 
    loading: loading, 
    setData: setFirstPageData, 
    refetch: refetchFirstPage 
  } = useApiQuery<{ data: NotificationItem[], current_page: number, last_page: number }>(
    "/notifications?page=1&per_page=5",
    { persist: false }
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
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      
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
      } else if (filterType === "authors") {
        navigate(`/search?author=${Array.isArray(filterValue) ? filterValue.join(",") : filterValue}`);
      } else if (filterType === "trending") {
        navigate(`/search?sort=bookmarks_desc`);
      }
    }
    setSelectedNotification(null);
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
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      
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

  const handleDeleteRead = async () => {
    setError(null);
    try {
      await api.delete("/notifications/read");
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      
      // Update local state instantly by keeping only unread notifications
      setNotifications(prev => prev.filter(n => !n.is_read && !n.read_at));
      
      // Update firstPageData in cache
      if (firstPageData) {
        const updatedList = firstPageData.data.filter((n: any) => !n.is_read && !n.read_at);
        const updatedData = { ...firstPageData, data: updatedList };
        setFirstPageData(updatedData);
        queryCache.set("/notifications?page=1&per_page=5", updatedData);
      }
      refetchFirstPage();
    } catch (err: any) {
      setError(err.message || "Không thể xóa thông báo đã đọc.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setError(null);
    try {
      await api.post("/notifications/delete-multiple", { ids: Array.from(selectedIds) });
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      
      if (firstPageData) {
        const updatedList = firstPageData.data.filter((n: any) => !selectedIds.has(n.id));
        const updatedData = { ...firstPageData, data: updatedList };
        setFirstPageData(updatedData);
        queryCache.set("/notifications?page=1&per_page=5", updatedData);
      }
      setSelectedIds(new Set());
      setSelectionMode(false);
      refetchFirstPage();
    } catch (err: any) {
      setError(err.message || "Không thể xóa các thông báo được chọn.");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Local filtering logic
  const filteredNotifications = notifications.filter(notification => {
    // 1. Text Search Filter
    const title = (notification.title || "").toLowerCase();
    const content = (notification.content || "").toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || content.includes(searchTerm.toLowerCase());

    // 2. Read/Unread Status Filter
    const isUnread = !notification.is_read && !notification.read_at;
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "unread") {
      matchesStatus = isUnread;
    } else if (statusFilter === "read") {
      matchesStatus = !isUnread;
    }

    // 3. Category Type Filter
    const type = getNotificationType(notification);
    let matchesType = false;
    if (typeFilter === "all") {
      matchesType = true;
    } else if (typeFilter === "publication") {
      matchesType = type === "publication";
    } else if (typeFilter === "trend") {
      matchesType = type === "trend";
    } else if (typeFilter === "alert") {
      matchesType = type === "alert" || type === "activity";
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  const groupedNotifications = filteredNotifications.reduce((groups: Record<string, NotificationItem[]>, notification: NotificationItem) => {
    const label = getDayLabel(notification.created_at);
    groups[label] = groups[label] || [];
    groups[label].push(notification);
    return groups;
  }, {} as Record<string, NotificationItem[]>);

  const hasUnread = notifications.some(n => !n.is_read && !n.read_at);
  const hasRead = notifications.some(n => n.is_read || n.read_at);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <NotificationHeader 
        onMarkAllRead={() => setConfirmMarkAll(true)} 
        disableMarkAll={notifications.length === 0 || loading || !hasUnread} 
        onDeleteRead={() => setConfirmDeleteRead(true)}
        disableDeleteRead={notifications.length === 0 || loading || !hasRead}
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        onToggleSelectionMode={() => {
          setSelectionMode(!selectionMode);
          if (selectionMode) setSelectedIds(new Set());
        }}
        onDeleteSelected={() => setConfirmDeleteSelected(true)}
        onSelectAll={() => {
          const allIds = notifications.map(n => n.id);
          if (selectedIds.size === allIds.length) {
            setSelectedIds(new Set());
          } else {
            setSelectedIds(new Set(allIds));
          }
        }}
      />

      {/* Control Bar (Search & Filters) */}
      {notifications.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-surface-container/40 p-4 rounded-3xl border border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Tìm kiếm trong thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-low border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface-variant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filters */}
            <div className="flex bg-surface-container-low p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "all"
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter("unread")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "unread"
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Chưa đọc
              </button>
              <button
                onClick={() => setStatusFilter("read")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "read"
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Đã đọc
              </button>
            </div>

            {/* Type Filters */}
            <div className="flex bg-surface-container-low p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  typeFilter === "all"
                    ? "bg-secondary-container/40 text-on-secondary-container border border-primary/25"
                    : "text-on-surface-variant hover:text-on-surface border border-transparent"
                }`}
              >
                Tất cả loại
              </button>
              <button
                onClick={() => setTypeFilter("publication")}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  typeFilter === "publication"
                    ? "bg-secondary-container/40 text-on-secondary-container border border-primary/25"
                    : "text-on-surface-variant hover:text-on-surface border border-transparent"
                }`}
              >
                Bài viết mới
              </button>
              <button
                onClick={() => setTypeFilter("trend")}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  typeFilter === "trend"
                    ? "bg-secondary-container/40 text-on-secondary-container border border-primary/25"
                    : "text-on-surface-variant hover:text-on-surface border border-transparent"
                }`}
              >
                Xu hướng
              </button>
              <button
                onClick={() => setTypeFilter("alert")}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  typeFilter === "alert"
                    ? "bg-secondary-container/40 text-on-secondary-container border border-primary/25"
                    : "text-on-surface-variant hover:text-on-surface border border-transparent"
                }`}
              >
                Hệ thống
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-error-container/20 border border-error/40 text-error text-sm font-medium text-left">
          {error}
        </div>
      )}

      {loading ? (
        <NotificationSkeleton />
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-surface p-10 text-center text-on-surface-variant">
          <p className="text-lg font-semibold text-on-surface">Chưa có thông báo mới.</p>
          <p className="mt-2 text-sm">Hệ thống sẽ hiển thị khi có cảnh báo hoặc cập nhật từ dữ liệu của bạn.</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-surface p-10 text-center text-on-surface-variant">
          <p className="text-lg font-semibold text-on-surface">Không tìm thấy thông báo phù hợp.</p>
          <p className="mt-2 text-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc điều kiện bộ lọc của bạn.</p>
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
                {notificationItems.map((notification) => (
                  <NotificationItemCard
                    key={notification.id}
                    notification={notification}
                    onClick={selectionMode ? () => handleToggleSelect(notification.id) : handleNotificationClick}
                    selectable={selectionMode}
                    isSelected={selectedIds.has(notification.id)}
                    onToggleSelect={() => handleToggleSelect(notification.id)}
                  />
                ))}
              </div>
            </section>
          );
        })
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

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onActionClick={handleActionClick}
      />

      {/* Confirm Mark All Read Modal */}
      {confirmMarkAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmMarkAll(false)}>
          <div className="w-full max-w-md bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setConfirmMarkAll(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-2xl font-bold text-on-surface mb-3 text-left">Đọc tất cả</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed text-left mb-8">
              Bạn có chắc chắn muốn đánh dấu toàn bộ thông báo chưa đọc là đã đọc không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmMarkAll(false)}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface hover:bg-white/5 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setConfirmMarkAll(false);
                  handleMarkAllRead();
                }}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-primary text-white hover:bg-primary/95 transition-colors shadow-lg shadow-primary/25"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Read Modal */}
      {confirmDeleteRead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDeleteRead(false)}>
          <div className="w-full max-w-md bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setConfirmDeleteRead(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-2xl font-bold text-on-surface mb-3 text-left">Xóa thông báo đã đọc</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed text-left mb-8">
              Hành động này sẽ xóa vĩnh viễn toàn bộ các thông báo đã đọc khỏi hệ thống của bạn. Bạn có chắc chắn muốn thực hiện không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteRead(false)}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface hover:bg-white/5 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setConfirmDeleteRead(false);
                  handleDeleteRead();
                }}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-error text-white hover:bg-error/95 transition-colors shadow-lg shadow-error/25"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Selected Modal */}
      {confirmDeleteSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDeleteSelected(false)}>
          <div className="w-full max-w-md bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setConfirmDeleteSelected(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-2xl font-bold text-on-surface mb-3 text-left">Xóa {selectedIds.size} thông báo</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed text-left mb-8">
              Hành động này sẽ xóa vĩnh viễn {selectedIds.size} thông báo đã chọn khỏi hệ thống. Bạn có chắc chắn muốn thực hiện không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteSelected(false)}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface hover:bg-white/5 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setConfirmDeleteSelected(false);
                  handleDeleteSelected();
                }}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-error text-white hover:bg-error/95 transition-colors shadow-lg shadow-error/25"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

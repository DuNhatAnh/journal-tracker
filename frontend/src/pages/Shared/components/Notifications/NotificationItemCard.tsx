import { BellRing, TrendingUp, BookOpenText, LibraryBig, Info, History } from "lucide-react";

export type NotificationItem = {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  data?: Record<string, any>;
  created_at: string;
  is_read?: boolean;
  read_at?: string | null;
};

interface NotificationItemCardProps {
  notification: NotificationItem;
  onClick: (notification: NotificationItem) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const iconMap: Record<string, typeof BellRing> = {
  trend: TrendingUp,
  publication: BookOpenText,
  summary: LibraryBig,
  alert: Info,
  activity: History,
};

export function getNotificationType(notification: NotificationItem) {
  const type = notification.type || notification.data?.type || "";

  if (typeof type === "string") {
    if (type.toLowerCase().includes("trend") || type.toLowerCase().includes("xu hướng")) return "trend";
    if (type.toLowerCase().includes("publication") || type.toLowerCase().includes("article") || type.toLowerCase().includes("paper")) return "publication";
    if (type.toLowerCase().includes("summary") || type.toLowerCase().includes("tóm tắt")) return "summary";
    if (type.toLowerCase().includes("alert") || type.toLowerCase().includes("warning") || type.toLowerCase().includes("cảnh báo")) return "alert";
  }

  return "activity";
}

export function getNotificationTitle(notification: NotificationItem) {
  return (
    notification.title ||
    notification.data?.title ||
    notification.data?.subject ||
    notification.data?.heading ||
    notification.data?.message ||
    "Thông báo mới"
  );
}

export function getNotificationDescription(notification: NotificationItem) {
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

export function NotificationItemCard({ notification, onClick, selectable, isSelected, onToggleSelect }: NotificationItemCardProps) {
  const SectionIcon = iconMap[getNotificationType(notification)] || BellRing;
  const title = getNotificationTitle(notification);
  const description = getNotificationDescription(notification);
  const timeAgo = formatTimeAgo(notification.created_at);
  const unread = !notification.is_read && !notification.read_at;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`glass-panel rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6 relative overflow-hidden group transition-all cursor-pointer hover:border-primary/50 ${
        unread ? "border border-tertiary/30 bg-tertiary/5" : "bg-surface"
      }`}
    >
      {selectable && (
        <div 
          className="flex items-center flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect();
          }}
        >
          <input 
            type="checkbox" 
            checked={!!isSelected}
            onChange={() => {}}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 cursor-pointer"
          />
        </div>
      )}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <SectionIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
          <h3 className="text-xl font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">{timeAgo}</span>
        </div>
        {description && <p className="text-sm text-on-surface-variant leading-relaxed mt-1">{description}</p>}
        {unread && (
          <span className="mt-4 inline-flex px-2 py-1 rounded-full bg-error/15 text-[10px] font-semibold uppercase tracking-widest text-error w-fit">
            Chưa đọc
          </span>
        )}
      </div>
    </div>
  );
}

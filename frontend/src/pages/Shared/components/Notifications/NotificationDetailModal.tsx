import { X, Info, ArrowRight } from "lucide-react";
import { NotificationItem, getNotificationTitle, getNotificationDescription } from "./NotificationItemCard";

interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  onClose: () => void;
  onActionClick: (notification: NotificationItem) => void;
}

export function NotificationDetailModal({ notification, onClose, onActionClick }: NotificationDetailModalProps) {
  if (!notification) return null;

  const title = getNotificationTitle(notification);
  const description = getNotificationDescription(notification);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
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

        <div className="space-y-4 mb-8 text-left">
          <p className="text-lg font-semibold text-on-surface">{title}</p>
          <p className="text-on-surface-variant leading-relaxed">{description}</p>
          {notification.data?.filter_value && (
            <div className="p-4 rounded-xl bg-surface-container border border-white/5 flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-on-surface">Gợi ý hành động:</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Hệ thống đã chuẩn bị sẵn bộ lọc cho "
                  {Array.isArray(notification.data.filter_value)
                    ? notification.data.filter_value.join(", ")
                    : notification.data.filter_value}
                  ".
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface hover:bg-white/5 transition-colors"
          >
            Đóng
          </button>
          {notification.data?.filter_type && (
            <button
              onClick={() => onActionClick(notification)}
              className="px-5 py-2.5 rounded-full font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              Khám phá ngay <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

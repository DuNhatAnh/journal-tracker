import React, { memo } from "react";
import { Database } from "lucide-react";

interface RecentActivity {
  time: string;
  message: string;
  type: string;
}

interface Props {
  activities?: RecentActivity[];
  activityPage: number;
  setActivityPage: (page: number | ((p: number) => number)) => void;
}

export const AiRecentActivities = memo(function AiRecentActivities({ activities, activityPage, setActivityPage }: Props) {
  if (!activities || activities.length === 0) return null;

  const totalPages = Math.ceil(activities.length / 3);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 h-full flex flex-col">
      <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
        <Database className="w-4 h-4 text-primary" /> Hoạt động gần đây
      </h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {activities.slice((activityPage - 1) * 3, activityPage * 3).map((act, i) => (
          <div key={i} className={`p-3 border rounded-lg ${act.type === 'error' ? 'bg-error/10 border-error/20' : 'bg-green-500/10 border-green-500/20'}`}>
            <p className={`text-xs font-bold mb-1 ${act.type === 'error' ? 'text-error' : 'text-green-500'}`}>
              {new Date(act.time + 'Z').toLocaleString('vi-VN')}
            </p>
            <p className="text-xs text-on-surface-variant break-words">
              {act.message}
            </p>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center text-xs">
          <button 
            disabled={activityPage === 1}
            onClick={() => setActivityPage(p => p - 1)}
            className="px-3 py-1.5 bg-surface-container rounded-lg hover:bg-surface-container-highest disabled:opacity-50 transition-colors font-medium text-on-surface"
          >
            Trang trước
          </button>
          <span className="text-on-surface-variant font-medium">
            Trang {activityPage} / {totalPages}
          </span>
          <button 
            disabled={activityPage === totalPages}
            onClick={() => setActivityPage(p => p + 1)}
            className="px-3 py-1.5 bg-surface-container rounded-lg hover:bg-surface-container-highest disabled:opacity-50 transition-colors font-medium text-on-surface"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
});

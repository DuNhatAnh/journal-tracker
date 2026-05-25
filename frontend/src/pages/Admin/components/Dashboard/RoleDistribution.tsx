import React from "react";
import { Link } from "react-router-dom";
import { UserCog, ArrowRight, Shield, TrendingUp, BookOpen, GraduationCap, Users } from "lucide-react";
import { AdminStats } from "../../types";

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Quản trị viên", icon: Shield, color: "text-error" },
  researcher: { label: "Nhà nghiên cứu", icon: TrendingUp, color: "text-primary" },
  lecturer: { label: "Giảng viên", icon: BookOpen, color: "text-secondary" },
  student: { label: "Sinh viên", icon: GraduationCap, color: "text-tertiary" },
};

type RoleDistributionProps = {
  stats: AdminStats | null;
  loading: boolean;
};

export default function RoleDistribution({ stats, loading }: RoleDistributionProps) {
  return (
    <div className="lg:col-span-5 glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <UserCog className="w-5 h-5 text-primary" />
          Phân bổ vai trò người dùng
        </h3>
        <Link to="/admin/users" className="text-xs font-bold text-primary hover:text-primary/70 flex items-center gap-1 transition-colors">
          Quản lý <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : stats?.users_by_role && stats.users_by_role.length > 0 ? (
        <div className="space-y-3">
          {stats.users_by_role.map((item) => {
            const config = roleConfig[item.role] ?? { label: item.role, icon: Users, color: "text-on-surface-variant" };
            const total = stats.total_users || 1;
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={item.role} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-semibold text-on-surface">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${config.color}`}>{item.count}</span>
                    <span className="text-xs text-on-surface-variant">({pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${config.color.replace("text-", "bg-")}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant text-center py-6">Chưa có dữ liệu người dùng.</p>
      )}
    </div>
  );
}

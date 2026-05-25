import React from "react";
import { UserItem } from "../../types";
import { ROLE_CONFIG } from "./constants";

type UsersStatsProps = {
  users: UserItem[];
  loading: boolean;
};

export default function UsersStats({ users, loading }: UsersStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
        const count = users.filter(u => u.role === role).length;
        return (
          <div key={role} className={`glass-panel rounded-2xl p-4 border ${cfg.border} bg-surface flex items-center gap-3`}>
            <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
              <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <p className={`text-xl font-black font-display ${cfg.color}`}>{loading ? "—" : count}</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{cfg.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

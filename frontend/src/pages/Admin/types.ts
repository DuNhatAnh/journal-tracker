export type AdminStats = {
  total_users: number;
  total_papers: number;
  total_journals: number;
  total_keywords: number;
  total_api_sources: number;
  active_api_sources: number;
  total_sync_logs: number;
  last_sync_at: string | null;
  users_by_role: { role: string; count: number }[];
  recent_sync_logs: {
    id: number;
    status: string;
    papers_synced: number;
    created_at: string;
    api_source?: { name: string };
  }[];
};

export type ChartData = {
  papers_per_year: { year: number; total: number }[];
  top_journals: { name: string; total: number }[];
  top_keywords: { name: string; total: number }[];
};

export type ApiSource = {
  id: number;
  name: string;
  api_url: string;
  is_active: boolean;
  config?: Record<string, any> | null;
  updated_at: string;
};

export type SyncLog = {
  id: number;
  api_source_id: number;
  status: string;
  papers_synced: number;
  error_message: string | null;
  created_at: string;
  api_source?: ApiSource;
};

export type PaginatedLogs = {
  data: SyncLog[];
  current_page: number;
  last_page: number;
  total: number;
};

export type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

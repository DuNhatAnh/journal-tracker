export interface PaperDetail {
  id: number;
  title: string;
  journal: string;
  authors: string;
  time: string;
  impact: number;
  citations: number;
  doi?: string;
  abstract?: string;
  keywords?: { id: number; name: string }[];
}

export interface DashboardData {
  stats: { label: string; value: string; trend: string }[];
  trendingTopics: { id: number; name: string; papers: string; change: string; data: number[] }[];
  recentPapers: PaperDetail[];
  recommendedPapers: (PaperDetail & { match: string })[];
  topJournals: { id: number; name: string; field: string; initial: string; color: string; issn?: string; issn_note?: string; source_type?: string; publisher?: string; url?: string; papers_count?: number; impact_factor?: number; source?: string }[];
  fieldsDistribution: { name: string; value: number }[];
  topJournalsUpdatedAt?: string;
  recentPapersUpdatedAt?: string;
  latestYear: number;
}

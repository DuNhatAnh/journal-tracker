import { Shield, TrendingUp, BookOpen, GraduationCap } from "lucide-react";

export const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  admin:      { label: "Admin",       icon: Shield,       color: "text-error",     bg: "bg-error/10",     border: "border-error/20" },
  researcher: { label: "Researcher",  icon: TrendingUp,   color: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20" },
  lecturer:   { label: "Giảng viên",  icon: BookOpen,     color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  student:    { label: "Sinh viên",   icon: GraduationCap,color: "text-tertiary",  bg: "bg-tertiary/10",  border: "border-tertiary/20" },
};

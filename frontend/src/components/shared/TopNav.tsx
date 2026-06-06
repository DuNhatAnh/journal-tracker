import { Search } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function TopNav() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const hiddenSearchPaths = ["/settings", "/profile", "/search"];
  const isSearchHidden = hiddenSearchPaths.includes(location.pathname);

  if (isSearchHidden) {
    return null;
  }

  return (
    <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-40 bg-surface/70 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all duration-300 min-h-[72px]">
      <div className="flex-1 max-w-xl">
        <div className="relative group animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder='Tìm kiếm học thuật (Hỗ trợ AND, OR, NOT, "cụm từ")' 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-full py-2 pl-10 pr-4 text-on-surface text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline-variant"
          />
        </div>
      </div>
    </header>
  );
}

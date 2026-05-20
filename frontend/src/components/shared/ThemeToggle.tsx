import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/src/hooks/useTheme";
import { motion, AnimatePresence } from "motion/react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-surface-container/50 border border-white/10 hover:bg-surface-container transition-colors relative h-10 w-10 flex items-center justify-center overflow-hidden"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-on-surface" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

type ThemeMode = "light" | "dark";

export function ThemeTransitionOverlay() {
  const { resolvedTheme } = useTheme();
  const prevTheme = useRef<ThemeMode | null>(null);
  const [triggerId, setTriggerId] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    if (!resolvedTheme) {
      return;
    }

    const nextTheme = resolvedTheme === "dark" ? "dark" : "light";

    if (prevTheme.current && prevTheme.current !== nextTheme) {
      setMode(nextTheme);
      setTriggerId((current) => current + 1);
      setIsActive(true);
    }

    prevTheme.current = nextTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsActive(false);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && triggerId > 0 && (
        <motion.div
          key={`theme-transition-${triggerId}`}
          className={[
            "theme-transition-overlay",
            mode === "dark" ? "theme-transition-dark" : "theme-transition-light",
          ].join(" ")}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 0.55, scale: 1.01 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}

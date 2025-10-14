"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);


  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700"

      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
    >
      <span className="text-blue-500 dark:text-yellow-300"> Switch to {currentTheme === "dark" ? "Light" : "Dark"} Mode</span> 
    </button>
  );
}

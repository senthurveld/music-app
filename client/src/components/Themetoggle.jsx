import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition cursor-pointer absolute top-2 right-2"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Moon className="stroke-blue-50" />
      ) : (
        <Sun className="stroke-gray-700" />
      )}
    </button>
  );
};

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );

  useEffect(() => {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="p-2 rounded-full transition absolute top-2 right-2"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Moon className="stroke-foreground" />
      ) : (
        <Sun className="stroke-foreground" />
      )}
    </button>
  );
};

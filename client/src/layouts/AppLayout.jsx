import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/Themetoggle";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background bg-zinc-900 text-gray-50 text-foreground relative transition-colors">
      <ThemeToggle />
      <Outlet />
    </div>
  );
};

export default AppLayout;

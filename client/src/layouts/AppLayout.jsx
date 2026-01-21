import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/Themetoggle";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Theme Toggle Button */}
      <ThemeToggle />
      {/* Main content */}
      <Outlet />
    </div>
  );
};

export default AppLayout;

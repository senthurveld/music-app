import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";

export default function HamburgerMenu({ open, onClose }) {
  const { user, logout } = useAuthStore();

  if (!open) return null;
  const handleLogout = () => {
    logout();
  };
  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Menu */}
      <div className="absolute left-0 top-0 h-full w-64 bg-zinc-900 p-4 space-y-4">
        <h4 className="text-xl font-semibold text-green-400 mb-3">
          Account Activity
        </h4>
        <p className="text-gray-300">
          <span className="font-bold">Joined: </span>
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-gray-300">
          <span className="font-bold">Last Login: </span>

          {formatDate(user.lastLogin)}
        </p>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

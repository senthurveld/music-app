// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 100, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-8">
        <h2
          className="text-3xl font-bold mb-6 text-center 
        bg-linear-to-r from-green-400 to-emerald-500 
        text-transparent bg-clip-text"
        >
          Welcome back!
        </h2>
        <form onSubmit={handleLogin} className="">
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-between mt-10 mb-6">
            <Link
              to="/forgot-password"
              className=" text-sm text-green-400 hover:text-green-300 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <motion.button
            className="mt-5 w-full py-3 px-4 bg-linear-to-r from-green-500
           to-emerald-600 text-white font-bold rounded-lg shadow-lg
            hover:from-green-600 hover:to-emerald-700 hover:cursor-pointer  focus:outline-none 
            focus:ring-offset-2 focus:outline-0 focus:ring-offset-gray-900 transition
             duration-200 outline-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
          >
            Login
          </motion.button>
        </form>
      </div>
      <div className="px-8 py-4 bg-gray-900/50 flex justify-center ">
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <Link
            to={"/signup"}
            className="text-green-500 hover:text-green-400 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginPage;

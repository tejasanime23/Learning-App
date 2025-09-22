// src/AuthPage.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";  // 🔹 import navigate
import "./AuthPage.css";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();  // 🔹 hook for navigation

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // LOGIN
        const res = await axios.post("http://127.0.0.1:8000/api/auth/token/login/", {
          username,
          password,
        });
        const token = res.data.auth_token;
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);
        setMessage("✅ Login successful!");

        // 🔹 Redirect to dashboard
        navigate("/dashboard");

      } else {
        // SIGNUP
        await axios.post("http://127.0.0.1:8000/api/auth/users/", {
          username,
          password,
        });
        setMessage("✅ Signup successful! Please log in now.");
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Error: " + (error.response?.data?.detail || "Something went wrong"));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>
        <p className="toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={toggleMode} className="toggle-link">
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default AuthPage;

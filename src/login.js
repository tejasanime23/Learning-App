// src/Login.js
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./firebase";
import "bootstrap/dist/css/bootstrap.min.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      {/* Left side illustration */}
      <div className="left-side d-none d-md-flex flex-column justify-content-center align-items-center text-white">
        <h1 className="title">Personalized LMS</h1>
        <p className="subtitle">Learn Smarter. Improve Faster. 🚀</p>
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/online-learning-3025713-2526910.png"
          alt="learning illustration"
          className="illustration"
        />
      </div>

      {/* Right side auth form */}
      <div className="right-side d-flex justify-content-center align-items-center">
        <div className="glass-card text-center p-5">
          <img
            src={
              isSignup
                ? "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
                : "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
            }
            alt="avatar"
            className="avatar"
          />

          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className="text-muted mb-4">
            {isSignup
              ? "Join us and start your personalized learning journey 🎓"
              : "Login to continue your progress 📚"}
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

          <input
            type="email"
            className="form-control form-control-lg mb-3 glowing-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="form-control form-control-lg mb-3 glowing-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-success w-100 mb-3 ripple" onClick={handleAuth}>
            {isSignup ? "Sign Up" : "Login"}
          </button>

          <button className="btn btn-outline-light w-100 mb-3 ripple" onClick={handleGoogleLogin}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
              alt="Google"
              width="20"
              className="me-2"
            />
            Continue with Google
          </button>

          <p>
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <span
              className="text-info toggle-link"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
            >
              {isSignup ? "Login" : "Sign Up"}
            </span>
          </p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .login-page {
          display: flex;
          height: 100vh;
          background: linear-gradient(135deg, #2E8B57, #14532d);
        }
        .left-side {
          width: 50%;
          padding: 40px;
          background: rgba(0,0,0,0.5);
          text-align: center;
        }
        .title {
          font-size: 2.5rem;
          font-weight: bold;
          text-shadow: 2px 2px 10px rgba(0,0,0,0.7);
        }
        .subtitle {
          font-size: 1.2rem;
          margin-bottom: 20px;
        }
        .illustration {
          max-width: 80%;
          animation: float 4s ease-in-out infinite;
        }
        .right-side {
          width: 100%;
          background: url('https://www.transparenttextures.com/patterns/cubes.png');
        }
        @media (min-width: 768px) {
          .right-side {
            width: 50%;
          }
        }
        .glass-card {
          width: 380px;
          border-radius: 20px;
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          animation: fadeIn 1s ease-in-out;
        }
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid white;
          margin-bottom: 15px;
          animation: float 3s ease-in-out infinite;
        }
        .glowing-input:focus {
          border-color: #2E8B57 !important;
          box-shadow: 0 0 10px rgba(46,139,87,0.7);
        }
        .toggle-link {
          cursor: pointer;
          font-weight: bold;
        }
        .ripple {
          position: relative;
          overflow: hidden;
        }
        .ripple::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          background: rgba(255,255,255,0.6);
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          opacity: 0;
          transition: transform 0.5s, opacity 1s;
        }
        .ripple:active::after {
          transform: scale(2);
          opacity: 1;
          transition: 0s;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

export default Login;

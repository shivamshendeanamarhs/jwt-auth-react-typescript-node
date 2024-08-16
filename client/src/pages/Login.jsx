import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../lib/api";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const redirectUrl = location.state?.redirectUrl || "/";

  const {
    mutate: signIn,
    isPending,
    isError,
  } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate(redirectUrl, {
        replace: true,
      });
    },
  });

  return (
    <div className="container">
      {/* <h1 className="heading">Sign in to your account</h1> */}

      <div className="login-box">
        <h1 className="heading">Sign into your account</h1>
        {isError && (
          <div className="error-message">
            Invalid email or password
          </div>
        )}
        <div className="form-control">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-control">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && signIn({ email, password })
            }
          />
        </div>
        <div className="text-center">
          <a href="/password/forgot" className="link">
            Forgot password?
          </a>
        </div>
        <button
          className="button"
          disabled={!email || password.length < 6 || isPending}
          onClick={() => signIn({ email, password })}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-center text-muted">
          Don&apos;t have an account?{" "}
          <a href="/register" className="link">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;

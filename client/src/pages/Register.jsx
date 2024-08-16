import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    mutate: createAccount,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate("/", {
        replace: true,
      });
    },
  });

  return (
    <div className="center">
      <div className="register-box">
        <h1 className="heading">Create an account</h1>
        {isError && (
          <div className="error-message">
            {error?.message || "An error occurred"}
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
          />
          <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'left', marginTop: '8px' }}>
            - Must be at least 6 characters long.
          </p>
        </div>
        <div className="form-control">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              createAccount({ email, password, confirmPassword })
            }
          />
        </div>
        <button
          className="button"
          disabled={
            !email || password.length < 6 || password !== confirmPassword
          }
          onClick={() =>
            createAccount({ email, password, confirmPassword })
          }
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </button>
        <p className="text-center text-muted">
          Already have an account?{" "}
          <a href="/login" className="link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;

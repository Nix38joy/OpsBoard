import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginRequest, MOCK_ACCOUNTS } from "../../api/auth";
import { useAuthStore } from "../../state/authStore";

export function LoginPage() {
  const [email, setEmail] = useState("operator@opsboard.dev");
  const [password, setPassword] = useState("123456");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      login(session);
      navigate("/dashboard");
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="page center-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>OpsBoard Login</h1>
        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <div className="demo-credentials">
          <p className="muted-text">Demo accounts:</p>
          {MOCK_ACCOUNTS.map((account) => (
            <p className="muted-text" key={account.email}>
              {account.role}: {account.email} / {account.password}
            </p>
          ))}
        </div>
        {loginMutation.isError && (
          <p className="error-text">{(loginMutation.error as Error).message}</p>
        )}
        <button className="btn" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

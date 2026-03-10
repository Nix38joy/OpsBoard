import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../../api/auth";
import { AppRole, useAuthStore } from "../../state/authStore";

export function LoginPage() {
  const [userName, setUserName] = useState("Middle React Dev");
  const [role, setRole] = useState<AppRole>("operator");
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
    loginMutation.mutate({ userName, role });
  };

  return (
    <div className="page center-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>OpsBoard Login</h1>
        <label className="field">
          <span>User name</span>
          <input
            className="input"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Role</span>
          <select
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as AppRole)}
          >
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
        </label>
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

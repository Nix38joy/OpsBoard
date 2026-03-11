import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../../api/auth";
import { useI18n } from "../../i18n/useI18n";
import { useAuthStore } from "../../state/authStore";

export function RegisterPage() {
  const { t } = useI18n();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const registerMutation = useMutation({
    mutationFn: registerRequest,
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
    registerMutation.mutate({ userName, email, password });
  };

  return (
    <div className="page center-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>{t("registerTitle")}</h1>
        <p className="muted-text">{t("registerSubtitle")}</p>

        <label className="field">
          <span>{t("loginUserName")}</span>
          <input
            className="input"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{t("loginEmail")}</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{t("loginPassword")}</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {registerMutation.isError && (
          <p className="error-text">{(registerMutation.error as Error).message}</p>
        )}
        <button className="btn" type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? t("registeringButton") : t("registerButton")}
        </button>
        <p className="muted-text">
          {t("registerHaveAccount")}{" "}
          <Link className="table-action-link" to="/login">
            {t("registerGoToLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}


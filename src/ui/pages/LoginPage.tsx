import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { getDemoAccounts, loginRequest } from "../../api/auth";
import { useI18n } from "../../i18n/useI18n";
import { useAuthStore } from "../../state/authStore";
import { useToastStore } from "../../state/toastStore";

export function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const pushToast = useToastStore((state) => state.pushToast);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      login(session);
      pushToast({ kind: "success", message: t("toastLoginSuccess") });
      navigate("/dashboard");
    },
    onError: (error) => {
      pushToast({ kind: "error", message: (error as Error).message });
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

  // ⚡ Функция быстрого входа (заполняет инпуты и сразу отправляет мутацию)
  const handleQuickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    loginMutation.mutate({ email: demoEmail, password: demoPassword });
  };

  const handlePasswordKeyEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  };

  return (
    <div className="page center-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>{t("loginTitle")}</h1>
        
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
          <div className="input-with-action">
            <input
              className="input"
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyUp={handlePasswordKeyEvent}
              onKeyDown={handlePasswordKeyEvent}
              onBlur={() => setIsCapsLockOn(false)}
              required
            />
            <button
              className="input-action-btn"
              type="button"
              onClick={() => setIsPasswordVisible((value) => !value)}
              aria-label={isPasswordVisible ? t("loginHidePassword") : t("loginShowPassword")}
            >
              {isPasswordVisible ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.3 4.7a1 1 0 1 1 1.4-1.4l15.3 15.3a1 1 0 0 1-1.4 1.4l-2.3-2.3A10.8 10.8 0 0 1 12 19c-4.9 0-8.9-3.3-10.5-7 1-2.1 2.6-4.1 4.8-5.5L3.3 4.7Zm8.7 3.8a3.5 3.5 0 0 1 3.5 3.5c0 .5-.1 1-.3 1.4l-4.6-4.6c.4-.2.9-.3 1.4-.3Zm8.5 3.5a12.7 12.7 0 0 1-2.8 3.8l-1.4-1.4a10.8 10.8 0 0 0 2.1-2.4c-1.3-2.4-3.9-4.7-7.4-4.9L9.2 5.3c.9-.2 1.8-.3 2.8-.3 4.9 0 8.9 3.3 10.5 7Zm-9.9.7 1.7 1.7a3.5 3.5 0 0 1-4.7-4.7l1.6 1.6a1.5 1.5 0 0 0 1.4 1.4Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5c4.9 0 8.9 3.3 10.5 7-1.6 3.7-5.6 7-10.5 7S3.1 15.7 1.5 12C3.1 8.3 7.1 5 12 5Zm0 2c-3.5 0-6.1 2.3-7.4 5 1.3 2.7 3.9 5 7.4 5s6.1-2.3 7.4-5c-1.3-2.7-3.9-5-7.4-5Zm0 1.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                </svg>
              )}
            </button>
          </div>
          {isCapsLockOn && <p className="warning-text">{t("loginCapsLockOn")}</p>}
        </label>
        
        {loginMutation.isError && (
          <p className="error-text">{(loginMutation.error as Error).message}</p>
        )}
        
        <button className="btn" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? t("loginSigningIn") : t("loginSignIn")}
        </button>
        
        <p className="muted-text">
          <Link className="table-action-link" to="/forgot-password">
            {t("loginForgotPassword")}
          </Link>
        </p>
        <p className="muted-text">
          {t("loginNoAccount")}{" "}
          <Link className="table-action-link" to="/register">
            {t("loginGoToRegister")}
          </Link>
        </p>

        {/* Интерактивный пульт быстрого входа в один клик */}
        <details className="section-gap" open>
          <summary style={{ cursor: "pointer", marginBottom: "8px", fontWeight: "bold" }}>
            {t("loginDemoAccounts")}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {getDemoAccounts().map((account) => (
              <button
                key={account.email}
                type="button"
                className="btn ghost"
                style={{
                  textAlign: "left",
                  width: "100%",
                  justifyContent: "space-between",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 12px"
                }}
                disabled={loginMutation.isPending}
                onClick={() => handleQuickLogin(account.email, account.password)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span 
                    className={`pill pill-status-${account.role === "admin" ? "closed" : account.role === "operator" ? "in_progress" : "open"}`} 
                    style={{ marginRight: "10px", fontSize: "0.75rem", minWidth: "75px", textAlign: "center" }}
                  >
                    {account.role.toUpperCase()}
                  </span>
                  <strong>{account.userName}</strong>
                </div>
                <small className="muted-text" style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                  {account.email}
                </small>
              </button>
            ))}
          </div>
        </details>
      </form>
    </div>
  );
}

import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../../api/auth";
import { useI18n } from "../../i18n/useI18n";
import { useAuthStore } from "../../state/authStore";

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) {
    return 0;
  }

  let score = 0;
  if (password.length >= 8) {
    score += 1;
  }
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}

export function RegisterPage() {
  const { t } = useI18n();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [mismatchError, setMismatchError] = useState<string | null>(null);
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

  const strength = getPasswordStrength(password);
  const passwordChecks = {
    minLength: password.length >= 8,
    mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
    numberOrSymbol: /\d/.test(password) || /[^A-Za-z0-9]/.test(password),
  };
  const isEmailLikelyValid = email.includes("@") && email.includes(".");
  const isPasswordValid =
    passwordChecks.minLength && passwordChecks.mixedCase && passwordChecks.numberOrSymbol;
  const isConfirmMatched = confirmPassword.length > 0 && password === confirmPassword;
  const hasPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isReadyToSubmit =
    userName.trim().length >= 3 && isEmailLikelyValid && isPasswordValid && isConfirmMatched;
  const strengthTextByScore = {
    0: "",
    1: t("registerStrengthWeak"),
    2: t("registerStrengthMedium"),
    3: t("registerStrengthStrong"),
  } as const;
  const strengthClassByScore = {
    0: "auth-strength-meter",
    1: "auth-strength-meter weak",
    2: "auth-strength-meter medium",
    3: "auth-strength-meter strong",
  } as const;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadyToSubmit) {
      if (hasPasswordMismatch) {
        setMismatchError(t("registerPasswordMismatch"));
      }
      return;
    }
    if (password !== confirmPassword) {
      setMismatchError(t("registerPasswordMismatch"));
      return;
    }
    setMismatchError(null);
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
          <div className="input-with-action">
            <input
              className="input"
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setMismatchError(null);
              }}
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
        </label>
        <label className="field">
          <span>{t("registerConfirmPassword")}</span>
          <div className="input-with-action">
            <input
              className="input"
              type={isPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setMismatchError(null);
              }}
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
        </label>
        <div className="auth-strength">
          <p className="muted-text">
            {t("registerPasswordStrength")}: <strong>{strengthTextByScore[strength]}</strong>
          </p>
          <div className={strengthClassByScore[strength]} />
          <p className="muted-text auth-requirements-title">{t("registerPasswordRequirements")}:</p>
          <ul className="auth-requirements-list">
            <li className={passwordChecks.minLength ? "met" : "unmet"}>
              {t("registerPasswordRuleLength")}
            </li>
            <li className={passwordChecks.mixedCase ? "met" : "unmet"}>
              {t("registerPasswordRuleCase")}
            </li>
            <li className={passwordChecks.numberOrSymbol ? "met" : "unmet"}>
              {t("registerPasswordRuleNumberOrSymbol")}
            </li>
          </ul>
        </div>
        {(mismatchError || hasPasswordMismatch) && (
          <p className="error-text">{mismatchError ?? t("registerPasswordMismatch")}</p>
        )}
        {registerMutation.isError && (
          <p className="error-text">{(registerMutation.error as Error).message}</p>
        )}
        <button className="btn" type="submit" disabled={registerMutation.isPending || !isReadyToSubmit}>
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


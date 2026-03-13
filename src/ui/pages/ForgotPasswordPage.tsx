import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth";
import { useI18n } from "../../i18n/useI18n";
import { useAuthStore } from "../../state/authStore";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const resetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (result) => {
      setSuccessMessage(result.message);
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    resetMutation.mutate(email);
  };

  return (
    <div className="page center-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>{t("forgotPasswordTitle")}</h1>
        <p className="muted-text">{t("forgotPasswordSubtitle")}</p>

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
        {resetMutation.isError && (
          <p className="error-text">{(resetMutation.error as Error).message}</p>
        )}
        {successMessage && <p className="muted-text">{t("forgotPasswordSuccess")}</p>}
        <button className="btn" type="submit" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? t("forgotPasswordSending") : t("forgotPasswordSend")}
        </button>

        <p className="muted-text">
          <Link className="table-action-link" to="/login">
            {t("forgotPasswordBackToLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}


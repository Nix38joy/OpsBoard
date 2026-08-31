import { useToastStore } from "../../state/toastStore";
import { useI18n } from "../../i18n/useI18n";

export function ToastHost() {
  const { t } = useI18n();
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.kind}`}>
          <p>{toast.message}</p>
          <button
            className="toast-close-btn"
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label={t("toastClose")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}


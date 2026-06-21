import { Component, ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  // Метод перехватывает ошибку и говорит React, что нужно переключить UI на заглушку
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Метод для логирования ошибки (в реальном B2B сюда прикручивают Sentry)
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[PulseBoard Error Boundary]:", error, errorInfo);
  }

  // Функция сброса ошибки для кнопки перезапуска
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard"; // Безопасно возвращаем пользователя на главный экран
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: "20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          backgroundColor: "#f8f9fa"
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            maxWidth: "500px"
          }}>
            <span style={{ fontSize: "3rem" }}>🛡️</span>
            <h1 style={{ color: "#e63946", marginTop: "16px", fontSize: "1.75rem" }}>
              Модуль PulseBoard временно недоступен
            </h1>
            <p style={{ color: "#6c757d", margin: "16px 0 24px" }}>
              Произошел непредвиденный критический сбой в интерфейсе панели оператора. 
              Система изолировала ошибку для защиты ваших данных.
            </p>
            {this.state.error && (
              <pre style={{
                backgroundColor: "#f1f3f5",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                textAlign: "left",
                overflowX: "auto",
                marginBottom: "24px",
                color: "#495057",
                maxHeight: "100px"
              }}>
                <code>{this.state.error.toString()}</code>
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: "#212529",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "4px",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Перезапустить панель
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

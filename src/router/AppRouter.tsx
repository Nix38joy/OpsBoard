import { Navigate, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import { AppRole } from "../domain/incidents";
import { INCIDENT_EDITOR_ROLES } from "../domain/permissions";
import { AppLayout } from "../ui/layout/AppLayout";
import { AccessDeniedPage } from "../ui/pages/AccessDeniedPage";
import { DashboardPage } from "../ui/pages/DashboardPage";
import { ForgotPasswordPage } from "../ui/pages/ForgotPasswordPage";
import { IncidentCreatePage } from "../ui/pages/IncidentCreatePage";
import { IncidentDetailsPage } from "../ui/pages/IncidentDetailsPage";
import { IncidentEditPage } from "../ui/pages/IncidentEditPage";
import { IncidentsPage } from "../ui/pages/IncidentsPage";
import { LoginPage } from "../ui/pages/LoginPage";
import { NotFoundPage } from "../ui/pages/NotFoundPage";
import { RegisterPage } from "../ui/pages/RegisterPage";
import { useAuthStore } from "../state/authStore";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: AppRole[];
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="incidents/:incidentId" element={<IncidentDetailsPage />} />
        <Route
          path="incidents/:incidentId/edit"
          element={
            <ProtectedRoute allowedRoles={INCIDENT_EDITOR_ROLES}>
              <IncidentEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="incidents/new"
          element={
            <ProtectedRoute allowedRoles={INCIDENT_EDITOR_ROLES}>
              <IncidentCreatePage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

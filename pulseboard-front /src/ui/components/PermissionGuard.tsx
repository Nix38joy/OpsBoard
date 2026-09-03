import React from 'react';
import { useAuthStore } from '../../state/authStore'; // Твоё хранилище авторизации
import { 
  canCreateIncident, 
  canEditIncident, 
  canDeleteIncident,
  canAddComment,
  canDeleteComment
} from '../../domain/permissions';

export type PermissionCheckType = 'createIncident' | 'editIncident' | 'deleteIncident' | 'addComment' | 'deleteComment';

interface PermissionGuardProps {
  check: PermissionCheckType;
  fallback?: React.ReactNode; 
  children: React.ReactNode;   
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  check,
  fallback = null,
  children,
}) => {
  // 🔥 ИСПРАВЛЕНО: Достаем роль напрямую из твоего стейта, без объекта user!
  const { role } = useAuthStore();

  let isAllowed = false;

  switch (check) {
    case 'createIncident':
      isAllowed = canCreateIncident(role);
      break;
    case 'editIncident':
      isAllowed = canEditIncident(role);
      break;
    case 'deleteIncident':
      isAllowed = canDeleteIncident(role);
      break;
    case 'addComment':
      isAllowed = canAddComment(role);
      break;
    case 'deleteComment':
      isAllowed = canDeleteComment(role);
      break;
    default:
      isAllowed = false;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useOnlineStatus } from './useOnlineStatus';

export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const isOnline = useOnlineStatus();

  const requireAuth = (callback: () => void) => {
    if (!isOnline) {
      alert("أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.");
      return;
    }
    if (loading) return; // Prevent action while checking auth status
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      navigate('/auth', { state: { from: location } });
    } else {
      callback();
    }
  };

  const requireOnline = (callback: () => void) => {
    if (!isOnline) {
      alert("أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.");
      return;
    }
    callback();
  }

  return { requireAuth, requireOnline, user, loading, isOnline };
}

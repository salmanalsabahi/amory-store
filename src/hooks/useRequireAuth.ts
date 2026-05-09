import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useOnlineStatus } from './useOnlineStatus';
import toast from 'react-hot-toast';

export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const isOnline = useOnlineStatus();

  const requireAuth = (callback: () => void, options: { redirect?: boolean, customMessage?: string } = { redirect: true }) => {
    if (!isOnline) {
      toast.error("المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت أولاً.");
      return;
    }
    if (loading) return; // Prevent action while checking auth status
    if (!user) {
      toast.error(options.customMessage || "المعذرة منك ياحبوب.. لازم تسجل دخولك أو تنشئ حساب عشان تقدر تسوي كذا.");
      if (options.redirect) {
        navigate('/auth', { state: { from: location } });
      }
    } else {
      callback();
    }
  };

  const requireOnline = (callback: () => void) => {
    if (!isOnline) {
      toast.error("المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت أولاً.");
      return;
    }
    callback();
  }

  return { requireAuth, requireOnline, user, loading, isOnline };
}

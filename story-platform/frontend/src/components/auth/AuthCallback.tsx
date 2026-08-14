import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-400">Đang hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
};

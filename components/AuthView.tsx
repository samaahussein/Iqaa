
import React, { useState } from 'react';
import { UserSession } from '../types.ts';
import { deriveKeys, generateSalt } from '../services/crypto.ts';
import { setSession, syncFromCloud } from '../services/storage.ts';

interface AuthViewProps {
  onAuthComplete: (session: UserSession) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const performAuth = async (u: string, p: string, forceLocal = false) => {
    setIsLoading(true);
    setError('');

    try {
      if (forceLocal) {
        // Bypass server completely for preview/local mode
        const salt = "local_salt_12345";
        const { encryptionKey } = await deriveKeys(p, salt);
        const session: UserSession = { userId: 'local-user', username: u, encryptionKey, salt };
        setSession(session);
        onAuthComplete(session);
        return;
      }

      // 1. Handshake with server to get salt
      const handshake = await fetch(`/api/auth?username=${encodeURIComponent(u)}`);
      
      if (!handshake.ok) {
        throw new Error("SERVER_UNAVAILABLE");
      }
      
      const userData = await handshake.json();
      let salt: string;
      let registrationId: string | undefined;

      if (isLogin) {
        if (!userData.exists) throw new Error("USER_NOT_FOUND");
        salt = userData.salt;
      } else {
        if (userData.exists) throw new Error("USERNAME_TAKEN");
        salt = generateSalt();
        registrationId = crypto.randomUUID(); 
      }

      // 2. Derive keys locally
      const { encryptionKey, authHash } = await deriveKeys(p, salt);
      
      // 3. Authenticate / Register
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: u, 
          authHash, 
          salt: isLogin ? undefined : salt,
          type: isLogin ? 'login' : 'register',
          userId: registrationId
        })
      });

      if (!authResponse.ok) {
        if (authResponse.status === 401) throw new Error("INVALID_CREDS");
        throw new Error("AUTH_FAILED");
      }
      
      const { userId } = await authResponse.json();
      const session: UserSession = { userId, username: u, encryptionKey, salt };

      setSession(session);
      if (isLogin) await syncFromCloud();
      onAuthComplete(session);

    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message === "SERVER_UNAVAILABLE" || err.message === "AUTH_FAILED") {
        setError('السيرفر مش متاح حالياً. ممكن تدخل "وضع محلي" وتجرب التطبيق عادي.');
      } else if (err.message === "USER_NOT_FOUND") setError('المستخدم ده مش موجود.');
      else if (err.message === "USERNAME_TAKEN") setError('الاسم ده محجوز فعلاً.');
      else if (err.message === "INVALID_CREDS") setError('كلمة السر مش صح.');
      else setError(`حصلت مشكلة: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEntry = () => {
    performAuth('تجربة', 'demo1234', true); // Fast local login
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-6 animate-gentle" dir="rtl">
      <div className="bg-white p-10 rounded-custom shadow-airy border border-mirror-border space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-text-main">{isLogin ? 'أهلاً بيك' : 'حساب جديد'}</h2>
          <p className="text-sm text-text-muted font-medium opacity-60">
            بياناتك مشفرة بالكامل على جهازك.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); performAuth(username, password); }} className="space-y-4">
          <input
            placeholder="اسم المستخدم"
            required
            className="w-full p-4 bg-gray-50 border border-mirror-border rounded-xl outline-none focus:border-app-clay/40 transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="كلمة السر"
            required
            type="password"
            className="w-full p-4 bg-gray-50 border border-mirror-border rounded-xl outline-none focus:border-app-clay/40 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-red-500 text-xs font-bold text-center leading-relaxed">{error}</p>
              <button 
                type="button"
                onClick={() => performAuth(username || 'مستخدم', password || '123456', true)}
                className="w-full mt-2 py-2 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-wider"
              >
                دخول وضع محلي (تخطي السيرفر)
              </button>
            </div>
          )}

          <button
            disabled={isLoading}
            className="w-full py-4 bg-text-main text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? 'جاري التحقق...' : isLogin ? 'دخول' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-text-muted opacity-40 font-bold">أو</span></div>
        </div>

        <button
          onClick={handleQuickEntry}
          className="w-full py-4 bg-app-sage/10 text-app-sage border border-app-sage/20 rounded-xl font-bold hover:bg-app-sage/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          دخول سريع (للتجربة)
        </button>

        <div className="text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-bold text-app-clay hover:underline"
          >
            {isLogin ? 'معنديش حساب؟ سجل هنا' : 'عندي حساب فعلاً'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;

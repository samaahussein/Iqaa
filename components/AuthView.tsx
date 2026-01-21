
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Handshake with server to get salt
      const handshake = await fetch(`/api/auth?username=${encodeURIComponent(username)}`);
      
      if (!handshake.ok) {
        const text = await handshake.text();
        let msg = "خطأ في الاتصال بالسيرفر";
        try {
          const json = JSON.parse(text);
          msg = json.message || json.error || msg;
        } catch (e) {
          msg = text.substring(0, 100); // Show start of HTML error if it's not JSON
        }
        throw new Error(msg);
      }
      
      const userData = await handshake.json();
      
      let salt: string;
      let registrationId: string | undefined;

      if (isLogin) {
        if (!userData.exists) throw new Error("User not found");
        salt = userData.salt;
      } else {
        if (userData.exists) throw new Error("Username taken");
        salt = generateSalt();
        registrationId = crypto.randomUUID(); 
      }

      // 2. Derive keys locally
      const { encryptionKey, authHash } = await deriveKeys(password, salt);
      
      // 3. Authenticate / Register
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          authHash, 
          salt: isLogin ? undefined : salt,
          type: isLogin ? 'login' : 'register',
          userId: registrationId
        })
      });

      if (!authResponse.ok) {
        const text = await authResponse.text();
        if (authResponse.status === 401) throw new Error("Invalid credentials");
        
        let msg = "فشل في تسجيل الدخول";
        try {
          const json = JSON.parse(text);
          msg = json.message || json.error || msg;
        } catch (e) {
          msg = text.substring(0, 100);
        }
        throw new Error(msg);
      }
      
      const { userId } = await authResponse.json();

      const session: UserSession = {
        userId, 
        username,
        encryptionKey,
        salt
      };

      setSession(session);
      
      if (isLogin) {
        await syncFromCloud();
      }
      
      onAuthComplete(session);
      setIsLoading(false);

    } catch (err: any) {
      console.error("Auth process error:", err);
      if (err.message === "User not found") setError('المستخدم ده مش موجود.');
      else if (err.message === "Username taken") setError('الاسم ده محجوز فعلاً.');
      else if (err.message === "Invalid credentials") setError('كلمة السر مش صح.');
      else setError(`خطأ: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-6 animate-gentle" dir="rtl">
      <div className="bg-white p-10 rounded-custom shadow-airy border border-mirror-border space-y-10">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-app-clay/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-app-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-text-main">{isLogin ? 'أهلاً بيك' : 'حساب جديد'}</h2>
          <p className="text-sm text-text-muted font-medium opacity-60 leading-relaxed">
            بياناتك مشفرة بالكامل. <br/>كلمة سرك هي مفتاح فك التشفير الوحيد.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-app-blue-gray uppercase tracking-widest block pr-2">اسم المستخدم</label>
              <input
                required
                type="text"
                autoComplete="username"
                className="w-full p-4 bg-gray-50 border border-mirror-border rounded-xl outline-none focus:border-app-clay/40 transition-all text-lg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-app-blue-gray uppercase tracking-widest block pr-2">كلمة السر</label>
              <input
                required
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full p-4 bg-gray-50 border border-mirror-border rounded-xl outline-none focus:border-app-clay/40 transition-all text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
              <p className="text-red-500 text-sm font-bold animate-pulse">{error}</p>
            </div>
          )}

          <button
            disabled={isLoading}
            className="w-full py-5 bg-text-main text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (isLogin ? 'جاري الاسترجاع...' : 'بيتم التشفير...') : isLogin ? 'دخول آمن' : 'إنشاء حساب مشفر'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-bold text-app-clay hover:underline underline-offset-4"
          >
            {isLogin ? 'معنديش حساب، عايز أعمل واحد' : 'عندي حساب فعلاً'}
          </button>
        </div>
      </div>

      <div className="mt-12 text-center opacity-40">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          Zero-Knowledge AES-GCM 256
        </div>
      </div>
    </div>
  );
};

export default AuthView;


import React from 'react';
import { setSession } from '../services/storage.ts';

interface SettingsViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout }) => {
  const handleFinalLogout = () => {
    setSession(null);
    onLogout();
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-mirror-border rounded-custom animate-gentle shadow-airy min-h-[500px]" dir="rtl">
      <header className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold text-text-main">الإعدادات والأمان</h2>
        <button onClick={onBack} className="text-text-muted p-2 hover:bg-gray-50 rounded-full transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="space-y-8">
        <div className="p-6 bg-app-sage/10 rounded-custom border border-app-sage/30 space-y-3">
          <div className="flex items-center gap-2 text-app-sage">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 .155 17.834 4.9a2 2 0 011.166 1.81v3.134c0 4.62-2.924 8.653-7 9.873-4.076-1.22-7-5.253-7-9.873V6.71a2 2 0 011.166-1.81zM10 3.173L4 6.81v2.134c0 3.642 2.27 6.845 5.5 7.873a8.96 8.96 0 00.5.127 8.962 8.962 0 00.5-.127c3.23-1.028 5.5-4.231 5.5-7.873V6.81l-6-3.637z" clipRule="evenodd" /></svg>
            <span className="font-bold">تشفير نشط</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            بياناتك مشفرة حالياً بمفتاح خاص تم استنتاجه من كلمة سرك. لا يتم إرسال هذا المفتاح لأي خادم.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest pr-2">قاعدة البيانات</h3>
          <div className="p-4 bg-gray-50 rounded-xl text-xs font-mono text-text-muted break-all opacity-60">
            neon.tech/neondb (Encrypted)
          </div>
          <p className="text-[10px] text-text-muted opacity-60 leading-relaxed pr-2">
            يتم تخزين النسخة الاحتياطية بشكل مشفر تماماً في Neon DB.
          </p>
        </div>

        <div className="pt-8 border-t border-mirror-border space-y-4">
          <button 
            onClick={handleFinalLogout}
            className="w-full py-4 text-red-500 border border-red-100 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            تسجيل خروج آمن
          </button>
        </div>
      </div>

      <footer className="mt-12 text-center opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Zero Knowledge Protocol v2</p>
      </footer>
    </div>
  );
};

export default SettingsView;

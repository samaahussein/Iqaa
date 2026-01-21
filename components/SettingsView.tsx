
import React, { useState } from 'react';
import { getApiUrl, setApiUrl, syncAllToSheets } from '../services/storage.ts';

interface SettingsViewProps {
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [url, setUrl] = useState(getApiUrl());
  const [status, setStatus] = useState<'idle' | 'saving' | 'synced'>('idle');

  const handleSave = () => {
    setStatus('saving');
    setApiUrl(url);
    setTimeout(() => setStatus('synced'), 500);
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleSyncAll = async () => {
    setStatus('saving');
    await syncAllToSheets();
    setStatus('synced');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-mirror-border rounded-custom animate-gentle shadow-airy min-h-[500px]" dir="rtl">
      <header className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold text-text-main">الإعدادات</h2>
        <button onClick={onBack} className="text-text-muted p-2 hover:bg-gray-50 rounded-full transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-sm font-bold text-text-muted block pr-2 uppercase tracking-widest">رابط Google Apps Script</label>
          <input 
            type="text" 
            className="w-full p-4 border border-mirror-border rounded-xl outline-none focus:border-app-clay/40 bg-gray-50 font-normal transition-all text-sm"
            placeholder="انسخ الرابط هنا.."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-[10px] text-text-muted opacity-60 leading-relaxed">
            الرابط ده هو اللي بيسمح للتطبيق يبعت البيانات لجدول جوجل الخاص بيك.
          </p>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-4 bg-text-main text-white rounded-xl font-medium transition-all active:scale-95 shadow-md"
        >
          {status === 'saving' ? 'بيحفظ...' : status === 'synced' ? 'تم الحفظ ✅' : 'حفظ الرابط'}
        </button>

        <div className="pt-8 border-t border-mirror-border">
          <h3 className="text-sm font-bold text-text-main mb-4">مزامنة البيانات الحالية</h3>
          <p className="text-xs text-text-muted mb-6 leading-relaxed">
            لو عندك بيانات متسجلة على الموبايل ده وعايز ترفعها كلها للجوجل شيت مرة واحدة:
          </p>
          <button 
            onClick={handleSyncAll}
            disabled={!url}
            className="w-full py-4 border-2 border-app-blue-gray text-app-blue-gray rounded-xl font-bold hover:bg-app-blue-gray/5 transition-all disabled:opacity-30"
          >
            مزامنة الكل الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

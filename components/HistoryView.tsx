
import React, { useState } from 'react';
import { getCases, deleteCase } from '../services/storage';
import { Case } from '../types';

interface HistoryViewProps {
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onBack }) => {
  const [cases, setCases] = useState<Case[]>(() => getCases().sort((a, b) => b.timestamp - a.timestamp));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFinalDelete = () => {
    if (deletingId) {
      deleteCase(deletingId);
      setCases(getCases().sort((a, b) => b.timestamp - a.timestamp));
      setDeletingId(null);
    }
  };

  const cardThemes = [
    { bg: 'bg-app-clay/10', border: 'border-app-clay/30', accent: 'text-app-clay' },
    { bg: 'bg-app-olive/10', border: 'border-app-olive/30', accent: 'text-app-olive' },
    { bg: 'bg-app-sage/10', border: 'border-app-sage/30', accent: 'text-app-sage' },
    { bg: 'bg-app-blue-gray/10', border: 'border-app-blue-gray/30', accent: 'text-app-blue-gray' },
    { bg: 'bg-app-mauve/10', border: 'border-app-mauve/30', accent: 'text-app-mauve' }
  ];

  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-mirror-border rounded-custom animate-gentle relative shadow-airy" dir="rtl">
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/80 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-custom border border-mirror-border shadow-airy text-center max-w-xs w-full">
            <h3 className="text-xl font-bold text-text-main mb-6">مسح الموقف؟</h3>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinalDelete} className="w-full py-4 bg-red-400 text-white rounded-custom font-medium transition-all">مسح</button>
              <button onClick={() => setDeletingId(null)} className="w-full py-4 bg-gray-100 text-text-main rounded-custom font-medium">رجوع</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold text-text-main">مواقف فاتت</h2>
        <button onClick={onBack} className="text-text-muted p-2 hover:bg-gray-50 rounded-full transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="space-y-6">
        {cases.length === 0 ? (
          <p className="text-center text-text-muted py-20 italic">لسه ما سجلتش مواقف.</p>
        ) : (
          cases.map((c, idx) => {
            const theme = cardThemes[idx % cardThemes.length];
            return (
              <div key={c.id} className={`${theme.bg} p-8 rounded-custom border-2 ${theme.border} space-y-4 group transition-all hover:scale-[1.01] shadow-sm`}>
                <div className="flex justify-between items-start border-b border-black/5 pb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60">{new Date(c.timestamp).toLocaleDateString('ar-EG')}</p>
                    <p className={`text-lg font-bold ${theme.accent}`}>
                      {c.feeling || 'غير محدد'} 
                      {(c.feeling || c.context) ? ' · ' : ''}
                      {c.context || 'غير محدد'}
                    </p>
                  </div>
                  <button onClick={() => setDeletingId(c.id)} className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-500 hover:underline bg-white border border-mirror-border rounded-md px-3 py-1.5 transition-all">مسح</button>
                </div>
                <p className="italic text-text-main text-lg font-semibold leading-relaxed">"{c.learning || c.whatHappened || 'بدون تفاصيل'}"</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryView;

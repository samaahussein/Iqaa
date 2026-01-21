
import React, { useMemo, useState } from 'react';
import { getCases } from '../services/storage.ts';
import { Case } from '../types.ts';

interface WeeklyOverviewProps {
  onBack: () => void;
}

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({ onBack }) => {
  const [cases] = useState<Case[]>(() => getCases());

  const stats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = cases.filter(c => c.timestamp >= sevenDaysAgo);
    if (recent.length === 0) return null;

    const feelingCounts: Record<string, number> = {};
    recent.forEach(c => feelingCounts[c.feeling] = (feelingCounts[c.feeling] || 0) + 1);
    const dominantFeeling = Object.entries(feelingCounts).sort((a,b) => b[1] - a[1])[0][0];

    const learnings = recent.filter(c => c.learning && c.learning.trim().length > 0).slice(0, 3);

    return { dominantFeeling, learnings };
  }, [cases]);

  return (
    <div className="max-w-md mx-auto p-8 bg-app-bg border border-mirror-border rounded-custom animate-gentle shadow-airy min-h-[600px]" dir="rtl">
      <header className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-text-main">ملخص الأسبوع</h2>
        <button onClick={onBack} className="text-white p-2 bg-text-main rounded-full transition-all shadow-md">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {!stats ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-6">
          <div className="text-app-blue-gray opacity-30">
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-text-muted font-bold text-xl text-center opacity-50">مفيش بيانات كفاية للأسبوع ده.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="text-center p-12 bg-app-clay text-white rounded-custom shadow-lg border-b-4 border-black/10">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 opacity-80">أكتر شعور اتكرر</h3>
            <div className="text-5xl font-black italic">{stats.dominantFeeling}</div>
          </section>

          <section className="space-y-6 pt-6">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.3em] text-center mb-6">أبرز الدروس</h3>
            <div className="flex flex-col gap-5">
              {stats.learnings.length === 0 ? (
                <p className="text-center text-text-muted italic opacity-50">مفيش دروس اتسجلت الأسبوع ده.</p>
              ) : (
                stats.learnings.map((c, idx) => {
                  const themes = [
                    { bg: 'bg-app-mauve', text: 'text-white' },
                    { bg: 'bg-app-blue-gray', text: 'text-white' },
                    { bg: 'bg-app-sage', text: 'text-white' }
                  ];
                  const theme = themes[idx % themes.length];
                  return (
                    <div key={c.id} className={`${theme.bg} ${theme.text} p-8 rounded-custom shadow-md border-b-4 border-black/10 italic text-xl font-bold leading-relaxed text-center`}>
                      "{c.learning}"
                    </div>
                  );
                })
              )}
            </div>
          </section>
          
          <div className="pt-6 text-center">
            <button onClick={onBack} className="text-sm font-bold text-app-blue-gray hover:underline underline-offset-4">رجوع للرئيسية</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyOverview;

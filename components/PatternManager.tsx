import React, { useState, useMemo } from 'react';
import { getPatterns, savePattern, deletePattern, getCases, saveCase, deleteCase } from '../services/storage';
import { Pattern, Case, Feeling, Context, Outcome } from '../types';

interface PatternManagerProps { onBack: () => void; }

const PALETTE_ACCENTS = [
  'bg-app-olive',
  'bg-app-clay',
  'bg-app-sage',
  'bg-app-blue-gray',
  'bg-app-mauve'
];

const PatternManager: React.FC<PatternManagerProps> = ({ onBack }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [patterns, setPatterns] = useState<Pattern[]>(() => getPatterns());
  const [allCases, setAllCases] = useState<Case[]>(() => getCases());
  const [newLabel, setNewLabel] = useState('');

  const calendarInfo = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return { monthName: monthNames[month], daysInMonth, year, month };
  }, [viewDate]);

  const handleAdd = () => {
    if (newLabel.trim()) {
      savePattern(newLabel.trim());
      setPatterns(getPatterns());
      setNewLabel('');
    }
  };

  const toggleObservation = (patternId: string, day: number) => {
    const date = new Date(calendarInfo.year, calendarInfo.month, day);
    const existing = allCases.find(c => c.patternId === patternId && new Date(c.timestamp).toDateString() === date.toDateString());
    if (existing) deleteCase(existing.id);
    else saveCase({ id: crypto.randomUUID(), timestamp: date.getTime(), patternId, whatHappened: patterns.find(p => p.id === patternId)?.label || '', feeling: Feeling.NORMAL, context: Context.SELF, howItFelt: '', whatIDid: '', whatResulted: '', outcome: Outcome.UNSURE });
    setAllCases(getCases());
  };

  const changeMonth = (offset: number) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + offset);
    setViewDate(next);
  };

  return (
    <div className="max-w-4xl mx-auto p-5 sm:p-8 bg-white border border-mirror-border rounded-custom animate-gentle shadow-airy" dir="rtl">
      <header className="flex justify-between items-center mb-12 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-main tracking-tight">عاداتي</h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40">{calendarInfo.monthName} {calendarInfo.year}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 text-text-main hover:bg-gray-50 rounded-lg transition-all border border-mirror-border">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 text-text-main hover:bg-gray-50 rounded-lg transition-all border border-mirror-border">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
        </div>
        <button onClick={onBack} className="text-text-muted p-2 hover:bg-gray-50 rounded-full transition-all flex-shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="space-y-12">
        <div className="flex items-center gap-3 w-full max-w-full sm:max-w-md">
          <input 
            type="text" 
            className="flex-1 min-w-0 p-4 border border-mirror-border rounded-xl outline-none focus:border-app-clay/40 bg-gray-50 font-normal transition-all text-sm sm:text-base" 
            placeholder="عايز تاخد بالك من إيه؟" 
            value={newLabel} 
            onChange={(e) => setNewLabel(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd} 
            disabled={!newLabel.trim()}
            className="px-5 sm:px-8 py-4 bg-text-main text-white rounded-xl font-medium disabled:opacity-30 transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            أضف
          </button>
        </div>

        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-mirror-border">
                  <th className="sticky right-0 z-10 bg-white p-4 text-right text-[10px] font-bold text-text-muted uppercase tracking-widest min-w-[130px] sm:min-w-[180px]">العادة</th>
                  {Array.from({ length: calendarInfo.daysInMonth }).map((_, i) => (
                    <th key={i} className="p-3 text-[10px] font-bold text-text-muted w-10 text-center">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mirror-border">
                {patterns.length === 0 ? (
                  <tr>
                    <td colSpan={calendarInfo.daysInMonth + 1} className="py-20 text-center text-text-muted font-medium italic opacity-50">
                      لسه ما سجلتش عادات تلاحظها.
                    </td>
                  </tr>
                ) : (
                  patterns.map((p, idx) => {
                    const baseColorClass = PALETTE_ACCENTS[idx % PALETTE_ACCENTS.length];
                    return (
                      <tr key={p.id} className="group transition-colors">
                        <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors p-4 text-right border-l border-mirror-border">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-semibold text-text-main truncate max-w-[80px] sm:max-w-[140px]">{p.label}</span>
                            <button 
                              onClick={() => { if(confirm('نشيل دي؟')) { deletePattern(p.id); setPatterns(getPatterns()); } }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 transition-all flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                        {Array.from({ length: calendarInfo.daysInMonth }).map((_, i) => {
                          const active = allCases.some(c => c.patternId === p.id && new Date(c.timestamp).toDateString() === new Date(calendarInfo.year, calendarInfo.month, i + 1).toDateString());
                          return (
                            <td key={i} className="p-0 border-x border-mirror-border/5">
                              <button 
                                onClick={() => toggleObservation(p.id, i + 1)} 
                                className={`w-full h-12 flex items-center justify-center transition-all ${active ? `${baseColorClass}/15 shadow-inner` : 'hover:bg-gray-50'}`}
                              >
                                <div className={`w-2 h-2 rounded-full transition-all ${active ? `${baseColorClass.replace('bg-', 'text-')} scale-125` : `bg-gray-200 opacity-40`}`}></div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="mt-16 pt-10 border-t border-mirror-border flex flex-col items-center gap-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-app-clay"></div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-50">موجودة</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-50">مش موجودة</span>
          </div>
        </div>
        <p className="text-[11px] text-text-muted font-medium uppercase tracking-[0.2em] italic max-w-sm text-center opacity-40">
          مجرد ملاحظة عشان نشوف، مش عشان نحكم.
        </p>
      </footer>
    </div>
  );
};

export default PatternManager;
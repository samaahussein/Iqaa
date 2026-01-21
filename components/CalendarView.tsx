
import React, { useMemo, useState } from 'react';
import { getCases, deleteCase } from '../services/storage';
import { Case } from '../types';

interface CalendarViewProps {
  onBack: () => void;
  onRecordRetroactive: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onBack, onRecordRetroactive }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [cases, setCases] = useState<Case[]>(() => getCases());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); 

    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    const casesByDay: Record<number, Case[]> = {};
    cases.forEach(c => {
      const d = new Date(c.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const date = d.getDate();
        if (!casesByDay[date]) casesByDay[date] = [];
        casesByDay[date].push(c);
      }
    });

    return { monthName: monthNames[month], year, month, startingDay, daysInMonth, casesByDay };
  }, [cases, viewDate]);

  const handleFinalDelete = () => {
    if (deletingId) {
      deleteCase(deletingId);
      setCases(getCases());
      setDeletingId(null);
    }
  };

  const changeMonth = (offset: number) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + offset);
    setViewDate(next);
    setSelectedDay(null);
  };

  const daysOfWeek = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleStartRetroactive = () => {
    if (selectedDay !== null) {
      const date = new Date(calendarData.year, calendarData.month, selectedDay);
      onRecordRetroactive(date);
    }
  };

  const selectedDayCases = selectedDay ? calendarData.casesByDay[selectedDay] || [] : [];

  return (
    <div className="max-w-md mx-auto p-8 bg-app-blue-gray/5 border border-mirror-border rounded-custom animate-gentle relative shadow-airy" dir="rtl">
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/80 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-custom border border-mirror-border shadow-airy max-w-xs w-full space-y-8 text-center">
            <h3 className="text-xl font-bold text-text-main">مسح المدخل؟</h3>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinalDelete} className="w-full py-4 bg-red-400 text-white rounded-custom font-medium transition-all">مسح</button>
              <button onClick={() => setDeletingId(null)} className="w-full py-4 bg-gray-100 text-text-main rounded-custom font-medium">رجوع</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-text-main opacity-90">{calendarData.monthName}</h2>
            <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase opacity-40">{calendarData.year}</p>
          </div>
          <div className="flex gap-1 mr-4">
            <button onClick={() => changeMonth(-1)} className="p-1.5 text-text-main hover:bg-app-blue-gray/10 rounded-lg transition-all border border-mirror-border bg-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => changeMonth(1)} className="p-1.5 text-text-main hover:bg-app-blue-gray/10 rounded-lg transition-all border border-mirror-border bg-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
        </div>
        <button onClick={onBack} className="text-text-muted p-2 hover:bg-app-blue-gray/10 rounded-full transition-all bg-white shadow-sm">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="grid grid-cols-7 gap-2 mb-8 border-b border-app-blue-gray/20 pb-4">
        {daysOfWeek.map(d => <div key={d} className="text-center text-[10px] font-bold text-app-blue-gray uppercase tracking-widest">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-x-2 gap-y-6">
        {Array.from({ length: calendarData.startingDay }).map((_, i) => <div key={i} className="aspect-square"></div>)}
        {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayCases = calendarData.casesByDay[day] || [];
          const hasEntry = dayCases.length > 0;
          const hasLearning = dayCases.some(c => c.learning && c.learning.trim() !== '');
          const isSelected = selectedDay === day;
          
          return (
            <button key={day} onClick={() => handleDaySelect(day)} className={`aspect-square flex flex-col items-center justify-center relative rounded-xl transition-all shadow-sm ${isSelected ? 'bg-app-blue-gray text-white scale-110 z-10' : hasEntry ? 'bg-white border border-app-blue-gray/20' : 'bg-transparent hover:bg-white'}`}>
              <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-text-main'}`}>{day}</span>
              {!isSelected && (
                <div className="h-4 flex items-center justify-center gap-1 mt-1">
                  {hasEntry && <div className="w-1.5 h-1.5 rounded-full bg-app-blue-gray"></div>}
                  {hasLearning && <div className="w-1.5 h-1.5 rounded-full bg-app-clay"></div>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-16 space-y-6 animate-gentle border-t-2 border-app-blue-gray/20 pt-10">
          {selectedDayCases.length > 0 ? (
            <>
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40 mb-4">ملاحظات {selectedDay}:</h3>
              <div className="space-y-4">
                {selectedDayCases.map(c => (
                  <div key={c.id} className="p-6 border-2 border-app-blue-gray/10 rounded-custom bg-white space-y-3 group transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-text-main">
                        {c.feeling || 'غير محدد'} 
                        {(c.feeling || c.context) ? ' · ' : ''}
                        {c.context || 'غير محدد'}
                      </p>
                      <button onClick={() => setDeletingId(c.id)} className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-500 hover:underline border border-mirror-border bg-white rounded-md px-2 py-1 transition-all">مسح</button>
                    </div>
                    {c.learning && <p className="italic text-text-main text-base font-semibold leading-relaxed">"{c.learning}"</p>}
                  </div>
                ))}
                {selectedDayCases.length < 2 && (
                  <button 
                    onClick={handleStartRetroactive}
                    className="w-full py-4 border-2 border-dashed border-app-blue-gray/30 rounded-custom text-sm text-app-blue-gray font-bold hover:bg-white transition-all"
                  >
                    إضافة تسجيل آخر
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-6 py-4 bg-white p-8 rounded-custom border border-app-blue-gray/10">
              <h3 className="text-xl font-semibold text-text-main">تحب تسجل حاجة عن اليوم ده؟</h3>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button 
                  onClick={handleStartRetroactive}
                  className="w-full py-4 bg-app-blue-gray text-white rounded-xl font-medium transition-all shadow-md"
                >
                  سجل
                </button>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="w-full py-4 text-text-muted font-bold"
                >
                  سيبه
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;

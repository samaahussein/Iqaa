
import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import DailyMode from './components/DailyMode';
import RealityMode from './components/RealityMode';
import CalendarView from './components/CalendarView';
import WeeklyOverview from './components/WeeklyOverview';
import HistoryView from './components/HistoryView';
import PatternManager from './components/PatternManager';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('INTRO');
  const [retroactiveDate, setRetroactiveDate] = useState<Date | undefined>(undefined);

  const handleStartDaily = (date?: Date) => {
    setRetroactiveDate(date);
    setMode('DAILY');
  };

  const startApp = () => {
    localStorage.setItem('iqaa_visited', 'true');
    setMode('HOME');
  };

  const renderContent = () => {
    switch (mode) {
      case 'INTRO':
        return (
          <div className="h-[100vh] w-full flex flex-col items-center justify-center bg-app-bg px-6 text-center animate-gentle" dir="rtl">
            <div className="space-y-12 max-w-sm flex flex-col items-center">
              <div className="flex items-end justify-center gap-1.5 mb-2 h-12">
                <div className="w-1.5 h-6 bg-app-clay rounded-full opacity-80 animate-pulse"></div>
                <div className="w-1.5 h-10 bg-app-sage rounded-full opacity-80 animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-8 bg-app-mauve rounded-full opacity-80 animate-pulse [animation-delay:0.4s]"></div>
                <div className="w-1.5 h-12 bg-app-olive rounded-full opacity-80 animate-pulse [animation-delay:0.1s]"></div>
                <div className="w-1.5 h-7 bg-app-blue-gray rounded-full opacity-80 animate-pulse [animation-delay:0.3s]"></div>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-semibold text-text-main tracking-tight">إيقاع Iqaa</h1>
                <p className="text-lg text-text-muted font-medium opacity-80" dir="ltr">
                  A witnessing space for your inner rhythm
                </p>
              </div>
              <div className="pt-8 w-full">
                <button 
                  onClick={startApp}
                  className="w-full py-5 bg-text-main text-white rounded-custom font-medium text-xl shadow-airy transition-all active:scale-95 hover:bg-black/90"
                >
                  خلينا نبدأ
                </button>
              </div>
            </div>
          </div>
        );
      case 'DAILY':
        return <DailyMode targetDate={retroactiveDate} onComplete={() => { setMode('HOME'); setRetroactiveDate(undefined); }} onCancel={() => { setMode('HOME'); setRetroactiveDate(undefined); }} />;
      case 'REALITY':
        return <RealityMode onComplete={() => setMode('HOME')} onCancel={() => setMode('HOME')} />;
      case 'CALENDAR':
        return <CalendarView onBack={() => setMode('HOME')} onRecordRetroactive={handleStartDaily} />;
      case 'WEEKLY_OVERVIEW':
        return <WeeklyOverview onBack={() => setMode('HOME')} />;
      case 'HISTORY':
        return <HistoryView onBack={() => setMode('HOME')} />;
      case 'PATTERNS':
        return <PatternManager onBack={() => setMode('HOME')} />;
      case 'SETTINGS':
        return <SettingsView onBack={() => setMode('HOME')} />;
      default:
        return (
          <div className="max-w-md mx-auto space-y-12 py-12 px-6 animate-gentle" dir="rtl">
            <header className="flex justify-between items-center mb-8">
              <div className="w-10"></div>
              <h1 className="text-4xl font-bold text-text-main tracking-tight">إيقاع</h1>
              <button onClick={() => setMode('SETTINGS')} className="p-2 text-text-muted hover:bg-gray-100 rounded-full transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </header>

            <div className="space-y-4">
              <button onClick={() => handleStartDaily()} className="w-full bg-app-clay text-white p-10 rounded-custom shadow-airy transition-all hover:brightness-105 active:scale-[0.98] text-center border-b-4 border-black/10">
                <span className="text-3xl font-bold">يوم عادي</span>
                <p className="text-white/80 text-sm mt-1 font-medium">سجل اللي حصل في يومك</p>
              </button>
              <button onClick={() => setMode('REALITY')} className="w-full bg-app-sage text-white p-10 rounded-custom shadow-airy transition-all hover:brightness-105 active:scale-[0.98] text-center border-b-4 border-black/10">
                <span className="text-3xl font-bold">مود واقع</span>
                <p className="text-white/80 text-sm mt-1 font-medium">إيه اللي حاسس بيه دلوقتي؟</p>
              </button>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4">
              {[
                { m: 'PATTERNS' as AppMode, label: 'عاداتي', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', bgColor: 'bg-app-mauve', textColor: 'text-white' },
                { m: 'CALENDAR' as AppMode, label: 'الأيام', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bgColor: 'bg-app-blue-gray', textColor: 'text-white' },
                { m: 'HISTORY' as AppMode, label: 'اللي فات', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', bgColor: 'bg-app-olive', textColor: 'text-white' },
                { m: 'WEEKLY_OVERVIEW' as AppMode, label: 'الأسبوع', icon: 'M13 10V3L4 14h7v7l9-11h-7z', bgColor: 'bg-app-mauve', textColor: 'text-white' },
              ].map((item) => (
                <button key={item.m} onClick={() => setMode(item.m)} className={`flex flex-col items-center justify-center p-6 rounded-custom shadow-airy hover:brightness-105 transition-all ${item.bgColor} ${item.textColor}`}>
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  <span className="text-base font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            <footer className="pt-8 text-center" dir="ltr">
              <p className="text-[10px] text-text-muted uppercase tracking-[0.4em] font-medium opacity-40">Iqaa &copy; 2024</p>
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-app-bg selection:bg-app-blue-gray/20 overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-start pointer-events-none">
        {mode !== 'HOME' && mode !== 'INTRO' && (
          <button onClick={() => setMode('HOME')} className="p-3 text-white hover:opacity-90 transition-all bg-text-main shadow-airy rounded-full pointer-events-auto active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
        )}
      </nav>
      <main className={mode === 'INTRO' ? '' : 'pt-4 pb-16'}><div key={mode}>{renderContent()}</div></main>
    </div>
  );
};

export default App;

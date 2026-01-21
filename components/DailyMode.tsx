
import React, { useState, useEffect } from 'react';
import { 
  EnergyLevel, Feeling, Context, Case, LearningType 
} from '../types.ts';
import { 
  FEELING_OPTIONS, CONTEXT_OPTIONS
} from '../constants.ts';
import { saveCase, getTodaysCount } from '../services/storage.ts';
import { classifyLearning } from '../services/classifier.ts';

interface DailyModeProps {
  onComplete: () => void;
  onCancel: () => void;
  targetDate?: Date;
}

const DailyMode: React.FC<DailyModeProps> = ({ onComplete, onCancel, targetDate }) => {
  const [initialCount] = useState(() => getTodaysCount(targetDate));
  const [sessionCount, setSessionCount] = useState(0);
  const [step, setStep] = useState(0); 
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (initialCount >= 2) {
      setStep(-1);
    }
  }, [initialCount]);

  const [dailyEnergy, setDailyEnergy] = useState<EnergyLevel | undefined>(undefined);
  const [currentEntry, setCurrentEntry] = useState<Partial<Case>>({
    feeling: undefined,
    context: undefined,
    whatHappened: '',
    howItFelt: '',
    whatIDid: '',
    whatResulted: '',
    learning: '',
  });

  const nextStep = () => setStep(prev => prev + 1);

  const handleSaveEntry = async () => {
    setIsSaving(true);
    const learningType: LearningType = await classifyLearning(
      currentEntry.whatIDid || "", 
      currentEntry.whatResulted || ""
    );

    const timestamp = targetDate ? targetDate.getTime() : Date.now();

    const newCase: Case = {
      id: crypto.randomUUID(),
      timestamp,
      energy: dailyEnergy,
      feeling: currentEntry.feeling as Feeling,
      context: currentEntry.context as Context,
      whatHappened: currentEntry.whatHappened || '',
      howItFelt: currentEntry.howItFelt || '',
      whatIDid: currentEntry.whatIDid || '',
      whatResulted: currentEntry.whatResulted || '',
      learning: currentEntry.learning?.trim() || undefined,
      learningType: learningType, 
    };
    
    saveCase(newCase);
    setIsSaving(false);
    
    const newSessionCount = sessionCount + 1;
    setSessionCount(newSessionCount);
    
    if (initialCount + newSessionCount >= 2) {
      setStep(6); 
    } else {
      setStep(5); 
    }
  };

  const startNextEntry = () => {
    setCurrentEntry({
      feeling: undefined,
      context: undefined,
      whatHappened: '',
      howItFelt: '',
      whatIDid: '',
      whatResulted: '',
      learning: '',
    });
    setStep(1); 
  };

  const OptionButton = ({ label, active, onClick, activeColor, textColor = 'text-text-main' }: any) => (
    <button
      onClick={onClick}
      className={`px-4 py-5 rounded-custom transition-all text-lg font-bold active:scale-[0.98] border-b-4 shadow-sm ${
        active 
        ? `${activeColor} ${textColor} border-black/10 scale-[1.02]` 
        : `bg-white/90 text-text-muted border-mirror-border hover:border-app-clay/40`
      }`}
    >
      {label}
    </button>
  );

  const SkipButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="mt-6 py-3 text-text-muted font-bold text-base hover:text-text-main transition-all flex items-center justify-center gap-2 opacity-60 hover:opacity-100"
    >
      تخطي
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  );

  const getStepBg = () => {
    switch(step) {
      case 0: return 'bg-app-clay/15';
      case 1: return 'bg-app-mauve/15';
      case 2: return 'bg-app-blue-gray/15';
      case 4: return 'bg-app-sage/15';
      case 5: return 'bg-app-olive/15';
      case 6: return 'bg-app-sage/15';
      default: return 'bg-white';
    }
  }

  return (
    <div className={`max-w-md mx-auto p-8 rounded-custom animate-gentle shadow-airy border border-mirror-border transition-colors duration-700 min-h-[600px] flex flex-col ${getStepBg()}`} dir="rtl" key={step}>
      {targetDate && step >= 0 && (
        <div className="mb-4 text-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">
            تسجيل قديم — {targetDate.toLocaleDateString('ar-EG')}
          </span>
        </div>
      )}
      
      {step === -1 && (
        <div className="space-y-10 text-center py-12 flex-1 flex flex-col justify-center">
          <div className="text-app-clay">
            <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-text-main leading-tight">كفاية كدة النهاردة.</h2>
          <button 
            onClick={onComplete}
            className="w-full mt-6 py-5 bg-text-main text-white rounded-custom font-bold text-xl transition-all shadow-lg"
          >
            تمام
          </button>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-10 flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-text-main text-center leading-tight">طاقتك عاملة إيه؟</h2>
          <div className="flex flex-col gap-4 flex-1 justify-center">
            <OptionButton label="قليلة" active={dailyEnergy === EnergyLevel.LOW} activeColor="bg-app-clay text-white" onClick={() => { setDailyEnergy(EnergyLevel.LOW); nextStep(); }} />
            <OptionButton label="متوسطة" active={dailyEnergy === EnergyLevel.MEDIUM} activeColor="bg-app-mauve text-white" onClick={() => { setDailyEnergy(EnergyLevel.MEDIUM); nextStep(); }} />
            <OptionButton label="عالية" active={dailyEnergy === EnergyLevel.HIGH} activeColor="bg-app-sage text-white" onClick={() => { setDailyEnergy(EnergyLevel.HIGH); nextStep(); }} />
            <SkipButton onClick={nextStep} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-10 flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-text-main text-center leading-tight">إيه الشعور الغالب؟</h2>
          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
            {FEELING_OPTIONS.map((opt) => (
              <OptionButton key={opt} label={opt} active={currentEntry.feeling === opt} activeColor="bg-app-mauve text-white" onClick={() => { setCurrentEntry({...currentEntry, feeling: opt}); nextStep(); }} />
            ))}
            <div className="col-span-2 flex justify-center">
              <SkipButton onClick={nextStep} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-10 flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-text-main text-center leading-tight">بخصوص إيه؟</h2>
          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
            {CONTEXT_OPTIONS.map((opt) => (
              <OptionButton key={opt} label={opt} active={currentEntry.context === opt} activeColor="bg-app-blue-gray text-white" onClick={() => { setCurrentEntry({...currentEntry, context: opt}); setStep(4); }} />
            ))}
            <div className="col-span-2 flex justify-center">
              <SkipButton onClick={() => setStep(4)} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8 flex-1 flex flex-col">
          <div className="space-y-8 overflow-y-auto px-1 flex-1 scrollbar-thin">
            <div className="space-y-4">
              <label className="text-sm font-bold text-app-clay uppercase block pr-2">حصل إيه؟</label>
              <textarea
                autoFocus
                className="w-full p-5 border-4 border-app-clay/30 rounded-custom text-xl outline-none h-32 resize-none bg-white focus:border-app-clay shadow-sm transition-all"
                value={currentEntry.whatHappened}
                onChange={(e) => setCurrentEntry({...currentEntry, whatHappened: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-app-mauve uppercase block pr-2">حسّيت بإيه؟</label>
              <input
                type="text"
                className="w-full p-5 border-4 border-app-mauve/30 rounded-custom text-xl outline-none bg-white focus:border-app-mauve shadow-sm transition-all"
                value={currentEntry.howItFelt}
                onChange={(e) => setCurrentEntry({...currentEntry, howItFelt: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-app-blue-gray uppercase block pr-2">عملت إيه؟</label>
              <input
                type="text"
                className="w-full p-5 border-4 border-app-blue-gray/30 rounded-custom text-xl outline-none bg-white focus:border-app-blue-gray shadow-sm transition-all"
                value={currentEntry.whatIDid}
                onChange={(e) => setCurrentEntry({...currentEntry, whatIDid: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-app-olive uppercase block pr-2">النتيجة إيه؟</label>
              <textarea
                className="w-full p-5 border-4 border-app-olive/30 rounded-custom text-xl outline-none h-32 resize-none bg-white focus:border-app-olive shadow-sm transition-all"
                value={currentEntry.whatResulted}
                onChange={(e) => setCurrentEntry({...currentEntry, whatResulted: e.target.value})}
              />
            </div>
            
            <div className="space-y-6 pt-8 border-t-4 border-app-sage/40">
              <div className="text-center space-y-2">
                <label className="text-2xl font-bold text-text-main block leading-tight">تحب تفتكر ايه لو مريت بنفس الشعور أو بموقف مشابه</label>
                <p className="text-sm text-text-muted opacity-60 font-medium">(درس اتعلمته لنفسك)</p>
              </div>
              <textarea
                className="w-full p-6 border-4 border-app-clay/50 rounded-custom text-xl outline-none h-32 resize-none bg-white focus:border-app-clay shadow-md transition-all italic font-bold"
                value={currentEntry.learning}
                onChange={(e) => setCurrentEntry({...currentEntry, learning: e.target.value})}
                placeholder="ولو جملة بسيطة.."
              />
            </div>
          </div>
          
          <button 
            disabled={isSaving}
            onClick={handleSaveEntry}
            className="w-full py-6 bg-text-main text-white rounded-custom disabled:opacity-30 font-bold transition-all text-2xl shadow-xl border-b-4 border-black/20"
          >
            {isSaving ? 'لحظة...' : 'تم الحفظ'}
          </button>
        </div>
      )}

      {(step === 5 || step === 6) && (
        <div className="space-y-12 text-center py-12 flex-1 flex flex-col justify-center">
          {step === 5 ? (
            <>
              <h2 className="text-3xl font-bold text-text-main leading-tight">تحب تضيف حاجة تانية؟</h2>
              <div className="flex flex-col gap-5">
                <button 
                  onClick={startNextEntry}
                  className="py-6 bg-app-clay text-white rounded-custom font-bold transition-all text-2xl shadow-lg border-b-4 border-black/10"
                >
                  آه، لسه في حاجات
                </button>
                <button 
                  onClick={onComplete}
                  className="py-6 text-text-muted rounded-custom border-2 border-mirror-border font-bold text-xl hover:bg-white/50 transition-all bg-white"
                >
                  لا، كفاية كدة
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-app-sage">
                <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text-main leading-tight">يومك اتسجل بنجاح.</h2>
              <button 
                onClick={onComplete}
                className="w-full mt-10 py-6 bg-text-main text-white rounded-custom font-bold transition-all text-2xl shadow-xl"
              >
                رجوع للرئيسية
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyMode;

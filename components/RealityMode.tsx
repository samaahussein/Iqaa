
import React, { useState } from 'react';
import { Context, Feeling, Case } from '../types.ts';
import { CONTEXT_OPTIONS, FEELING_OPTIONS } from '../constants.ts';
import { findMatch } from '../services/storage.ts';

interface RealityModeProps {
  onComplete: () => void;
  onCancel: () => void;
}

const RealityMode: React.FC<RealityModeProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1); 
  const [selection, setSelection] = useState<Partial<Case>>({ feeling: undefined, context: undefined });
  const [match, setMatch] = useState<Case | null>(null);

  const handleSearch = (finalContext: Context) => {
    if (selection.feeling) {
      const found = findMatch(finalContext, selection.feeling);
      setMatch(found);
    }
    setStep(3);
  };

  const OptionButton = ({ label, active, onClick, activeColor }: any) => (
    <button
      onClick={onClick}
      className={`px-4 py-5 rounded-custom border-b-4 transition-all text-lg font-bold active:scale-[0.98] shadow-sm ${
        active 
        ? `${activeColor} text-white border-black/10 scale-[1.02]` 
        : 'bg-white/90 text-text-muted border-mirror-border hover:border-app-sage/40'
      }`}
    >
      {label}
    </button>
  );

  const getStepBg = () => {
    if (step === 1) return 'bg-app-mauve/20';
    if (step === 2) return 'bg-app-blue-gray/20';
    if (step === 3) return match ? 'bg-app-sage/25' : 'bg-app-clay/20';
    return 'bg-white';
  };

  return (
    <div className={`max-w-md mx-auto p-8 border border-mirror-border rounded-custom animate-gentle shadow-airy transition-colors duration-700 min-h-[600px] flex flex-col ${getStepBg()}`} dir="rtl" key={step}>
      {step === 1 && (
        <div className="space-y-12 flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-text-main text-center leading-tight">حاسس بإيه دلوقتي؟</h2>
          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
            {FEELING_OPTIONS.map((opt) => (
              <OptionButton key={opt} label={opt} active={selection.feeling === opt} activeColor="bg-app-mauve" onClick={() => { setSelection({...selection, feeling: opt as Feeling}); setStep(2); }} />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-12 flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-text-main text-center leading-tight">الإحساس ده بخصوص إيه؟</h2>
          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
            {CONTEXT_OPTIONS.map((opt) => (
              <OptionButton key={opt} label={opt} active={selection.context === opt} activeColor="bg-app-blue-gray" onClick={() => { const finalContext = opt as Context; setSelection({...selection, context: finalContext}); handleSearch(finalContext); }} />
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-12 flex-1 flex flex-col justify-center py-8">
          {!match ? (
            <div className="text-center space-y-10 animate-gentle px-2">
              <div className="text-app-clay">
                <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="space-y-6">
                <p className="text-text-main font-bold text-2xl leading-relaxed">واضح إن اللحظة دي تقيلة عليك.</p>
                <p className="text-text-muted font-bold text-xl leading-relaxed">عارف إنك حسيت بده قبل كده، وعدى.. ده كمان هيعدي..</p>
                <p className="text-text-main font-black text-3xl">واحدة واحدة.</p>
              </div>
              <button onClick={onCancel} className="w-full py-6 bg-text-main text-white rounded-custom font-bold transition-all text-2xl shadow-xl mt-4 border-b-4 border-black/20">تمام</button>
            </div>
          ) : (
            <div className="space-y-12 animate-gentle">
              <div className="bg-white p-12 rounded-[40px] border-8 border-app-sage shadow-2xl text-center">
                <p className="text-2xl text-text-main leading-relaxed font-bold italic">"{match.learning}"</p>
                <div className="mt-8 pt-4 border-t-2 border-app-sage/30">
                  <span className="text-xs font-black text-app-sage uppercase tracking-widest">رسالة من ذكرياتك</span>
                </div>
              </div>
              <button onClick={onComplete} className="w-full py-6 bg-text-main text-white rounded-custom font-bold transition-all text-2xl shadow-xl border-b-4 border-black/20">فهمت</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealityMode;

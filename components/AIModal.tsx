
import React from 'react';
import { AIResult } from '../types';

interface AIModalProps {
  isOpen: boolean;
  type: 'expand' | 'grammar' | null;
  result: AIResult | null;
  onClose: () => void;
  onAccept: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, type, result, onClose, onAccept }) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${type === 'grammar' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <i className={type === 'grammar' ? 'fa-solid fa-check-double' : 'fa-solid fa-expand'}></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {type === 'grammar' ? 'Grammar Correction' : 'Prose Expansion'}
              </h3>
              <p className="text-xs text-slate-500">Review Gemini's suggestions below</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Original</h4>
            <div 
              className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-500 editor-font text-base line-through italic opacity-60 prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: result.original }}
            />
          </section>

          <section>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              Suggestion
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">NEW</span>
            </h4>
            <div 
              className="bg-indigo-50/30 border border-indigo-100 p-5 rounded-xl text-slate-900 editor-font text-lg leading-relaxed shadow-inner prose prose-indigo max-w-none"
              dangerouslySetInnerHTML={{ __html: result.suggestion }}
            />
          </section>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={onAccept}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
          >
            Apply Suggestion
            <i className="fa-solid fa-sparkles text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

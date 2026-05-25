import React, { useState } from 'react';
import { Task } from '../types';
import { Trash2, Plus, Sparkles, Loader2, Check, ArrowRight, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BrainDumpProps {
  onAddTasks: (newTasks: Omit<Task, 'id' | 'completed' | 'createdAt'>[]) => void;
  onSuccessCallback?: () => void;
}

interface ExtractedTask {
  text: string;
  category: Task['category'];
  energyLevel: 'low' | 'medium' | 'deep';
}

export default function BrainDump({ onAddTasks, onSuccessCallback }: BrainDumpProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedTask[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setExtracted([]);

    try {
      const response = await fetch('/api/brain-dump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      if (data.tasks) {
        setExtracted(data.tasks);
      }
    } catch (e) {
      console.error("Failed API brain dump, running robust fallback", e);
      // Inline robust fallback parser for security/offline convenience
      const sentences = text
        .split(/(?:[.\n;,]|\band\b|\bthen\b|\balso\b)/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 3);

      const localTasks: ExtractedTask[] = sentences.map((sentence) => {
        const textLower = sentence.toLowerCase();
        let category: Task['category'] = 'admin';
        if (/(?:water|stretch|breathe|drink|tidy|pill|meds|eat|snack|shower|teeth|brush|nap|walk)/i.test(textLower)) {
          category = 'tiny-win';
        } else if (/(?:study|write|code|report|plan|build|program|exam|math|complex|focus|think)/i.test(textLower)) {
          category = 'deep-focus';
        } else if (/(?:relax|rest|break|coffee|tea|music|meditate|sleep)/i.test(textLower)) {
          category = 'recovery';
        } else if (/(?:routine|daily|habit|morning|evening|afternoon)/i.test(textLower)) {
          category = 'routine';
        }

        let energyLevel: ExtractedTask['energyLevel'] = 'medium';
        if (/(?:water|stretch|breathe|tidy|pill|meds|snack)/i.test(textLower)) {
          energyLevel = 'low';
        } else if (/(?:study|write|code|report|plan|build|program|exam|math|complex|think)/i.test(textLower)) {
          energyLevel = 'deep';
        }

        let cleanText = sentence
          .replace(/^(i need to|i have to|i should|i want to|must|please|can someone|need to|have to|remember to|don't forget to|go to|buy a|get a)\s+/i, '')
          .replace(/^\s*[-*•+]\s*/, '');
        
        if (cleanText.length > 0) {
          cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
        } else {
          cleanText = sentence;
        }

        return { text: cleanText, category, energyLevel };
      });
      setExtracted(localTasks);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = () => {
    if (extracted.length === 0) return;
    onAddTasks(extracted);
    setText('');
    setExtracted([]);
    setSaveStatus('success');
    if (onSuccessCallback) {
      onSuccessCallback();
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const updateExtractedCategory = (index: number, cat: ExtractedTask['category']) => {
    setExtracted(prev => prev.map((item, id) => id === index ? { ...item, category: cat } : item));
  };

  const updateExtractedEnergy = (index: number, energy: ExtractedTask['energyLevel']) => {
    setExtracted(prev => prev.map((item, id) => id === index ? { ...item, energyLevel: energy } : item));
  };

  const removeExtractedItem = (index: number) => {
    setExtracted(prev => prev.filter((_, id) => id !== index));
  };

  return (
    <div className="space-y-6" id="brain-dump-view">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-purple-950 tracking-tight font-sans">
          Cognitive Unload
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
          Your brain is for processing, not storing. Write down anything you need to accomplish without formats or fear. We will gently sort the chaos.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-[32px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-lg shadow-purple-900/5">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
            placeholder="Type whatever is on your mind... 'I have to pay electricity bill, also stretch because my back is sore, stretch now or walk the dog later, write draft review of study, study statistics tomorrow...'"
            className="w-full h-44 p-5 rounded-2xl bg-white/50 backdrop-blur-md font-sans border border-purple-100/40 focus:outline-none focus:border-purple-400 focus:bg-white text-slate-800 transition leading-relaxed placeholder-slate-400 text-[14px]"
            id="brain-dump-textarea"
          />
          {text.trim().length > 0 && extracted.length === 0 && (
            <button
              onClick={() => setText('')}
              className="absolute bottom-3 right-3 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-450 hover:text-slate-700 bg-white hover:bg-neutral-50/50 border border-purple-100/30 transition shadow-sm font-bold cursor-pointer"
            >
              Clear Trash
            </button>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-purple-600 font-sans font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Messy formatting and typos are 100% fine.
          </div>
          {extracted.length === 0 && (
            <button
              onClick={handleProcess}
              disabled={isProcessing || !text.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-bold text-sm transition shadow-lg shadow-purple-600/15 cursor-pointer"
              id="dump-process-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  De-cluttering chaos...
                </>
              ) : (
                <>
                  <Sparkles size={16} fill="white" />
                  Extract & Classify
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 text-center bg-purple-50/40 border border-purple-100 rounded-[32px] shadow-sm backdrop-blur-md"
          >
            <Loader2 className="mx-auto text-purple-600 animate-spin mb-3" size={24} />
            <h3 className="font-bold text-purple-900 font-sans text-base">Unraveling Chaotic thoughts</h3>
            <p className="text-purple-600 text-xs mt-1 font-sans font-semibold">Dividing sentences, removing guilt modifiers, scaling down friction blocks...</p>
          </motion.div>
        )}

        {extracted.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-bold text-slate-700 font-sans flex items-center gap-1.5">
                <CornerDownRight size={16} className="text-purple-500" />
                Parsed Cognitive Goals ({extracted.length})
              </span>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                id="dump-save-all-btn"
              >
                <Check size={14} strokeWidth={2.5} />
                Confirm & Add to Goals
              </button>
            </div>

            <div className="grid gap-3">
              {extracted.map((item, index) => (
                <motion.div
                  key={index}
                  layout
                  className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/85 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-800"
                >
                  <div className="flex items-start gap-2 max-w-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-slate-700 font-sans font-medium leading-relaxed">{item.text}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Category selectors */}
                    <select
                      value={item.category}
                      onChange={(e) => updateExtractedCategory(index, e.target.value as ExtractedTask['category'])}
                      className="text-xs border border-purple-100 rounded-xl py-1.5 px-2 bg-white/80 text-slate-700 hover:bg-neutral-50 focus:outline-none focus:border-purple-400 focus:bg-white cursor-pointer font-medium"
                    >
                      <option value="tiny-win">🌸 Tiny Win</option>
                      <option value="deep-focus">🧠 Needs concentration</option>
                      <option value="admin">💼 Life admin</option>
                      <option value="recovery">🌱 Reset / Recovery</option>
                      <option value="routine">☀️ Gentle Routine</option>
                    </select>

                    {/* Energy selectors */}
                    <select
                      value={item.energyLevel}
                      onChange={(e) => updateExtractedEnergy(index, e.target.value as ExtractedTask['energyLevel'])}
                      className="text-xs border border-purple-100 rounded-xl py-1.5 px-2 bg-white/80 text-slate-700 hover:bg-neutral-50 focus:outline-none focus:border-purple-400 focus:bg-white cursor-pointer font-medium"
                    >
                      <option value="low">⚡ Low Energy</option>
                      <option value="medium">⚡⚡ Medium Energy</option>
                      <option value="deep">⚡⚡⚡ High Energy</option>
                    </select>

                    <button
                      onClick={() => removeExtractedItem(index)}
                      className="p-2 rounded-xl bg-white/80 border border-purple-100/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition shadow-sm cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs font-sans font-semibold flex items-center gap-2 shadow-sm"
          >
            <Check size={16} className="text-emerald-500" />
            Decluttered thoughts persisted successfully! Select 'Start Here' to focus.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

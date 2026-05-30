'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Loader2,
  Check,
  Save,
  type LucideIcon,
} from 'lucide-react';

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group py-2">
      <button onClick={onChange} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </label>
  );
}

export function Select({ label, value, options, onChange, icon: Icon, hint }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: LucideIcon; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none px-3 py-2 rounded-lg bg-white border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Input({ label, value, onChange, icon: Icon, hint, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; icon?: LucideIcon; hint?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors" />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionHeader({ icon: Icon, title, badge }: { icon: LucideIcon; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {badge && <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{badge}</span>}
    </div>
  );
}

export function SaveBar({ hint }: { hint?: string }) {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const handleSave = () => { setSaveState('saving'); setTimeout(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000); }, 800); };
  return (
    <div className="flex items-center justify-between pt-3 border-t border-border/60">
      <p className="text-[10px] text-muted-foreground">{hint || 'Changes are saved per project.'}</p>
      <button onClick={handleSave} disabled={saveState === 'saving'} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${saveState === 'saved' ? 'bg-success' : 'bg-primary hover:bg-primary/90'}`}>
        {saveState === 'saving' ? <Loader2 className="w-4 h-4" style={{ animation: 'spin 0.8s linear infinite' }} /> : saveState === 'saved' ? <><Check className="w-4 h-4" style={{ animation: 'scaleIn 0.3s ease-out' }} /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
      </button>
    </div>
  );
}

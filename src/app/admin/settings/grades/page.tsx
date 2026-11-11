'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  Save, 
  Loader2, 
  Plus,
  Trash2,
  AlertTriangle,
  Award,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { updateSchoolSettings } from '@/lib/supabase-service';

/**
 * Standard Institutional Scale for The Spirit School Samundri.
 */
const DEFAULT_SCALE = [
  { grade: 'A+', min: 90, label: 'Outstanding', remark: 'Truly exceptional academic performance and dedication. Keep it up!' },
  { grade: 'A', min: 80, label: 'Excellent', remark: 'Highly commendable results and strong analytical skills shown.' },
  { grade: 'B', min: 70, label: 'Very Good', remark: 'Solid performance with consistent focus on the curriculum.' },
  { grade: 'C', min: 60, label: 'Good', remark: 'Satisfactory results. Strive for even better conceptual clarity.' },
  { grade: 'D', min: 50, label: 'Average', remark: 'A fair effort, but more hard work is required to improve the grade.' },
  { grade: 'F', min: 0, label: 'Fail', remark: 'Performance is below threshold. Urgent attention and revision needed.' },
];

export default function GradingSettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSchoolStore();

  const [scale, setScale] = useState(settings?.gradingScale || DEFAULT_SCALE);
  const [submitting, setSubmitting] = useState(false);

  // Sync state when settings load
  useEffect(() => {
    if (settings?.gradingScale && settings.gradingScale.length > 0) {
      setScale(settings.gradingScale);
    }
  }, [settings?.gradingScale]);

  const handleSave = async () => {
    // Validation
    const hasEmptyGrade = scale.some(s => !s.grade.trim());
    if (hasEmptyGrade) {
      toast({ 
        title: "Validation Error", 
        description: "Every tier must have a Grade Letter defined.", 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    try {
      // Sort scale by percentage descending for logic consistency in computation
      const sortedScale = [...scale].sort((a, b) => b.min - a.min);
      const ok = await updateSchoolSettings({ gradingScale: sortedScale });
      if (ok && settings) {
        setSettings({ ...settings, gradingScale: sortedScale });
      }
      toast({ 
        title: "Grading Registry Updated", 
        description: "New protocols have been synchronized with the result engine." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm("Restore institutional standard scale? All custom remarks will be overwritten.")) {
      setScale(DEFAULT_SCALE);
    }
  };

  const updateField = (index: number, field: string, val: any) => {
    const newScale = [...scale];
    (newScale[index] as any)[field] = field === 'min' ? (parseInt(val) || 0) : val;
    setScale(newScale);
  };

  const addTier = () => {
    setScale([...scale, { grade: '', min: 0, label: '', remark: '' }]);
  };

  const removeTier = (index: number) => {
    if (scale.length <= 1) {
      toast({ title: "System Guard", description: "You must maintain at least one grade level." });
      return;
    }
    setScale(scale.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4 sm:px-0 mt-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit uppercase">Grading Protocols</h1>
          <p className="text-muted-foreground font-medium">Manual authority for managing thresholds and Principal's feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={resetToDefault} className="rounded-full gap-2 border-2 h-12 px-5 font-bold text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-white">
            <RefreshCcw className="h-4 w-4" /> Reset
          </Button>
          <Button variant="outline" onClick={addTier} className="rounded-full gap-2 border-2 border-primary-100 h-12 px-6 font-bold text-primary-600 hover:bg-primary-50 dark:border-primary-900/30">
            <Plus className="h-4 w-4" /> Add Tier
          </Button>
          <Button onClick={handleSave} disabled={submitting} className="rounded-full shadow-lg h-12 px-10 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold">
             {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
             Commit Protocols
          </Button>
        </div>
      </header>

      <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
        <CardHeader className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
           <CardTitle className="text-xl dark:text-white flex items-center gap-3 font-outfit uppercase">
             <Award className="h-6 w-6 text-primary-600" /> Dynamic Achievement matrix
           </CardTitle>
           <CardDescription className="dark:text-slate-400">Define percentages, achievement labels, and automated Principal comments.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
           <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {scale.map((g, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col xl:flex-row items-start xl:items-center gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-primary-200 dark:hover:border-primary-900 transition-all"
                  >
                     <div className="flex gap-4 w-full xl:w-auto">
                       <div className="space-y-1 w-24">
                          <Label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Grade</Label>
                          <Input 
                            value={g.grade} 
                            onChange={e => updateField(i, 'grade', e.target.value)}
                            placeholder="A+"
                            className="h-14 rounded-2xl bg-white dark:bg-navy-950 border-none font-black text-2xl text-center text-primary-600 shadow-inner uppercase"
                          />
                       </div>
                       <div className="space-y-1 w-24">
                          <Label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Min %</Label>
                          <Input 
                            type="number" 
                            value={g.min} 
                            onChange={e => updateField(i, 'min', e.target.value)}
                            className="h-14 rounded-2xl bg-white dark:bg-navy-950 border-none font-black text-xl text-center dark:text-white shadow-inner"
                          />
                       </div>
                     </div>

                     <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <div className="space-y-1">
                           <Label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Label</Label>
                           <Input 
                             value={g.label} 
                             onChange={e => updateField(i, 'label', e.target.value)}
                             placeholder="e.g. Outstanding"
                             className="h-14 rounded-2xl bg-white dark:bg-navy-950 border-none font-bold dark:text-white px-5"
                           />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                           <Label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Automated Principal Remark</Label>
                           <Input 
                             value={g.remark || ""} 
                             onChange={e => updateField(i, 'remark', e.target.value)}
                             className="h-14 rounded-2xl bg-white dark:bg-navy-950 border-none font-medium text-xs dark:text-white px-5"
                             placeholder="Enter feedback for this tier..."
                           />
                        </div>
                     </div>

                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => removeTier(i)}
                       className="h-12 w-12 rounded-2xl text-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                     >
                       <Trash2 className="h-5 w-5" />
                     </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-100 dark:border-amber-900/30 p-8 rounded-[2.5rem] flex gap-6">
        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="space-y-2">
          <p className="text-base font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest">Logic Control Active</p>
          <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-medium">
              The Result Computation Engine uses these thresholds to assign grades and remarks. To set the failure boundary, ensure the lowest tier (e.g., 'F') is set to <b>0%</b>. The system will automatically classify students based on these manual settings.
          </p>
        </div>
      </div>
    </div>
  );
}

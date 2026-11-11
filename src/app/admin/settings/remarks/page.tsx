'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  RefreshCcw, 
  MessageSquareQuote, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  AlertCircle,
  HelpCircle,
  Star,
  Trophy,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { RemarksCategoryTemplates, RemarksConfig } from '@/types';
import { DEFAULT_REMARKS_CONFIG, getDynamicRemarks } from '@/lib/print/result-cards';
import { motion, AnimatePresence } from 'framer-motion';
import { updateSchoolSettings } from '@/lib/supabase-service';

const CATEGORY_META = [
  { 
    key: 'firstPosition' as keyof RemarksCategoryTemplates, 
    title: '1st Position (پہلی پوزیشن)', 
    subtitle: 'Highest achiever in the class', 
    badge: '1st Rank', 
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: Trophy
  },
  { 
    key: 'secondPosition' as keyof RemarksCategoryTemplates, 
    title: '2nd Position (دوسری پوزیشن)', 
    subtitle: 'Runner-up with top honors', 
    badge: '2nd Rank', 
    color: 'bg-slate-400/10 text-slate-700 dark:text-slate-300 border-slate-400/20',
    icon: Award
  },
  { 
    key: 'thirdPosition' as keyof RemarksCategoryTemplates, 
    title: '3rd Position (تیسری پوزیشن)', 
    subtitle: 'Third place academic distinction', 
    badge: '3rd Rank', 
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    icon: Award
  },
  { 
    key: 'topTen' as keyof RemarksCategoryTemplates, 
    title: 'Top 10 Achievers (ٹاپ 10 رینک)', 
    subtitle: 'High performers holding positions 4th to 10th', 
    badge: 'Rank 4 - 10', 
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: Star
  },
  { 
    key: 'gradeAPlus' as keyof RemarksCategoryTemplates, 
    title: 'Grade A+ (80% - 100%) - Outstanding', 
    subtitle: 'Exceptional overall mastery across all subjects', 
    badge: '80% - 100%', 
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2
  },
  { 
    key: 'gradeA' as keyof RemarksCategoryTemplates, 
    title: 'Grade A (70% - 79.9%) - Excellent', 
    subtitle: 'Very good overall performance with strong potential', 
    badge: '70% - 79.9%', 
    color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
    icon: CheckCircle2
  },
  { 
    key: 'gradeB' as keyof RemarksCategoryTemplates, 
    title: 'Grade B (60% - 69.9%) - Very Good', 
    subtitle: 'Good solid standing; needs consistency', 
    badge: '60% - 69.9%', 
    color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    icon: CheckCircle2
  },
  { 
    key: 'gradeC' as keyof RemarksCategoryTemplates, 
    title: 'Grade C (50% - 59.9%) - Needs Hard Work (محنت کی ضرورت ہے)', 
    subtitle: 'Satisfactory effort; student requires structured hard work and focus', 
    badge: '50% - 59.9%', 
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: AlertCircle
  },
  { 
    key: 'gradeD' as keyof RemarksCategoryTemplates, 
    title: 'Grade D (40% - 49.9%) - Borderline Pass', 
    subtitle: 'Average result; intensive hard work and daily revision needed', 
    badge: '40% - 49.9%', 
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    icon: AlertCircle
  },
  { 
    key: 'fail' as keyof RemarksCategoryTemplates, 
    title: 'Below 40% / Fail - Needs Immediate Attention', 
    subtitle: 'Result below passing criteria; daily supervision & remedial coaching required', 
    badge: 'Below 40%', 
    color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    icon: ShieldAlert
  }
];

export default function PrincipalRemarksSettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSchoolStore();

  const [activeTab, setActiveTab] = useState<'singleTerm' | 'combinedTerm'>('singleTerm');
  const [config, setConfig] = useState<RemarksConfig>(DEFAULT_REMARKS_CONFIG);
  const [submitting, setSubmitting] = useState(false);

  // Live Simulator state
  const [simPct, setSimPct] = useState<number>(94);
  const [simPos, setSimPos] = useState<string>('1st');

  useEffect(() => {
    if (settings?.remarksConfig) {
      setConfig({
        singleTerm: {
          ...DEFAULT_REMARKS_CONFIG.singleTerm,
          ...(settings.remarksConfig.singleTerm || {})
        },
        combinedTerm: {
          ...DEFAULT_REMARKS_CONFIG.combinedTerm,
          ...(settings.remarksConfig.combinedTerm || {})
        }
      });
    }
  }, [settings?.remarksConfig]);

  const handleUpdate = (tab: 'singleTerm' | 'combinedTerm', key: keyof RemarksCategoryTemplates, val: string) => {
    setConfig(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [key]: val
      }
    }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const ok = await updateSchoolSettings({ remarksConfig: config });
      if (ok && settings) {
        setSettings({ ...settings, remarksConfig: config });
      }
      toast({ 
        title: "Remarks Protocols Saved", 
        description: "Principal's overall remarks templates have been committed to all result cards." 
      });
    } catch (err: any) {
      toast({
        title: "Save Error",
        description: err.message || "Could not save remarks protocols.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to restore the recommended institutional defaults? Your custom modifications will be reset.")) {
      setConfig(DEFAULT_REMARKS_CONFIG);
      toast({
        title: "Defaults Restored",
        description: "Institutional comments reset. Click 'Commit Changes' to apply."
      });
    }
  };

  // Preview computation
  const simGrade = simPct >= 80 ? 'A+' : simPct >= 70 ? 'A' : simPct >= 60 ? 'B' : simPct >= 50 ? 'C' : simPct >= 40 ? 'D' : 'F';
  const simPosStr = simPos ? (simPos === 'none' ? '—' : `${simPos} Position`) : '—';
  const previewRemark = getDynamicRemarks({
    percentage: simPct,
    grade: simGrade,
    positionStr: simPosStr,
    isCombined: activeTab === 'combinedTerm',
    status: simPct >= 33 ? 'Pass' : 'Fail',
    remarksConfig: config
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4 sm:px-0 mt-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold uppercase text-[10px] tracking-widest border border-primary-200">
              Authority Protocols
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white font-outfit uppercase mt-1">
            Principal Remarks Manager
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Configure automated, overall result-based comments for Student Report Cards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="rounded-xl gap-2 border-slate-200 dark:border-white/10 h-11 px-5 font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300"
          >
            <RefreshCcw className="h-4 w-4" /> Reset Defaults
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={submitting} 
            className="rounded-xl shadow-md h-11 px-8 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold"
          >
             {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
             Commit Changes
          </Button>
        </div>
      </header>

      {/* Live Preview Simulator Card */}
      <Card className="border border-primary-100 dark:border-primary-900/30 shadow-sm bg-gradient-to-br from-primary-50/40 via-white to-blue-50/20 dark:from-navy-900/40 dark:via-card dark:to-navy-950 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-primary-100/50 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary-600 text-white rounded-lg shadow-sm">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-navy-900 dark:text-white">
                  Live Card Preview Simulator
                </CardTitle>
                <CardDescription className="text-xs">
                  Test and visualize how the Principal's comment appears on the report card based on overall numbers.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                Current Mode: {activeTab === 'singleTerm' ? 'Single Term' : 'Combined Annual'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white/70 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall Percentage (%)</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={simPct}
                  onChange={(e) => setSimPct(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <span className="font-extrabold text-sm w-12 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950 px-2 py-1 rounded text-center">
                  {simPct}%
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Position</Label>
              <select 
                value={simPos} 
                onChange={(e) => setSimPos(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="1st">1st Position (Top Scorer)</option>
                <option value="2nd">2nd Position</option>
                <option value="3rd">3rd Position</option>
                <option value="5th">5th Position (Top 10)</option>
                <option value="12th">12th Position (Beyond Top 10)</option>
                <option value="none">None (Standard)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade &amp; Status</Label>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-navy-900 text-white font-bold text-xs">{simGrade}</Badge>
                <Badge className={simPct >= 33 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-rose-500/10 text-rose-700 border-rose-500/20"}>
                  {simPct >= 33 ? "PASS" : "FAIL"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actual Card Snippet Preview */}
          <div className="border border-navy-900/30 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-[#0f2a4a] text-white text-[11px] font-extrabold px-3 py-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>PRINCIPAL &amp; TEACHER REMARKS (PRINT PREVIEW)</span>
              <span className="text-[10px] font-medium text-slate-300">Overall Result Evaluation</span>
            </div>
            <div className="p-4 text-center text-[13px] font-semibold text-slate-700 italic bg-white">
              "{previewRemark}"
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Single vs Combined */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-navy-900 p-1 rounded-xl h-12 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="singleTerm" className="rounded-lg font-bold text-xs sm:text-sm px-6 gap-2">
            <Layers className="h-4 w-4" /> Single Term (1st / Mid Term)
          </TabsTrigger>
          <TabsTrigger value="combinedTerm" className="rounded-lg font-bold text-xs sm:text-sm px-6 gap-2">
            <Award className="h-4 w-4" /> Combined Annual (1st + Final Term)
          </TabsTrigger>
        </TabsList>

        {/* Content for Both Tabs */}
        {(['singleTerm', 'combinedTerm'] as const).map((tabKey) => (
          <TabsContent key={tabKey} value={tabKey} className="space-y-4">
            <div className="bg-blue-50/50 dark:bg-white/5 border border-blue-100 dark:border-white/10 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 font-medium">
              💡 <strong>ہدایت:</strong> یہ ریمارکس بچے کے <strong>مجموعی رزلٹ</strong> (Overall Percentage، پوزیشن اور پاس/فیل) پر لاگو ہوتے ہیں۔ آپ کسی بھی کمنٹ کو اپنی مرضی کے مطابق اردو یا انگریزی میں تبدیل کر سکتے ہیں۔
            </div>

            <div className="grid grid-cols-1 gap-4">
              {CATEGORY_META.map((meta) => {
                const IconComponent = meta.icon;
                const currentVal = config[tabKey][meta.key] || '';
                return (
                  <Card key={meta.key} className="border border-slate-200 dark:border-white/10 shadow-sm rounded-xl overflow-hidden hover:border-primary-200 transition-colors">
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg border ${meta.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                              {meta.title}
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {meta.subtitle}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-mono text-[11px] font-bold self-start sm:self-auto ${meta.color}`}>
                          {meta.badge}
                        </Badge>
                      </div>

                      <div>
                        <Textarea 
                          rows={2}
                          value={currentVal}
                          onChange={(e) => handleUpdate(tabKey, meta.key, e.target.value)}
                          placeholder={`Enter custom comment for ${meta.title}...`}
                          className="font-medium text-xs leading-relaxed resize-y border-slate-200 dark:border-white/10 focus:ring-primary-500 rounded-lg"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button 
          onClick={handleSave} 
          disabled={submitting} 
          className="shadow-xl rounded-full h-12 px-8 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-extrabold tracking-wide"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Commit Changes
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  FilePlus, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2, 
  Calendar as CalendarIcon,
  Calculator,
  ArrowRight,
  Copy,
  Layers,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createExam, getExams } from '@/lib/supabase-service';
import { useExamStore } from '@/store/use-exam-store';
import { Exam } from '@/types';

const CATEGORIES = [
  { id: 'final-term', label: 'Final Term', defaultTitle: 'Final Term 2026' },
  { id: 'second-term', label: 'Second Term', defaultTitle: 'Second Term 2026' },
  { id: 'first-term', label: 'First Term', defaultTitle: 'First Term 2026' },
  { id: 'mid-term', label: 'Mid-Term Exam', defaultTitle: 'Mid-Term 2026' },
  { id: 'annual', label: 'Annual Examination', defaultTitle: 'Annual Exam 2026' },
  { id: 'monthly', label: 'Monthly Assessment', defaultTitle: 'Monthly Test 2026' },
];

function NewExamContent() {
  useSchoolSettings();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { schoolId } = useAuthStore();
  const { settings } = useSchoolStore();
  const { setActiveExamId } = useExamStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [existingExams, setExistingExams] = useState<Exam[]>([]);
  const [cloneFromExamId, setCloneFromExamId] = useState<string>('');
  const [autoCloneStructure, setAutoCloneStructure] = useState(true);

  const cloneParam = searchParams.get('cloneFrom');

  const [formData, setFormData] = useState({
    title: 'Second Term 2026',
    examTypeId: 'second-term',
    startDate: '',
    endDate: '',
    passPercentage: 33,
  });

  useEffect(() => {
    setMounted(true);
    async function loadExisting() {
      const examsList = await getExams();
      setExistingExams(examsList);
      if (cloneParam && examsList.some(e => e.id === cloneParam)) {
        setCloneFromExamId(cloneParam);
        setAutoCloneStructure(true);
        // Suggest next logical term if cloning from first-term
        const source = examsList.find(e => e.id === cloneParam);
        if (source?.examTypeId === 'first-term') {
          handleCategoryChange('second-term');
        }
      } else if (examsList.length > 0) {
        setCloneFromExamId(examsList[0].id);
      }
    }
    loadExisting();
  }, [cloneParam]);

  const handleCategoryChange = (val: string) => {
    const matched = CATEGORIES.find(c => c.id === val);
    const year = new Date().getFullYear();
    const suggestedTitle = matched ? matched.defaultTitle.replace(/\d{4}/, `${year}`) : 'Examination Cycle';
    
    setFormData(prev => ({
      ...prev,
      examTypeId: val,
      title: suggestedTitle
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (!formData.title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for the examination.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const examId = `exam_${Date.now()}`;
      const year = new Date().getFullYear();

      // Determine initial classes and classConfigs
      let initialClasses: string[] = settings.classes || [];
      let initialClassConfigs: Record<string, any> = {};

      if (autoCloneStructure) {
        const sourceExam = (cloneFromExamId ? existingExams.find(e => e.id === cloneFromExamId) : null)
          || existingExams.find(e => Object.keys(e.classConfigs || {}).length > 0);
        
        if (sourceExam) {
          initialClasses = sourceExam.classes && sourceExam.classes.length > 0 
            ? sourceExam.classes 
            : settings.classes || [];
          initialClassConfigs = JSON.parse(JSON.stringify(sourceExam.classConfigs || {}));
        }
      }

      // If no config cloned, prepare default subject structure for registered classes
      if (Object.keys(initialClassConfigs).length === 0 && settings.classes) {
        settings.classes.forEach(cls => {
          const classSubjects = (settings.subjects || []).filter(s => !s.appliesTo?.length || s.appliesTo.includes(cls));
          const subsObj: any = {};
          classSubjects.forEach((sub, idx) => {
            subsObj[sub.id] = {
              name: sub.name,
              maxMarks: 50,
              order: idx + 1,
              date: '',
              startTime: '09:00 AM',
              reportingTime: '08:30 AM'
            };
          });
          initialClassConfigs[cls] = { subjects: subsObj };
        });
      }

      const examPayload: Partial<Exam> = {
        id: examId,
        title: formData.title.trim(),
        examTypeId: formData.examTypeId,
        sessionId: settings.activeSession?.id || 'session_2026',
        year,
        classes: initialClasses,
        classConfigs: initialClassConfigs,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isLocked: false,
        passPercentage: formData.passPercentage,
        schoolId: schoolId || 'tss-main-school',
      };

      // 1. Primary Save to Supabase
      const created = await createExam(examPayload);
      if (!created) {
        throw new Error("Supabase exam insertion failed");
      }

      setActiveExamId(examId);

      toast({
        title: "Examination Created & Set as Active",
        description: `Successfully initialized ${formData.title.trim()} as current active term.`,
      });

      router.push(`/admin/exams/${examId}`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Creation Failed", description: "Could not create exam record." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 sm:px-0 mt-4 md:mt-6 font-inter">
      {/* Page Header */}
      <header className="flex items-center gap-3 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl h-9 w-9 bg-card border-border shadow-sm" 
          asChild
        >
          <Link href="/admin/exams">
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground font-outfit uppercase">
            Create Examination Cycle
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Define term title, assessment category, pass threshold, and curriculum setup.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
          <CardHeader className="bg-primary-600 p-5 md:p-6 text-white">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                <FilePlus className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-black font-outfit uppercase tracking-wide">
                  Cycle Parameters
                </CardTitle>
                <CardDescription className="text-white/80 font-bold uppercase text-[9px] tracking-widest mt-0.5">
                  Academic Session: {settings?.activeSession?.title || '2026'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 md:p-6 space-y-5">
            {/* Row 1: Title & Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">
                  Assessment Category
                </Label>
                <Select value={formData.examTypeId} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/40 border border-border font-bold text-xs text-foreground shadow-inner">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover text-popover-foreground border-border">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-bold text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">
                  Examination Title
                </Label>
                <Input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Final Term 2026"
                  className="h-10 rounded-xl bg-muted/40 border border-border px-3 font-bold text-xs text-foreground shadow-inner"
                />
              </div>
            </div>

            {/* Row 2: Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">
                  Start Date (Optional)
                </Label>
                <Input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="h-10 rounded-xl bg-muted/40 border border-border px-3 font-bold text-xs text-foreground shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">
                  End Date (Optional)
                </Label>
                <Input 
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="h-10 rounded-xl bg-muted/40 border border-border px-3 font-bold text-xs text-foreground shadow-inner"
                />
              </div>
            </div>

            {/* Row 3: Pass Percentage */}
            <div className="space-y-1.5 w-full sm:w-48">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">
                Pass Threshold (%)
              </Label>
              <Input 
                type="number"
                min={1}
                max={100}
                value={formData.passPercentage}
                onChange={e => setFormData({ ...formData, passPercentage: parseInt(e.target.value) || 33 })}
                className="h-10 rounded-xl bg-muted/40 border border-border px-3 font-bold text-xs text-foreground shadow-inner"
              />
            </div>

            {/* Structure Inheritance Helper */}
            {existingExams.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-bold text-foreground">
                        Inherit Curriculum Structure
                      </span>
                    </div>
                    <Switch 
                      checked={autoCloneStructure} 
                      onCheckedChange={setAutoCloneStructure} 
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically copy classes, subjects, and sequence ordering from an existing cycle so you do not have to configure them manually.
                  </p>
                  {autoCloneStructure && (
                    <div className="pt-1">
                      <Select value={cloneFromExamId} onValueChange={setCloneFromExamId}>
                        <SelectTrigger className="h-9 rounded-lg bg-card border border-border text-xs font-bold text-foreground">
                          <SelectValue placeholder="Select Source Assessment" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-popover text-popover-foreground border-border">
                          {existingExams.map(ex => (
                            <SelectItem key={ex.id} value={ex.id} className="font-bold text-xs">
                              Copy from: {ex.title} ({ex.classes?.length || 0} Classes)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button 
            variant="ghost" 
            className="rounded-xl h-10 px-5 font-bold text-xs text-muted-foreground hover:text-foreground" 
            asChild
          >
            <Link href="/admin/exams">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            className="rounded-xl h-10 px-6 bg-primary-600 hover:bg-primary-700 font-bold text-xs gap-2 shadow-sm text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Create & Configure
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewExamPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    }>
      <NewExamContent />
    </Suspense>
  );
}

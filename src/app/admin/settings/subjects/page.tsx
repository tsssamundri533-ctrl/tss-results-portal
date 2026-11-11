'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Loader2, 
  GraduationCap,
  Save,
  ChevronRight,
  Edit3,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { Subject } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { updateSchoolSettings, getSchoolSettings } from '@/lib/supabase-service';

export default function SubjectsSettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSchoolStore();

  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    selectedClasses: [] as string[]
  });

  useEffect(() => {
    setMounted(true);
    async function loadFresh() {
      try {
        const fresh = await getSchoolSettings();
        if (fresh) setSettings(fresh);
      } catch (err) {
        console.error('Failed to load fresh subjects:', err);
      }
    }
    loadFresh();
  }, [setSettings]);

  const subjects: Subject[] = settings?.subjects ? [...settings.subjects].sort((a, b) => a.name.localeCompare(b.name)) : [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', selectedClasses: [] });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      selectedClasses: subject.appliesTo || []
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.selectedClasses.length === 0) {
      toast({ title: "Validation Error", description: "Subject name and at least one class required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const subjectId = editingId || `sub_${Date.now()}`;
      const newSubject: Subject = {
        id: subjectId,
        name: formData.name,
        maxMarks: 100,
        isActive: true,
        appliesTo: formData.selectedClasses
      };

      const updatedSubjects = editingId 
        ? subjects.map(s => s.id === editingId ? newSubject : s)
        : [...subjects, newSubject];

      const ok = await updateSchoolSettings({ subjects: updatedSubjects });
      if (ok && settings) {
        setSettings({ ...settings, subjects: updatedSubjects });
      }
      
      toast({ 
        title: editingId ? "Subject Updated" : "Subject Registered", 
        description: `${formData.name} synchronized with institutional curriculum.` 
      });
      setIsDialogOpen(false);
      setFormData({ name: '', selectedClasses: [] });
      setEditingId(null);
    } catch (err) {
      toast({ title: "Failed to update subject", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`Permanently remove "${subject.name}" from institutional database? This cannot be undone.`)) return;
    
    try {
      const updatedSubjects = subjects.filter(s => s.id !== subject.id);
      const ok = await updateSchoolSettings({ subjects: updatedSubjects });
      if (ok && settings) {
        setSettings({ ...settings, subjects: updatedSubjects });
      }
      toast({ title: "Subject Deleted", description: `${subject.name} removed from registry.`, variant: "destructive" });
    } catch (e) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Curriculum Setup</h1>
          <p className="text-muted-foreground font-medium">Define subjects and map them to their respective grades.</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold">
          <Plus className="h-5 w-5" />
          Register Subject
        </Button>
      </header>

      <div className="grid gap-4 px-4 sm:px-0 md:grid-cols-2 lg:grid-cols-3">
        {subjects.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] bg-white dark:bg-card">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg font-outfit text-navy-900 dark:text-white">Curriculum Empty</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Initialize subjects for marks recording and report cards.</p>
            <Button onClick={handleOpenCreate} className="rounded-full bg-primary-600 text-white font-bold">
              Register First Subject
            </Button>
          </div>
        ) : (
          subjects.map((subject) => (
            <motion.div key={subject.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-none shadow-card rounded-3xl bg-white dark:bg-card p-6 flex flex-col justify-between hover:shadow-xl transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(subject)} className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subject)} className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg font-outfit text-navy-900 dark:text-white">{subject.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Active curriculum offering</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {subject.appliesTo?.map((cls, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-bold py-0.5 px-2 border-slate-200 dark:border-white/10">
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-modal dark:bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl">{editingId ? 'Edit Subject' : 'Register New Subject'}</DialogTitle>
            <DialogDescription>Define subject details and grades it applies to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input 
                placeholder="e.g. Mathematics, Urdu, Science" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label>Applicable Classes</Label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-2xl dark:border-white/5">
                {settings?.classes?.map((cls) => {
                  const isChecked = formData.selectedClasses.includes(cls);
                  return (
                    <label key={cls} className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
                      <Checkbox 
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, selectedClasses: [...formData.selectedClasses, cls] });
                          } else {
                            setFormData({ ...formData, selectedClasses: formData.selectedClasses.filter(c => c !== cls) });
                          }
                        }}
                      />
                      <span>{cls}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="rounded-full px-6 bg-primary-600 text-white font-bold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

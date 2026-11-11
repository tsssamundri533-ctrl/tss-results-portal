'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  School, 
  Plus, 
  Trash2, 
  Loader2, 
  Wand2, 
  AlertCircle,
  Layers, 
  X,
  Edit3,
  Save,
  CheckCircle2,
  FolderPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { updateSchoolSettings, getSchoolSettings } from '@/lib/supabase-service';

const STANDARD_CLASSES = [
  "Nursery", "K.G", "Class 1", "Class 2", "Class 3", 
  "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", 
  "Class 9", "Class 10"
];

export default function ClassesSettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSchoolStore();

  const [mounted, setMounted] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Edit State
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editSections, setEditSections] = useState<string[]>([]);
  const [newEditSectionName, setNewEditSectionName] = useState("");
  const sectionListEndRef = useRef<HTMLDivElement>(null);

  // Load fresh settings from Supabase on mount
  useEffect(() => {
    setMounted(true);
    async function loadFresh() {
      try {
        const fresh = await getSchoolSettings();
        if (fresh) {
          setSettings(fresh);
        }
      } catch (err) {
        console.error('Failed to refresh school settings:', err);
      }
    }
    loadFresh();
  }, [setSettings]);

  // Scroll to bottom of section list when a new section is added in the modal
  useEffect(() => {
    if (sectionListEndRef.current) {
      sectionListEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [editSections]);

  const handleAddClass = async () => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    
    setSubmitting(true);
    try {
      const currentClasses = settings?.classes || [];
      if (currentClasses.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        toast({ title: "Class already exists", description: `Grade ${trimmed} is already registered.`, variant: "destructive" });
        return;
      }

      const updatedClasses = [...currentClasses, trimmed];
      const updatedSections = { ...(settings?.classSections || {}), [trimmed]: ['A'] };
      
      const ok = await updateSchoolSettings({ 
        classes: updatedClasses,
        classSections: updatedSections
      });
      if (ok && settings) {
        setSettings({ ...settings, classes: updatedClasses, classSections: updatedSections });
      }
      
      toast({ title: "Class Added (کلاس شامل ہو گئی)", description: `${trimmed} initialized with default Section A.` });
      setNewClassName("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (cls: string) => {
    setEditingClass(cls);
    setEditClassName(cls);
    setEditSections(settings?.classSections?.[cls] || ['A']);
    setNewEditSectionName("");
  };

  const handleSaveEdit = async () => {
    if (!editingClass || !editClassName) return;

    if (editSections.length === 0) {
      toast({ 
        title: "Validation Error", 
        description: "At least one section (e.g., 'BOYS 1', 'GIRLS 1') is required.", 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    try {
      let updatedClasses = [...(settings?.classes || [])];
      let updatedSections = { ...(settings?.classSections || {}) };

      // Handle Class Renaming Logic
      if (editClassName !== editingClass) {
        if (updatedClasses.includes(editClassName)) {
          toast({ title: "Class name already exists", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        updatedClasses = updatedClasses.map(c => c === editingClass ? editClassName : c);
        delete updatedSections[editingClass];
      }

      // Commit the specific section array for this class
      updatedSections[editClassName] = editSections;

      const ok = await updateSchoolSettings({ 
        classes: updatedClasses,
        classSections: updatedSections
      });
      if (ok && settings) {
        setSettings({ ...settings, classes: updatedClasses, classSections: updatedSections });
      }

      toast({ 
        title: "Class & Sections Saved (سیکشنز محفوظ ہو گئے)", 
        description: `${editClassName} sections updated: [${editSections.join(', ')}]` 
      });
      setEditingClass(null);
    } finally {
      setSubmitting(false);
    }
  };

  const addSectionToEdit = () => {
    const trimmed = newEditSectionName.trim().toUpperCase();
    if (!trimmed) return;
    
    if (editSections.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Section already exists", description: `Section "${trimmed}" is already in this list.`, variant: "destructive" });
      return;
    }
    
    setEditSections([...editSections, trimmed]);
    setNewEditSectionName("");
    toast({ 
      title: `Added "${trimmed}" to list`, 
      description: "Click 'Save & Commit Changes' below to finalize." 
    });
  };

  const removeSectionFromEdit = (sec: string) => {
    setEditSections(editSections.filter(s => s !== sec));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      const updatedClasses = (settings?.classes || []).filter(c => c !== deleteTarget);
      const updatedSections = { ...(settings?.classSections || {}) };
      delete updatedSections[deleteTarget];

      const ok = await updateSchoolSettings({ 
        classes: updatedClasses,
        classSections: updatedSections
      });
      if (ok && settings) {
        setSettings({ ...settings, classes: updatedClasses, classSections: updatedSections });
      }

      toast({ title: "Class Permanently Removed", variant: "destructive" });
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAdd = async () => {
    setSubmitting(true);
    try {
      const currentClasses = settings?.classes || [];
      const newOnes = STANDARD_CLASSES.filter(c => !currentClasses.includes(c));
      
      if (newOnes.length === 0) {
        toast({ title: "All standards already exist" });
        return;
      }

      const updatedClasses = [...currentClasses, ...newOnes];
      const updatedSections = { ...(settings?.classSections || {}) };
      newOnes.forEach(c => {
        if (!updatedSections[c]) updatedSections[c] = ['A'];
      });

      const ok = await updateSchoolSettings({ 
        classes: updatedClasses,
        classSections: updatedSections
      });
      if (ok && settings) {
        setSettings({ ...settings, classes: updatedClasses, classSections: updatedSections });
      }
      toast({ title: "Bulk Classes Imported", description: `Added ${newOnes.length} grades to registry.` });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Classes & Sections Management</h1>
          <p className="text-muted-foreground font-medium text-sm">Define and manage academic grades and their respective student sections.</p>
        </div>
        <Button 
          variant="outline"
          className="rounded-full border-2 gap-2 h-11 px-6 font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:text-white dark:border-white/10 transition-all"
          onClick={handleBulkAdd}
          disabled={submitting}
        >
          <Wand2 className="h-4 w-4" />
          Quick Add Standards
        </Button>
      </header>

      {/* NEW CLASS ADDITION BAR */}
      <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
        <CardHeader className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
             <div className="space-y-1">
               <CardTitle className="text-xl dark:text-white flex items-center gap-2">
                 <School className="h-5 w-5 text-primary-600" />
                 <span>Add New Class (نئی کلاس شامل کریں)</span>
               </CardTitle>
               <CardDescription className="dark:text-slate-400">
                 Enter grade name (e.g. Class 11). To add sections to an existing class, click <b>Manage Sections</b> on the card below.
               </CardDescription>
             </div>
             <div className="flex gap-2">
               <Input 
                 placeholder="e.g. Class 11" 
                 className="h-12 w-48 sm:w-64 rounded-xl bg-white dark:bg-navy-950 border-none px-5 font-bold dark:text-white shadow-sm ring-1 ring-slate-100 dark:ring-white/5"
                 value={newClassName}
                 onChange={e => setNewClassName(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleAddClass()}
               />
               <Button onClick={handleAddClass} disabled={submitting || !newClassName.trim()} className="rounded-xl h-12 px-6 bg-primary-600 hover:bg-primary-700 font-bold shadow-lg text-white gap-2">
                 {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                 <span className="hidden sm:inline">Add Class</span>
               </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             <AnimatePresence mode="popLayout">
                {settings?.classes?.map((cls, idx) => {
                  const sections = settings.classSections?.[cls] || ['A'];
                  return (
                    <motion.div
                      key={cls}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group p-6 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-navy-950/50 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all flex flex-col gap-5 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-xs">
                               {idx + 1}
                            </div>
                            <h3 className="font-black text-navy-900 dark:text-white text-lg font-outfit uppercase truncate max-w-[140px]">{cls}</h3>
                         </div>
                         <div className="flex items-center gap-1">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             title="Delete Class"
                             className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 w-8 rounded-full"
                             onClick={() => setDeleteTarget(cls)}
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Sections ({sections.length})</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(cls)}
                              className="h-7 px-2.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-[10px] font-bold gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              Manage / Add
                            </Button>
                         </div>
                         <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                            {sections.map(sec => (
                              <Badge 
                                key={sec} 
                                className="bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-bold text-[11px] uppercase h-7 px-3 rounded-lg shadow-2xs"
                              >
                                {sec}
                              </Badge>
                            ))}
                         </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => handleOpenEdit(cls)}
                        className="w-full mt-auto h-10 rounded-xl border-dashed border-primary-200 dark:border-primary-800/50 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-bold text-xs gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add / Edit Sections</span>
                      </Button>
                    </motion.div>
                  );
                })}
             </AnimatePresence>
          </div>
          {(!settings?.classes || settings.classes.length === 0) && (
            <div className="py-24 text-center space-y-4">
              <School className="h-20 w-20 text-slate-100 dark:text-slate-800 mx-auto opacity-50" />
              <div className="space-y-1">
                 <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-sm tracking-widest">No classes configured</p>
                 <p className="text-slate-400 dark:text-slate-600 text-xs">Add a class above to begin organizing your students.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Class & Sections Editor Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent className="max-w-lg rounded-[2.5rem] border-none shadow-modal dark:bg-card p-0 overflow-hidden">
          <div className="bg-primary-600 p-8 text-white">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black font-outfit text-white">Manage Sections — {editingClass}</DialogTitle>
               <DialogDescription className="text-white/80 font-medium text-xs">
                 Add, rename or remove sections for <span className="font-black text-white uppercase">{editingClass}</span>.
               </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Grade Class Name</Label>
                <Input 
                  placeholder="e.g. Class 3" 
                  className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none px-5 font-bold dark:text-white ring-1 ring-slate-100 dark:ring-white/5"
                  value={editClassName}
                  onChange={e => setEditClassName(e.target.value)}
                />
             </div>

             <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                   <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                     Add New Section (e.g. GIRLS 2, BOYS 2)
                   </Label>
                   <span className="text-[10px] text-slate-400 font-bold">{editSections.length} Sections Configured</span>
                </div>
                
                <div className="flex gap-2">
                   <Input 
                     placeholder="Type section name (e.g. GIRLS 2)..." 
                     className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none px-5 font-bold dark:text-white text-sm ring-1 ring-slate-100 dark:ring-white/5 uppercase"
                     value={newEditSectionName}
                     onChange={e => setNewEditSectionName(e.target.value)}
                     onKeyDown={e => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         addSectionToEdit();
                       }
                     }}
                   />
                   <Button 
                     onClick={addSectionToEdit} 
                     disabled={!newEditSectionName.trim()} 
                     className="h-12 px-5 rounded-2xl bg-navy-900 hover:bg-navy-800 dark:bg-primary-600 font-bold text-white shadow-lg shrink-0 gap-1.5"
                   >
                      <Plus className="h-5 w-5" />
                      <span>Add</span>
                   </Button>
                </div>

                {/* Section List with auto-scroll */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar border rounded-2xl p-2 bg-slate-50/50 dark:bg-white/5">
                   <AnimatePresence mode="popLayout">
                    {editSections.map((sec, idx) => (
                      <motion.div 
                        key={sec} 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-white dark:bg-navy-900 rounded-xl flex items-center justify-between border border-slate-100 dark:border-white/5 shadow-2xs"
                      >
                         <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 font-black text-xs">
                               {idx + 1}
                            </div>
                            <span className="font-black text-sm uppercase text-navy-900 dark:text-white tracking-wide">{sec}</span>
                         </div>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full"
                           onClick={() => removeSectionFromEdit(sec)}
                           title={`Remove ${sec}`}
                         >
                            <X className="h-4 w-4" />
                         </Button>
                      </motion.div>
                    ))}
                   </AnimatePresence>
                   <div ref={sectionListEndRef} />
                   {editSections.length === 0 && (
                     <div className="py-8 text-center text-slate-400 italic text-xs font-medium">
                        No sections defined yet. Type a name above and click "Add".
                     </div>
                   )}
                </div>
             </div>

             <DialogFooter className="flex-col gap-2 sm:flex-col pt-4 border-t dark:border-white/5">
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={submitting || editSections.length === 0} 
                  className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 font-black uppercase tracking-widest text-xs text-white shadow-xl gap-2 transition-all active:scale-95"
                >
                   {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                   Save & Commit Changes (محفوظ کریں)
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setEditingClass(null)} 
                  className="w-full h-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-transparent"
                >
                  Cancel / بند کریں
                </Button>
             </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-modal dark:bg-card p-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
               <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-black font-outfit text-navy-900 dark:text-white uppercase">Archive Grade?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                Are you absolutely sure you want to delete <span className="font-black text-rose-600 dark:text-rose-400">{deleteTarget}</span>? 
                This action is permanent and will purge all associated section mappings from the institutional registry.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="mt-10 gap-3 justify-center">
            <AlertDialogCancel className="rounded-2xl h-14 px-10 font-bold border-2 dark:border-white/10 dark:text-white bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="rounded-2xl h-14 px-10 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-900/20"
            >
              Purge from Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

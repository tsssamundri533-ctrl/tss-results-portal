'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Loader2, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  UserCheck,
  Layers 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { Assignment, UserProfile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getStaff, getStaffAssignments, upsertStaffAssignment, deleteStaffAssignment } from '@/lib/supabase-service';

export default function AssignmentsPage() {
  const { toast } = useToast();
  const { settings } = useSchoolStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [newAssignment, setNewAssignment] = useState({
    teacherId: '',
    className: '',
    sectionName: '',
    subjectId: '',
  });

  const loadData = async () => {
    try {
      setDataLoading(true);
      const [tList, aList] = await Promise.all([
        getStaff('teacher'),
        getStaffAssignments()
      ]);
      setTeachers(tList);
      setAssignments(aList);
    } catch (err) {
      console.error('Failed to load assignments or teachers:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableSections = settings?.classSections?.[newAssignment.className] || ['A'];

  const handleAssign = async () => {
    if (!newAssignment.teacherId || !newAssignment.className || !newAssignment.sectionName || !newAssignment.subjectId) {
      toast({ title: "Validation Error", description: "All parameters required for mapping.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const teacher = teachers.find(t => t.uid === newAssignment.teacherId);
      const subject = settings?.subjects?.find(s => s.id === newAssignment.subjectId);
      
      const assignmentId = `${newAssignment.teacherId}_${newAssignment.className}_${newAssignment.sectionName}_${newAssignment.subjectId}`.replace(/\s+/g, '_');
      
      const assignmentData: Assignment = {
        id: assignmentId,
        teacherId: newAssignment.teacherId,
        teacherName: teacher?.name || 'Unknown',
        className: newAssignment.className,
        sectionName: newAssignment.sectionName,
        subject: subject?.name || 'Unknown',
        subjectName: subject?.name || 'Unknown',
        subjectId: newAssignment.subjectId,
        sessionId: settings?.activeSession?.id || 'default',
        createdAt: new Date().toISOString()
      };

      const ok = await upsertStaffAssignment(assignmentData);
      if (!ok) throw new Error("Save failed");

      toast({ title: "Assignment Committed", description: `${teacher?.name} authorized for Grade ${newAssignment.className}-${newAssignment.sectionName}.` });
      setIsAddOpen(false);
      setNewAssignment({ teacherId: '', className: '', sectionName: '', subjectId: '' });
      await loadData();
    } catch (e) {
      toast({ title: "Assignment Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Assignment) => {
    if (!window.confirm(`Revoke authority for ${item.teacherName} in ${item.className}-${item.sectionName}?`)) return;
    try {
      const ok = await deleteStaffAssignment(item.id);
      if (ok) {
        setAssignments(prev => prev.filter(a => a.id !== item.id));
        toast({ title: "Authority Revoked", variant: "destructive" });
      } else {
        throw new Error("Delete failed");
      }
    } catch (e) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Staff Utilization</h1>
          <p className="text-muted-foreground font-medium">Link teachers to specific sections and curriculum components.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold">
              <Plus className="h-5 w-5" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-modal dark:bg-card max-w-md">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl">Faculty Allocation Matrix</DialogTitle>
              <DialogDescription>Authorize instructor permissions for academic evaluation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Teacher</Label>
                <Select value={newAssignment.teacherId} onValueChange={v => setNewAssignment(prev => ({ ...prev, teacherId: v }))}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.uid} value={t.uid}>{t.name} ({t.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade/Class</Label>
                  <Select value={newAssignment.className} onValueChange={v => setNewAssignment(prev => ({ ...prev, className: v, sectionName: '' }))}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings?.classes?.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select 
                    disabled={!newAssignment.className} 
                    value={newAssignment.sectionName} 
                    onValueChange={v => setNewAssignment(prev => ({ ...prev, sectionName: v }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject Portfolio</Label>
                <Select value={newAssignment.subjectId} onValueChange={v => setNewAssignment(prev => ({ ...prev, subjectId: v }))}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Curriculum subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings?.subjects?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-full">Cancel</Button>
              <Button onClick={handleAssign} disabled={submitting} className="rounded-full px-6 bg-primary-600 text-white font-bold">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Commit Authority
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 px-4 sm:px-0 md:grid-cols-2 lg:grid-cols-3">
        {dataLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none shadow-card rounded-3xl h-36 animate-pulse bg-white dark:bg-card" />
          ))
        ) : assignments.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] bg-white dark:bg-card">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg font-outfit text-navy-900 dark:text-white">No Active Delegations</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Authorize teachers to log evaluations and track progress.</p>
            <Button onClick={() => setIsAddOpen(true)} className="rounded-full bg-primary-600 text-white font-bold">
              Create First Delegation
            </Button>
          </div>
        ) : (
          assignments.map(item => (
            <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-none shadow-card rounded-3xl bg-white dark:bg-card hover:shadow-xl transition-all p-6 relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-primary-600 tracking-wider">
                      Grade {item.className} - {item.sectionName}
                    </span>
                    <h3 className="font-bold text-lg text-navy-900 dark:text-white font-outfit">{item.subject || item.subjectName}</h3>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 pt-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {item.teacherName}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(item)} 
                    className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

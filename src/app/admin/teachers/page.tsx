'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Loader2, 
  GraduationCap, 
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { getStaff, deleteStaff, getStaffAssignments } from '@/lib/supabase-service';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, Assignment } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeachersDirectoryPage() {
  const { toast } = useToast();
  const { schoolId } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all staff members & assignments from Supabase
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [staffData, assignmentsData] = await Promise.all([
          getStaff('teacher'),
          getStaffAssignments()
        ]);
        if (active) {
          setTeachers(staffData);
          setAllAssignments(assignmentsData);
        }
      } catch (err) {
        console.error("Staff load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers
      .filter(t => 
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [teachers, searchTerm]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteStaff(deleteTarget.uid);
      setTeachers(prev => prev.filter(t => t.uid !== deleteTarget.uid));
      toast({
        title: "Staff Deleted",
        description: `${deleteTarget.name} has been permanently removed.`,
        variant: "destructive"
      });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Delete Failed",
        variant: "destructive"
      });
    }
  };

  // Optimized Loading: Persistent Data View
  const initialLoad = loading && teachers.length === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0 mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Teaching Staff</h1>
          <p className="text-muted-foreground font-medium">Manage academic personnel and attendance authority.</p>
        </div>
        <Button className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold" asChild>
          <Link href="/admin/teachers/new">
            <UserPlus className="h-5 w-5" />
            Onboard Teacher
          </Link>
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            placeholder="Search by name or email..." 
            className="w-full pl-11 h-12 border-none bg-white dark:bg-card dark:text-white rounded-2xl text-base shadow-card focus:ring-2 ring-primary-600/20 outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 px-4 sm:px-0 sm:grid-cols-2 lg:grid-cols-3">
        {initialLoad ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-none shadow-card rounded-[2rem] h-64 animate-pulse bg-white dark:bg-card" />
          ))
        ) : filteredTeachers.length === 0 && !initialLoad ? (
          <div className="col-span-full py-24 text-center bg-white dark:bg-card rounded-[2rem] shadow-sm border border-dashed border-slate-100 dark:border-white/5">
            <div className="h-20 w-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-slate-200 dark:text-slate-800" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-bold font-outfit uppercase text-xs tracking-widest">No staff records found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTeachers.map((teacher, idx) => {
              const teacherAssignments = allAssignments?.filter(a => a.teacherId === teacher.uid) || [];
              const uniqueClasses = Array.from(new Set(teacherAssignments.map(a => a.className)));

              return (
                <motion.div
                  key={teacher.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-none shadow-card rounded-[2rem] overflow-hidden group hover:shadow-hover-shadow transition-all duration-300 bg-white dark:bg-card">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start">
                        <div className="h-16 w-16 rounded-[1.25rem] bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-black border border-primary-100 dark:border-white/5 group-hover:scale-110 transition-transform shadow-inner overflow-hidden text-center uppercase">
                          {teacher.photoURL ? (
                            <img src={teacher.photoURL} className="w-full h-full object-cover" alt="" />
                          ) : (teacher.name?.[0] || 'T')}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full -mr-2 text-slate-300 hover:text-navy-900 dark:hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-100 dark:border-white/5 shadow-modal-shadow w-56 dark:bg-card">
                            <DropdownMenuItem asChild className="cursor-pointer font-bold gap-2 dark:text-white">
                              <Link href={`/admin/teachers/${teacher.uid}/edit`}>
                                <Edit3 className="h-4 w-4 text-slate-400" /> Edit Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer font-bold gap-2 dark:text-white">
                              <Link href="/admin/assignments">
                                <GraduationCap className="h-4 w-4 text-slate-400" /> Manage Assignments
                              </Link>
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                            <DropdownMenuItem 
                              className="text-rose-600 font-bold focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer gap-2"
                              onSelect={() => setDeleteTarget(teacher)}
                            >
                              <Trash2 className="h-4 w-4" /> Permanently Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="font-bold text-xl text-navy-900 dark:text-white leading-tight font-outfit truncate">{teacher.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge className="bg-primary-600/10 text-primary-600 dark:text-primary-400 border-none font-black text-[9px] uppercase px-2 h-4">
                             Teacher
                           </Badge>
                           <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                              <ShieldCheck className="h-3 w-3" /> 
                              Verified Staff
                           </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                           {uniqueClasses.slice(0, 2).map(cls => (
                             <Badge key={cls} variant="outline" className="rounded-lg border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase px-2 py-0.5">
                               Grade {cls}
                             </Badge>
                           ))}
                           {uniqueClasses.length > 2 && (
                             <span className="text-[9px] font-bold text-slate-300 dark:text-slate-700">+{uniqueClasses.length - 2} more</span>
                           )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 tracking-tighter">Workload</span>
                              <span className="text-xs font-bold text-navy-900 dark:text-white">{teacherAssignments.length} Assignments</span>
                           </div>
                           <Button variant="ghost" size="sm" className="h-8 rounded-xl font-bold text-[10px] uppercase text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 gap-1 pr-1" asChild>
                              <Link href="/admin/assignments">
                                Details <ArrowRight className="h-3 w-3" />
                              </Link>
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-navy-900 dark:text-white">Confirm Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Are you absolutely sure you want to delete <strong>{deleteTarget?.name}</strong>? This action will permanently remove their profile and revoke all institutional access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-100 dark:border-white/10 dark:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              onClick={() => {
                handleDelete();
              }}
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

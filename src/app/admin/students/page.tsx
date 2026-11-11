
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Loader2, 
  Filter, 
  QrCode, 
  User,
  Plus,
  MoreVertical,
  Edit3,
  Layers,
  ChevronRight,
  ArrowRight,
  Trash2,
  ImageIcon,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Zap,
  RefreshCw,
  ShieldAlert,
  X,
  Printer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { getStudents, deleteStudent, upsertStudent } from '@/lib/supabase-service';
import { useCacheStore } from '@/store/use-cache-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Student } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { generateStudentDirectoryHtml } from '@/lib/print/student-directory';

const MALE_AVATAR = "https://i.postimg.cc/x1BZ31bs/male.png";
const FEMALE_AVATAR = "https://i.postimg.cc/7hgPwR8W/1487318.png";

export default function StudentsManagementPage() {
  const { schoolId } = useAuthStore();
  const { settings } = useSchoolStore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isQRPortalOpen, setIsQRPortalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  // Bulk Import States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Directory State
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [supabaseStudents, setSupabaseStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachePath = `schools/${schoolId || 'tss-main-school'}/students`;
        const cached = useCacheStore.getState().collections[cachePath];
        if (Array.isArray(cached) && cached.length > 0) return cached;
      } catch (e) {}
    }
    return [];
  });
  const [supabaseLoading, setSupabaseLoading] = useState(() => supabaseStudents.length === 0);

  // Pagination states (25 per page by default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Direct Supabase Student Synchronization & Flash Cache Warming
  useEffect(() => {
    let active = true;

    async function loadFromSupabase() {
      try {
        const data = await getStudents();
        if (active && data && data.length > 0) {
          setSupabaseStudents(data);
          const cachePath = `schools/${schoolId || 'tss-main-school'}/students`;
          useCacheStore.getState().setCollectionCache(cachePath, data);
        }
      } catch (err) {
        console.warn("Supabase students load warning:", err);
      } finally {
        if (active) setSupabaseLoading(false);
      }
    }

    loadFromSupabase();

    return () => {
      active = false;
    };
  }, [schoolId]);

  // Pure Supabase student resolution
  const resolvedStudents = supabaseStudents;

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass, filterSection]);

  const filterAvailableSections = useMemo(() => {
    if (filterClass === 'all' || !settings?.classSections) return [];
    return settings.classSections[filterClass] || [];
  }, [filterClass, settings?.classSections]);

  const processedStudents = useMemo(() => {
    if (!resolvedStudents) return [];
    return resolvedStudents
      .filter(s => {
        const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.rollNumber || '').includes(searchTerm);
        const matchesClass = filterClass === "all" || s.class === filterClass;
        const matchesSection = filterSection === "all" || s.section === filterSection;
        return matchesSearch && matchesClass && matchesSection;
      })
      .sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [resolvedStudents, searchTerm, filterClass, filterSection]);

  const totalPages = Math.max(1, Math.ceil(processedStudents.length / (pageSize === -1 ? processedStudents.length || 1 : pageSize)));

  const paginatedStudents = useMemo(() => {
    if (pageSize === -1) return processedStudents;
    const start = (currentPage - 1) * pageSize;
    return processedStudents.slice(start, start + pageSize);
  }, [processedStudents, currentPage, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      // 1. Purge from Supabase
      await deleteStudent(deleteTarget.id);

      // 2. Purge from Local State & Cache
      setSupabaseStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
      const cachePath = `schools/${schoolId || 'tss-main-school'}/students`;
      const currentList = useCacheStore.getState().collections[cachePath] || [];
      useCacheStore.getState().setCollectionCache(cachePath, currentList.filter((s: any) => s.id !== deleteTarget.id));

      toast({
        title: "Enrollment Purged",
        description: `${deleteTarget.name} has been permanently removed from the registry.`,
        variant: "destructive"
      });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Deletion Failed",
        variant: "destructive"
      });
    }
  };

  /**
   * Generates and launches the Printable Student Verification Directory.
   */
  const handlePrintDirectory = async (mode: 'all' | 'filtered' = 'all') => {
    if (!settings) {
      toast({
        title: "Settings Loading",
        description: "Please wait until school settings are fully synchronized.",
        variant: "destructive"
      });
      return;
    }

    const isFilteredMode = mode === 'filtered' && (filterClass !== 'all' || filterSection !== 'all' || searchTerm.trim().length > 0);
    const targetStudents = isFilteredMode ? processedStudents : resolvedStudents;

    if (!targetStudents || targetStudents.length === 0) {
      toast({
        title: "No Students Found",
        description: "There are no student records available to print.",
        variant: "destructive"
      });
      return;
    }

    setIsPrinting(true);
    try {
      const html = await generateStudentDirectoryHtml(
        targetStudents,
        settings,
        isFilteredMode
          ? {
              className: filterClass,
              sectionName: filterSection,
              searchTerm
            }
          : {
              className: 'all',
              sectionName: 'all'
            }
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        toast({
          title: "Pop-up Blocked",
          description: "Please allow pop-ups for this site to view the printable directory.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Print Directory Error:", error);
      toast({
        title: "Print Failed",
        description: "An unexpected error occurred while generating the directory printout.",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Generates and downloads the institutional Excel template.
   */
  const downloadTemplate = () => {
    const headers = [
      ["Candidate Name", "Father Name", "Gender", "Grade", "Section", "Roll Number", "Zone"],
      ["Ali Khan", "Ahmed Khan", "male", "Class 5", "A", "", "Corridor A"],
      ["Sara Ahmed", "Ahmed Raza", "female", "Class 6", "B", "", "Corridor B"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Student Template");
    XLSX.writeFile(wb, `TSSS_Student_Import_Template.xlsx`);
  };

  /**
   * Processes the Excel file and bulk imports students directly into Supabase.
   */
  const handleBulkImport = async () => {
    if (!importFile || !schoolId || !settings) return;

    setImporting(true);
    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({ title: "Template Empty", description: "No student records found in sheet.", variant: "destructive" });
        setImporting(false);
        return;
      }

      // Calculate sequential roll numbers starting after the highest existing roll
      let maxExistingRoll = settings.profile?.startingRollNumber || 1000;
      supabaseStudents.forEach(s => {
        const val = parseInt(s.rollNumber, 10);
        if (!isNaN(val) && val > maxExistingRoll) {
          maxExistingRoll = val;
        }
      });
      const startRoll = maxExistingRoll + 1;
      let autoCount = 0;
      const studentsToCreate: Student[] = [];

      jsonData.forEach((row: any) => {
        const name = row["Candidate Name"] || row["name"];
        if (!name) return;

        const fatherName = row["Father Name"] || row["fatherName"] || "—";
        const genderRaw = (row["Gender"] || row["gender"] || "male").toLowerCase();
        const gender = (genderRaw === 'female' || genderRaw === 'f') ? 'female' : 'male';
        const className = row["Grade"] || row["class"] || settings.classes[0];
        const section = row["Section"] || row["section"] || "A";
        const corridor = row["Zone"] || row["corridor"] || "Corridor A";
        
        let rollNumberRaw = row["Roll Number"] || row["rollNumber"];
        let finalizedRoll: string;

        if (!rollNumberRaw) {
          finalizedRoll = (startRoll + autoCount).toString();
          autoCount++;
        } else {
          finalizedRoll = rollNumberRaw.toString();
        }

        const studentId = `student_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const studentData: Student = {
          id: studentId,
          name,
          fatherName,
          gender: gender as Student['gender'],
          class: className,
          section,
          rollNumber: finalizedRoll,
          corridor: corridor as Student['corridor'],
          schoolId,
          qrToken: Math.random().toString(36).substring(2, 15),
          status: 'active' as Student['status'],
          sessionId: settings.activeSession?.id || 'default',
        };

        studentsToCreate.push(studentData);
      });

      // Save directly to Supabase in batches
      await Promise.all(studentsToCreate.map(s => upsertStudent(s)));

      // Update state and cache
      setSupabaseStudents(prev => [...prev, ...studentsToCreate]);
      const cachePath = `schools/${schoolId || 'tss-main-school'}/students`;
      useCacheStore.getState().setCollectionCache(cachePath, [...supabaseStudents, ...studentsToCreate]);

      toast({ title: "Import Successful", description: `Synchronized ${studentsToCreate.length} candidates directly into Supabase.` });
      setIsImportOpen(false);
      setImportFile(null);
    } catch (e) {
      console.error("Bulk Import error:", e);
      toast({ title: "Import Error", description: "A registry synchronization conflict occurred. Please try again.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (!mounted) return null;

  const initialLoad = supabaseLoading && supabaseStudents.length === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit uppercase">Student Registry</h2>
          <p className="text-muted-foreground font-medium text-sm">Real-time enrollment with hierarchical group mapping.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="rounded-full gap-2 h-11 px-5 font-bold border-2 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm transition-all"
                disabled={isPrinting || resolvedStudents.length === 0}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                ) : (
                  <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
                <span>Print Directory</span>
                <ChevronRight className="h-3.5 w-3.5 rotate-90 text-indigo-400 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl dark:bg-card dark:border-white/10 w-72 p-2 shadow-2xl">
              <DropdownMenuItem 
                className="rounded-xl py-3 px-3 font-bold cursor-pointer flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                onClick={() => handlePrintDirectory('all')}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-navy-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Whole School (All Classes)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">Master verification list with photos</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {resolvedStudents.length}
                </Badge>
              </DropdownMenuItem>

              {(filterClass !== 'all' || filterSection !== 'all' || searchTerm.trim().length > 0) && (
                <>
                  <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                  <DropdownMenuItem 
                    className="rounded-xl py-3 px-3 font-bold cursor-pointer flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    onClick={() => handlePrintDirectory('filtered')}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-navy-900 dark:text-white flex items-center gap-2">
                        <Filter className="h-4 w-4 text-emerald-600" />
                        Current Filter Selection
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {filterClass !== 'all' ? filterClass : 'Search result'} {filterSection !== 'all' ? `(Sec ${filterSection})` : ''}
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {processedStudents.length}
                    </Badge>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            className="rounded-full gap-2 h-11 px-5 font-bold border-2 dark:border-white/10 dark:text-white"
            onClick={() => setIsImportOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Bulk Import
          </Button>
          <Button className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold" asChild>
            <Link href="/admin/students/new">
              <Plus className="h-5 w-5" />
              Manual Enrollment
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search candidate by name or roll..." 
            className="pl-11 h-12 border-none bg-white dark:bg-card dark:text-white rounded-2xl text-base shadow-sm font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex gap-3">
          <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setFilterSection('all'); }}>
            <SelectTrigger className="w-40 sm:w-[180px] h-12 border-none bg-white dark:bg-card dark:text-white rounded-2xl font-bold shadow-sm">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="dark:bg-card dark:border-white/5">
              <SelectItem value="all">All Classes</SelectItem>
              {settings?.classes?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select 
            key={`filter-section-${filterClass}`}
            value={filterSection} 
            onValueChange={setFilterSection} 
            disabled={filterClass === 'all'}
          >
            <SelectTrigger className="w-40 sm:w-[160px] h-12 border-none bg-white dark:bg-card dark:text-white rounded-2xl font-bold shadow-sm">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent className="dark:bg-card dark:border-white/5">
              <SelectItem value="all">All Sections</SelectItem>
              {filterAvailableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl border-none bg-white dark:bg-card dark:text-white shadow-sm hover:text-indigo-600 transition-colors shrink-0"
            title={filterClass === 'all' ? "Print Whole School Directory" : `Print ${filterClass} Directory`}
            onClick={() => handlePrintDirectory(filterClass === 'all' ? 'all' : 'filtered')}
            disabled={isPrinting || (filterClass === 'all' ? resolvedStudents.length === 0 : processedStudents.length === 0)}
          >
            {isPrinting ? <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> : <Printer className="h-5 w-5 text-indigo-600" />}
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-card overflow-hidden rounded-3xl bg-white dark:bg-card">
        <CardContent className="p-0">
          {initialLoad ? (
            <div className="py-24 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
              <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Opening Registry Ledger...</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {paginatedStudents.map((student, idx) => (
                  <motion.div 
                    key={student.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }} 
                    transition={{ delay: idx * 0.01 }}
                    className="group flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-navy-950 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5 shadow-inner">
                        <img src={student.photoURL || (student.gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR)} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-navy-900 dark:text-white text-base leading-none">{student.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 uppercase tracking-tighter">S/O {student.fatherName}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                           <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-none h-4 px-1.5">{student.class}</Badge>
                           <Badge variant="outline" className="text-[8px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-none h-4 px-1.5">Sec {student.section}</Badge>
                           <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">Roll: {student.rollNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-primary-600 transition-colors" onClick={() => { setSelectedStudent(student); setIsQRPortalOpen(true); }}><QrCode className="h-4 w-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-navy-900 dark:hover:text-white"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl dark:bg-card dark:border-white/10 w-56 shadow-xl">
                          <DropdownMenuItem asChild className="font-bold gap-2 dark:text-white cursor-pointer py-2.5">
                            <Link href={`/admin/students/${student.id}/edit`}><Edit3 className="h-4 w-4 text-slate-400" /> Edit Profile</Link>
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                          <DropdownMenuItem 
                            className="font-bold gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer py-2.5"
                            onSelect={() => setDeleteTarget(student)}
                          >
                            <Trash2 className="h-4 w-4" /> Permanently Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {processedStudents.length === 0 && !initialLoad && (
                <div className="py-24 text-center">
                   <Users className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                   <p className="text-slate-400 uppercase font-black text-xs tracking-widest">No matching students found</p>
                </div>
              )}
            </div>
          )}

          {/* Modern Pagination Controls */}
          {processedStudents.length > 0 && !initialLoad && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-navy-950/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Showing</span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {pageSize === -1 ? 1 : Math.min((currentPage - 1) * pageSize + 1, processedStudents.length)} - {pageSize === -1 ? processedStudents.length : Math.min(currentPage * pageSize, processedStudents.length)}
                </span>
                <span>of</span>
                <span className="font-bold text-navy-900 dark:text-white">{processedStudents.length}</span>
                <span>Students</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Rows:</span>
                  <Select 
                    value={String(pageSize)} 
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-20 text-xs font-bold rounded-lg bg-white dark:bg-card border-slate-200 dark:border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-card dark:border-white/10">
                      <SelectItem value="25" className="text-xs font-bold">25</SelectItem>
                      <SelectItem value="50" className="text-xs font-bold">50</SelectItem>
                      <SelectItem value="100" className="text-xs font-bold">100</SelectItem>
                      <SelectItem value="-1" className="text-xs font-bold">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pageSize !== -1 && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-white/10 font-bold text-xs bg-white dark:bg-card dark:text-white"
                    >
                      Prev
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-1 text-muted-foreground text-xs font-bold">...</span>}
                            <Button
                              variant={currentPage === p ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setCurrentPage(p)}
                              className={cn(
                                "h-8 w-8 p-0 rounded-lg text-xs font-bold",
                                currentPage === p 
                                  ? "bg-primary-600 text-white hover:bg-primary-700" 
                                  : "text-muted-foreground hover:text-navy-900 dark:hover:text-white"
                              )}
                            >
                              {p}
                            </Button>
                          </div>
                        );
                      })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-white/10 font-bold text-xs bg-white dark:bg-card dark:text-white"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-modal max-w-xl dark:bg-card p-0 overflow-hidden">
           <div className="bg-primary-600 p-8 text-white">
              <DialogHeader>
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                       <FileSpreadsheet className="h-6 w-6 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-black font-outfit uppercase">Bulk Import Portal</DialogTitle>
                 </div>
                 <DialogDescription className="text-white/70 text-sm leading-relaxed">
                   Synchronize candidate data via Excel. Unique Roll Numbers are guaranteed by atomic registry transactions.
                 </DialogDescription>
              </DialogHeader>
           </div>
           
           <div className="p-10 space-y-10">
              <div className="grid gap-6 sm:grid-cols-2">
                 <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Step 1: Get Template</h3>
                    <Button 
                      variant="outline" 
                      onClick={downloadTemplate}
                      className="w-full h-20 rounded-3xl border-2 border-dashed gap-3 font-black text-[11px] uppercase tracking-widest dark:border-white/10 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                       <Download className="h-5 w-5 text-primary-600" />
                       Download Template
                    </Button>
                 </div>
                 <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Step 2: Upload Data</h3>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full h-20 rounded-3xl border-none shadow-sm gap-3 font-black text-[11px] uppercase tracking-widest transition-all",
                        importFile ? "bg-emerald-600 text-white shadow-xl" : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500"
                      )}
                    >
                       {importFile ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                       {importFile ? 'File Attached' : 'Select Sheet'}
                    </Button>
                 </div>
              </div>

              {importFile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-slate-50 dark:bg-navy-950/50 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between"
                >
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-navy-900 shadow-sm flex items-center justify-center text-emerald-600">
                         <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="font-bold text-navy-900 dark:text-white text-sm truncate max-w-[200px]">{importFile.name}</p>
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Ready for verification</p>
                      </div>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setImportFile(null)} className="text-slate-300 hover:text-rose-600"><X className="h-5 w-5" /></Button>
                </motion.div>
              )}

              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-800/30 flex gap-4">
                 <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                 <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed italic">
                   The Registry Logic uses atomic transactions to ensure sequential, unique roll numbers even if multiple staff members are importing at the same time.
                 </p>
              </div>
           </div>

           <DialogFooter className="p-8 pt-0 flex-col gap-2">
              <Button 
                onClick={handleBulkImport} 
                disabled={!importFile || importing} 
                className="w-full h-16 rounded-3xl bg-navy-900 hover:bg-navy-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
              >
                 {importing ? <Loader2 className="animate-spin h-6 w-6" /> : <Zap className="h-6 w-6 mr-3" />}
                 {importing ? 'Synchronizing Registry...' : 'Initialize Bulk Sync'}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQRPortalOpen} onOpenChange={setIsQRPortalOpen}>
        <DialogContent className="max-w-xs text-center rounded-[2.5rem] p-10 dark:bg-card border-none shadow-3xl">
          <DialogTitle className="sr-only">Student Identity QR Code</DialogTitle>
          <DialogDescription className="sr-only">Student digital verification credentials</DialogDescription>
          {selectedStudent && (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border-4 border-slate-50">
                <QRCodeSVG value={JSON.stringify({ sid: selectedStudent.id, scho: schoolId, tok: selectedStudent.qrToken })} size={180} level="H" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-2xl text-navy-900 dark:text-white leading-tight font-outfit">{selectedStudent.name}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{selectedStudent.class} - Section {selectedStudent.section}</p>
              </div>
              <Button onClick={() => window.print()} className="w-full h-14 rounded-2xl font-black bg-navy-900 hover:bg-navy-800 text-white tracking-widest uppercase text-xs">Print Credentials</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-modal dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-outfit text-navy-900 dark:text-white uppercase">Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              Are you absolutely sure you want to delete <span className="font-black text-navy-900 dark:text-white">{deleteTarget?.name}</span>? 
              This action is permanent and will revoke all identity credentials for this student from the institutional registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-14 px-8 font-bold border-2 dark:border-white/10 dark:text-white bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-2xl h-14 px-10 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs shadow-lg"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical, 
  Trash2, 
  Loader2,
  ChevronRight,
  ArrowRight,
  Edit
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
import { useToast } from '@/hooks/use-toast';
import { SeatingPlan } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getSeatingPlans, deleteSeatingPlan } from '@/lib/supabase-service';

export default function SeatingPlansPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<SeatingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getSeatingPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load seating plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = plans.filter(p => 
    (p.roomName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.examTitle || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this seating plan?")) return;
    try {
      const ok = await deleteSeatingPlan(id);
      if (ok) {
        setPlans(prev => prev.filter(p => p.id !== id));
        toast({ title: "Plan deleted successfully" });
      } else {
        throw new Error("Delete failed");
      }
    } catch (e) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0 mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Seating Plans</h1>
          <p className="text-muted-foreground font-medium">Automated hall allocation and room management.</p>
        </div>
        <Button className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold" asChild>
          <Link href="/admin/seating/new">
            <Plus className="h-5 w-5" />
            New Seating Plan
          </Link>
        </Button>
      </header>

      <div className="px-4 sm:px-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            placeholder="Search by room or exam..." 
            className="w-full pl-11 h-12 border-none bg-white dark:bg-card dark:text-white rounded-2xl text-base shadow-card focus:ring-2 ring-primary-600/20 outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 px-4 sm:px-0 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none shadow-card rounded-3xl h-48 animate-pulse bg-white dark:bg-card" />
          ))
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] bg-white dark:bg-card">
            <div className="h-20 w-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="h-10 w-10 text-slate-200 dark:text-slate-800" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-navy-900 dark:text-white">No plans configured</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
              Generate intelligent hall seating allocations for any active examination session.
            </p>
            <Button variant="outline" className="rounded-full border-slate-200 dark:border-white/10 dark:text-white" asChild>
              <Link href="/admin/seating/new">Create First Plan</Link>
            </Button>
          </div>
        ) : (
          filteredPlans.map(plan => {
            const totalAllocated = plan.columns?.reduce((acc, col) => acc + (col.students?.length || 0), 0) || 0;
            const classesIncluded = Array.from(new Set(plan.columns?.map(c => c.className) || []));

            return (
              <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-none shadow-card rounded-[2rem] bg-white dark:bg-card hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl bg-white dark:bg-slate-900">
                        <DropdownMenuItem asChild className="rounded-xl font-medium">
                          <Link href={`/admin/seating/${plan.id}/edit`} className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-slate-500" /> Edit Layout
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(plan.id)}
                          className="rounded-xl font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold text-lg">
                        {plan.roomName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-navy-900 dark:text-white font-outfit leading-tight">{plan.roomName}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{plan.corridor || 'Main Campus'} • Cap: {plan.totalCapacity}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Exam</span>
                        <span className="font-bold text-navy-900 dark:text-white truncate max-w-[150px]">{plan.examTitle}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Allocated Seats</span>
                        <span className="font-bold text-primary-600">{totalAllocated} / {plan.totalCapacity}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Classes</span>
                        <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                          {classesIncluded.slice(0, 2).map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 font-bold border-slate-200">
                              {c}
                            </Badge>
                          ))}
                          {classesIncluded.length > 2 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 font-bold border-slate-200">
                              +{classesIncluded.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-navy-900 dark:text-white font-bold text-xs h-10 gap-1.5" asChild>
                        <Link href={`/admin/seating/${plan.id}`}>
                          View Grid
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button variant="outline" className="rounded-xl border-slate-200 dark:border-white/10 text-xs h-10 font-bold px-3" asChild>
                        <Link href={`/admin/print/seating/${plan.id}`} target="_blank">
                          Print
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

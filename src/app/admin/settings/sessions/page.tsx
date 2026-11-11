'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  Trash2,
  Calendar,
  AlertCircle
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
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAcademicSessions, 
  upsertAcademicSession, 
  deleteAcademicSession, 
  setActiveAcademicSession 
} from '@/lib/supabase-service';

export default function SessionsSettingsPage() {
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await getAcademicSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load academic sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const sessionId = `session_${Date.now()}`;
      const sessionData = {
        id: sessionId,
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: sessions.length === 0,
        classes: [],
        createdAt: new Date().toISOString()
      };

      const ok = await upsertAcademicSession(sessionData);
      if (!ok) throw new Error("Creation failed");
      
      toast({ title: "Session Created", description: "Academic year added successfully." });
      setIsAddOpen(false);
      setFormData({ title: '', startDate: '', endDate: '' });
      await loadSessions();
    } catch (err) {
      toast({ title: "Failed to create session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (session: Session) => {
    if (session.isActive) return;
    try {
      await setActiveAcademicSession(session.id);
      toast({ title: "Active Session Changed", description: `${session.title} is now active.` });
      await loadSessions();
    } catch (err) {
      toast({ title: "Failed to change active session", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await deleteAcademicSession(id);
      toast({ title: "Session removed" });
      await loadSessions();
    } catch (err) {
      toast({ title: "Failed to delete session", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Academic Sessions</h1>
          <p className="text-muted-foreground font-medium">Manage institutional terms and school years.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold">
              <Plus className="h-5 w-5" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-modal dark:bg-card">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl">Add Academic Year</DialogTitle>
              <DialogDescription>Define a new session calendar cycle for enrollments and exams.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Session Title</Label>
                <Input 
                  placeholder="e.g. 2026" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-full">Cancel</Button>
              <Button onClick={handleCreate} disabled={loading} className="rounded-full px-6 bg-primary-600 text-white font-bold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-4">
        {sessionsLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-none shadow-card rounded-3xl p-12 text-center bg-white dark:bg-card">
            <CalendarRange className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg font-outfit">No Academic Sessions</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Initialize your primary active calendar cycle.</p>
            <Button onClick={() => setIsAddOpen(true)} className="rounded-full bg-primary-600 text-white font-bold">
              Add First Session
            </Button>
          </Card>
        ) : (
          sessions.map((session) => (
            <motion.div key={session.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-none shadow-card rounded-2xl bg-white dark:bg-card overflow-hidden">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-primary-600">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg font-outfit text-navy-900 dark:text-white">{session.title}</h3>
                        {session.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-none text-[10px]">
                            Active Current
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.startDate} to {session.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!session.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleActive(session)}
                        className="rounded-full border-slate-200 dark:border-white/10 text-xs font-bold"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(session.id)}
                      className="rounded-full h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  Printer, 
  Users, 
  LayoutGrid,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSchoolStore } from '@/store/use-school-store';
import Link from 'next/link';
import { Student } from '@/types';
import { cn } from '@/lib/utils';
import { getStudents } from '@/lib/supabase-service';

export default function SeatingPlanPage() {
  const { settings } = useSchoolStore();

  const [mounted, setMounted] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    roomName: "Main Hall",
    columns: 5,
    rows: 8,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setRawStudents([]);
      return;
    }
    async function load() {
      setLoading(true);
      try {
        const students = await getStudents(selectedClass);
        setRawStudents(students.filter(s => s.status === 'active'));
      } catch (err) {
        console.error('Failed to load students for seating:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedClass]);

  const seatingPlan = useMemo(() => {
    if (!rawStudents.length) return [];
    
    const sorted = [...rawStudents].sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
    
    const plan: (Student | null)[][] = Array.from({ length: config.rows }, () => 
      Array.from({ length: config.columns }, () => null)
    );

    let studentIndex = 0;
    for (let c = 0; c < config.columns; c++) {
      for (let r = 0; r < config.rows; r++) {
        if (studentIndex < sorted.length) {
          plan[r][c] = sorted[studentIndex];
          studentIndex++;
        }
      }
    }
    return plan;
  }, [rawStudents, config]);

  const totalCapacity = config.columns * config.rows;
  const enrolledCount = rawStudents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/exams"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Seating Arrangement</h1>
            <p className="text-sm text-muted-foreground">Auto-generate grid seating maps for exams</p>
          </div>
        </div>
        <Button onClick={() => window.print()} className="gap-2" disabled={!selectedClass || rawStudents.length === 0}>
          <Printer className="h-4 w-4" /> Print Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Arrangement Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {settings?.classes?.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase">Room Name</label>
              <Input 
                value={config.roomName} 
                onChange={(e) => setConfig({ ...config, roomName: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase">Columns</label>
                <Input 
                  type="number" 
                  min={1} 
                  max={10} 
                  value={config.columns} 
                  onChange={(e) => setConfig({ ...config, columns: Math.max(1, parseInt(e.target.value) || 1) })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase">Rows</label>
                <Input 
                  type="number" 
                  min={1} 
                  max={20} 
                  value={config.rows} 
                  onChange={(e) => setConfig({ ...config, rows: Math.max(1, parseInt(e.target.value) || 1) })} 
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-semibold">{totalCapacity} seats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Students:</span>
                <span className="font-semibold">{enrolledCount} active</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Vacant:</span>
                <span className={cn("font-semibold", totalCapacity < enrolledCount ? "text-rose-500" : "text-emerald-500")}>
                  {totalCapacity - enrolledCount} seats
                </span>
              </div>
            </div>

            {totalCapacity < enrolledCount && (
              <div className="flex items-center gap-2 text-rose-500 text-xs bg-rose-50 p-3 rounded-lg border border-rose-200">
                <Info className="h-4 w-4 shrink-0" />
                <span>Room capacity is less than the enrolled student count.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle>{config.roomName}</CardTitle>
              <CardDescription>{selectedClass ? `${selectedClass} Examination Grid` : 'Select a class to generate plan'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase border px-2 py-1 rounded">Front Desk / Board</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-muted-foreground animate-pulse">Loading class students...</div>
            ) : !selectedClass ? (
              <div className="py-20 text-center text-muted-foreground">Please select a class from the left panel.</div>
            ) : (
              <div 
                className="grid gap-3 min-w-[500px]" 
                style={{ gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))` }}
              >
                {seatingPlan.map((row, rIdx) => 
                  row.map((student, cIdx) => (
                    <div 
                      key={`${rIdx}-${cIdx}`}
                      className={cn(
                        "p-3 rounded-lg border flex flex-col justify-between h-20 text-center transition-all",
                        student 
                          ? "bg-card border-border hover:border-primary-500 shadow-sm" 
                          : "bg-muted/40 border-dashed border-muted text-muted-foreground/40"
                      )}
                    >
                      {student ? (
                        <>
                          <div className="text-xs font-bold text-primary-600">Roll #{student.rollNumber}</div>
                          <div className="text-xs font-semibold truncate leading-tight">{student.name}</div>
                          <div className="text-[10px] text-muted-foreground">{student.class}-{student.section}</div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs">Empty</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft,
  Users,
  QrCode,
  User,
  Info,
  CalendarCheck,
  ShieldCheck,
  Zap,
  ArrowRight,
  Smartphone,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { Student, Exam, Attendance } from '@/types';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getStudents, getExams } from '@/lib/supabase-service';
import { saveAttendanceRecord, getAttendanceRecords } from '@/lib/attendance-service';

export default function UniversalProctoringScanner() {
  const router = useRouter();
  const { user } = useAuthStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<{ 
    student: Student;
    activeExam?: Exam;
    todaySubject?: { id: string; name: string };
    alreadyMarked?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loggingAttendance, setLoggingAttendance] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeExams, setActiveExams] = useState<Exam[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [studentsList, examsList] = await Promise.all([
          getStudents(),
          getExams()
        ]);
        setStudents(studentsList);
        setActiveExams(examsList.filter(e => !e.isLocked));
      } catch (err) {
        console.error('Failed to load scanner registry:', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let isStarted = false;
    
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("universal-scanner-view");
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 15, 
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0
        };

        try {
          await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
        } catch (envErr) {
          try {
            await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {});
          } catch (userErr) {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              await html5QrCode.start(cameras[0].id, config, onScanSuccess, () => {});
            } else {
              throw new Error("Video device inaccessible");
            }
          }
        }
        
        isStarted = true;
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Scanner init error:", err);
        setHasCameraPermission(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        if (isStarted) {
          scannerRef.current.stop()
            .then(() => scannerRef.current?.clear())
            .catch(e => console.warn("Cleanup warning:", e));
        } else {
          try { scannerRef.current.clear(); } catch(e) {}
        }
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (processing || scanResult) return;
    setProcessing(true);
    setError(null);

    try {
      let verificationData;
      if (decodedText.includes('Verification:')) {
        const jsonString = decodedText.split('Verification:')[1].trim();
        verificationData = JSON.parse(jsonString);
      } else if (decodedText.startsWith('{')) {
        verificationData = JSON.parse(decodedText);
      } else {
        const student = students.find(s => s.rollNumber === decodedText || s.id === decodedText || s.qrToken === decodedText);
        if (student) {
          verificationData = { sid: student.id, tok: student.qrToken };
        } else {
          throw new Error("Format unrecognized");
        }
      }

      const { sid: studentId } = verificationData;
      const student = students.find(s => s.id === studentId || s.rollNumber === studentId);
      
      if (!student) {
        setError("Student record not registered.");
        return;
      }

      const primaryExam = activeExams[0];
      let todaySubject: { id: string; name: string } | undefined;

      if (primaryExam?.classConfigs?.[student.class]?.subjects) {
        const subjects = primaryExam.classConfigs[student.class].subjects;
        for (const [sId, sub] of Object.entries(subjects) as any[]) {
          if (sub.date === today) {
            todaySubject = { id: sId, name: sub.name || sId };
            break;
          }
        }
      }

      let alreadyMarked = false;
      if (primaryExam) {
        const currentRecords = await getAttendanceRecords(primaryExam.id, today);
        alreadyMarked = currentRecords.some(r => r.studentId === student.id && r.status === 'present');
      }

      setScanResult({
        student,
        activeExam: primaryExam,
        todaySubject,
        alreadyMarked
      });

    } catch (e) {
      setError("Unreadable QR layout.");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!scanResult || !scanResult.activeExam) return;
    setLoggingAttendance(true);

    try {
      const record: Attendance = {
        id: scanResult.student.id,
        studentId: scanResult.student.id,
        studentName: scanResult.student.name,
        className: scanResult.student.class,
        sectionName: scanResult.student.section,
        status: 'present',
        markedAt: new Date().toISOString(),
        markedBy: user?.email || user?.uid || 'Teacher',
        timestamp: new Date().toISOString()
      };

      await saveAttendanceRecord(scanResult.activeExam.id, today, record);
      setScanResult(prev => prev ? { ...prev, alreadyMarked: true } : null);
    } finally {
      setLoggingAttendance(false);
      setTimeout(() => setScanResult(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950 z-[100] flex flex-col overflow-hidden text-white">
      <div className="h-20 flex items-center justify-between px-6 bg-black/80 backdrop-blur-2xl border-b border-white/10 relative z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-12 w-12 rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-7 w-7" />
          </Button>
          <div>
            <p className="text-white text-xs font-black uppercase tracking-[0.3em]">Duty Interface</p>
            <div className="flex items-center gap-1.5 mt-1">
               <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
               <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none">Global Registry Terminal</p>
            </div>
          </div>
        </div>
        <div className="h-10 w-10 flex items-center justify-center">
           {processing && <Loader2 className="h-6 w-6 animate-spin text-primary-400" />}
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div id="universal-scanner-view" className="w-full h-full object-cover"></div>
        
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <div className="w-[300px] h-[300px] relative">
              <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-primary-500 rounded-tl-[2.5rem] shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
              <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-primary-500 rounded-tr-[2.5rem] shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
              <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-primary-500 rounded-bl-[2.5rem] shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
              <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-primary-500 rounded-br-[2.5rem] shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
              
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                className="absolute left-3 right-3 h-0.5 bg-primary-400 shadow-[0_0_30px_rgba(59,130,246,1)] z-10" 
              />
           </div>
           <div className="absolute inset-0 border-[calc(50vh-150px)] border-black/75 pointer-events-none" />
        </div>

        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-0 inset-x-0 p-6 z-50 pointer-events-auto"
            >
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-navy-900/95 backdrop-blur-2xl text-white border border-white/10 overflow-hidden max-w-lg mx-auto">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-xl overflow-hidden border border-white/10">
                        {scanResult.student.photoURL ? (
                          <img src={scanResult.student.photoURL} alt={scanResult.student.name} className="h-full w-full object-cover" />
                        ) : (
                          scanResult.student.name.substring(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-primary-400">#{scanResult.student.rollNumber}</span>
                          <h3 className="font-bold text-lg font-outfit">{scanResult.student.name}</h3>
                        </div>
                        <p className="text-xs text-white/60">
                          Grade {scanResult.student.class} - {scanResult.student.section} • {scanResult.student.fatherName}
                        </p>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" onClick={() => setScanResult(null)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {scanResult.alreadyMarked ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      <div>
                        <p className="font-bold text-sm text-emerald-400">Attendance Already Recorded</p>
                        <p className="text-xs text-white/60">Candidate is officially registered as Present.</p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleConfirmAttendance}
                      disabled={loggingAttendance}
                      className="w-full h-12 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm"
                    >
                      {loggingAttendance ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                      Confirm Candidate Present
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-10 left-6 right-6 max-w-md mx-auto z-50 pointer-events-auto"
            >
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/30 text-rose-200 flex items-center gap-3 shadow-xl backdrop-blur-xl">
                <AlertCircle className="h-6 w-6 text-rose-400 shrink-0" />
                <p className="font-bold text-xs uppercase tracking-wide">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

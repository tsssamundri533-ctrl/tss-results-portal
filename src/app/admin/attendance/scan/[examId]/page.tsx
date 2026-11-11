'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  Users, 
  UserCheck, 
  QrCode, 
  ShieldCheck, 
  Smartphone, 
  RefreshCw, 
  Zap, 
  Search, 
  Camera, 
  SwitchCamera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { Student, Attendance } from '@/types';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getStudents } from '@/lib/supabase-service';
import { getAttendanceRecords, saveAttendanceRecord } from '@/lib/attendance-service';

function playBeep(type: 'success' | 'warning' | 'error') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

export default function AdminAttendanceScanner({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const { schoolId, user } = useAuthStore();
  const settings = useSchoolStore(state => state.settings);
  const today = format(new Date(), 'yyyy-MM-dd');

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [targetClass, setTargetClass] = useState<string>("all");
  const [scanResult, setScanResult] = useState<{ 
    type: 'success' | 'already' | 'error' | 'wrong-class'; 
    message: string; 
    studentName?: string;
    studentRoll?: string;
    studentClass?: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);
  const [isStartingScanner, setIsStartingScanner] = useState(false);

  // Manual Roll Number Dialog
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualRoll, setManualRoll] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [studentsList, records] = await Promise.all([
          getStudents(),
          getAttendanceRecords(examId, today)
        ]);
        setStudents(studentsList);
        setAttendanceRecords(records);
      } catch (err) {
        console.error('Failed to load scanner registry:', err);
      }
    }
    loadData();
  }, [examId, today]);

  const recordStudentAttendance = async (student: Student) => {
    if (targetClass !== "all" && student.class !== targetClass) {
      playBeep('warning');
      setScanResult({ 
        type: 'wrong-class', 
        message: `Candidate enrolled in Grade ${student.class}`,
        studentName: student.name,
        studentRoll: student.rollNumber,
        studentClass: student.class
      });
      return false;
    }

    const existing = attendanceRecords.find(r => r.studentId === student.id);
    if (existing) {
      playBeep('warning');
      setScanResult({ 
        type: 'already', 
        message: `Already Marked at ${format(new Date(existing.timestamp), 'hh:mm aa')}`,
        studentName: student.name,
        studentRoll: student.rollNumber,
        studentClass: student.class
      });
      return false;
    }

    const record: Attendance = {
      id: student.id,
      studentId: student.id,
      studentName: student.name,
      className: student.class,
      sectionName: student.section,
      status: 'present',
      markedAt: new Date().toISOString(),
      markedBy: user?.email || user?.uid || 'Admin',
      timestamp: new Date().toISOString()
    };

    await saveAttendanceRecord(examId, today, record);
    setAttendanceRecords(prev => [...prev, record]);
    playBeep('success');
    
    setScanResult({ 
      type: 'success', 
      message: 'Attendance Verified & Logged',
      studentName: student.name,
      studentRoll: student.rollNumber,
      studentClass: student.class
    });
    return true;
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processing || scanResult) return;
    setProcessing(true);

    try {
      let verificationData: any;
      if (decodedText.includes('Verification:')) {
        const jsonString = decodedText.split('Verification:')[1].trim();
        verificationData = JSON.parse(jsonString);
      } else if (decodedText.startsWith('{')) {
        verificationData = JSON.parse(decodedText);
      } else {
        // Fallback: raw roll number or ID
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
        playBeep('error');
        setScanResult({ type: 'error', message: 'Candidate Not Found in Registry' });
      } else {
        await recordStudentAttendance(student);
      }
    } catch (e) {
      playBeep('error');
      setScanResult({ type: 'error', message: 'QR Format Unreadable' });
    } finally {
      setProcessing(false);
      setTimeout(() => setScanResult(null), 2500);
    }
  };

  const startCameraInstance = async (cameraIdx = 0, deviceList?: CameraDevice[]) => {
    setIsStartingScanner(true);
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode("admin-scanner-view");
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 20, 
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0
      };

      let devList = deviceList || cameras;
      if (!devList || devList.length === 0) {
        try {
          devList = await Html5Qrcode.getCameras();
          setCameras(devList || []);
        } catch (e) {}
      }

      if (devList && devList.length > 0) {
        const targetDev = devList[cameraIdx % devList.length];
        await html5QrCode.start(
          targetDev.id,
          config,
          onScanSuccess,
          () => {}
        );
      } else {
        // Fallback to facingMode
        try {
          await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
        } catch {
          await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {});
        }
      }

      setHasCameraPermission(true);
    } catch (err) {
      console.error("Camera startup error:", err);
      setHasCameraPermission(false);
    } finally {
      setIsStartingScanner(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const devs = await Html5Qrcode.getCameras();
        if (mounted && devs && devs.length > 0) {
          setCameras(devs);
          await startCameraInstance(0, devs);
        } else if (mounted) {
          await startCameraInstance(0);
        }
      } catch (err) {
        if (mounted) {
          await startCameraInstance(0);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
            .then(() => scannerRef.current?.clear())
            .catch(e => console.warn("Scanner cleanup warning:", e));
        } catch(e) {}
      }
    };
  }, []);

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) {
      // Toggle facingMode environment / user
      const nextIdx = currentCameraIdx === 0 ? 1 : 0;
      setCurrentCameraIdx(nextIdx);
      await startCameraInstance(nextIdx);
      return;
    }
    const nextIdx = (currentCameraIdx + 1) % cameras.length;
    setCurrentCameraIdx(nextIdx);
    await startCameraInstance(nextIdx);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRoll.trim()) return;
    setManualLoading(true);

    try {
      const query = manualRoll.trim().toLowerCase();
      const student = students.find(s => 
        s.rollNumber.toLowerCase() === query || 
        s.name.toLowerCase() === query || 
        s.id.toLowerCase() === query
      );

      if (!student) {
        playBeep('error');
        setScanResult({ type: 'error', message: `No Student with Roll: ${manualRoll}` });
      } else {
        await recordStudentAttendance(student);
        setManualRoll('');
        setManualDialogOpen(false);
      }
    } finally {
      setManualLoading(false);
      setTimeout(() => setScanResult(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950 z-[100] flex flex-col overflow-hidden text-white select-none">
      {/* Top Header Bar */}
      <div className="h-20 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-black/85 backdrop-blur-2xl border-b border-white/10 relative z-30">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 h-11 w-11 rounded-full shrink-0" 
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white text-xs sm:text-sm font-black uppercase tracking-[0.2em] font-outfit">
                Attendance Scanner
              </p>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                {attendanceRecords.length} Present
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-primary-400" />
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                Session 2026 • Live Registry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={targetClass} onValueChange={setTargetClass}>
            <SelectTrigger className="w-28 sm:w-36 h-10 rounded-xl bg-white/10 border-white/20 text-white font-bold text-xs">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="bg-navy-900 border-white/10 text-white">
              <SelectItem value="all">All Grades</SelectItem>
              {settings?.classes?.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Camera Viewport Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {/* Fullscreen Video Stream Anchor */}
        <div id="admin-scanner-view" className="absolute inset-0 w-full h-full overflow-hidden" />

        {/* Viewfinder Cutout with Infinite Shadow Mask */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-20">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 max-w-[80vw] max-h-[50vh] rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex items-center justify-center">
            {/* 4 Corner Markers */}
            <div className="absolute top-0 left-0 w-10 sm:w-12 h-10 sm:h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
            <div className="absolute top-0 right-0 w-10 sm:w-12 h-10 sm:h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
            <div className="absolute bottom-0 left-0 w-10 sm:w-12 h-10 sm:h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
            <div className="absolute bottom-0 right-0 w-10 sm:w-12 h-10 sm:h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl shadow-[0_0_15px_rgba(52,211,153,0.8)]" />

            {/* Scanning Laser Line */}
            <motion.div 
              animate={{ top: ['8%', '88%', '8%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,1)] z-10" 
            />
          </div>

          <p className="mt-4 text-white/90 font-bold text-[11px] sm:text-xs uppercase tracking-wider bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto shadow-lg text-center">
            Align QR inside frame • کیو آر کوڈ فریم کے سامنے لائیں
          </p>
        </div>

        {/* Camera Permission Denied / Loading State */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 bg-navy-950/95 flex flex-col items-center justify-center p-6 text-center z-40">
            <Camera className="h-16 w-16 text-rose-400 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold font-outfit text-white">Camera Access Required</h3>
            <p className="text-white/60 text-sm max-w-sm mt-2 mb-6">
              Please grant camera permission in your browser to scan roll number slip QR codes.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => startCameraInstance(0)} 
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Retry Camera
              </Button>
              <Button 
                onClick={() => setManualDialogOpen(true)} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl"
              >
                <Search className="h-4 w-4 mr-2" /> Manual Roll Entry
              </Button>
            </div>
          </div>
        )}

        {/* Scan Result Feedback Toast Notification */}
        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="absolute bottom-24 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto"
            >
              <div className={cn(
                "p-5 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-center gap-4",
                scanResult.type === 'success' ? "bg-emerald-950/95 border-emerald-500/60 text-emerald-100" :
                scanResult.type === 'already' ? "bg-amber-950/95 border-amber-500/60 text-amber-100" :
                "bg-rose-950/95 border-rose-500/60 text-rose-100"
              )}>
                {scanResult.type === 'success' ? <CheckCircle2 className="h-10 w-10 text-emerald-400 shrink-0" /> :
                 scanResult.type === 'already' ? <AlertCircle className="h-10 w-10 text-amber-400 shrink-0" /> :
                 <X className="h-10 w-10 text-rose-400 shrink-0" />}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm sm:text-base leading-tight font-outfit uppercase">{scanResult.message}</h4>
                  {scanResult.studentName && (
                    <p className="text-xs sm:text-sm font-bold opacity-90 mt-1 truncate">
                      {scanResult.studentName} • Roll: {scanResult.studentRoll} ({scanResult.studentClass})
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="h-20 shrink-0 bg-black/85 backdrop-blur-2xl border-t border-white/10 px-4 sm:px-6 flex items-center justify-around relative z-30">
        <Button 
          variant="ghost" 
          onClick={handleSwitchCamera}
          disabled={isStartingScanner}
          className="text-white hover:bg-white/10 flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-2xl"
        >
          <SwitchCamera className={cn("h-5 w-5 text-primary-400", isStartingScanner && "animate-spin")} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Switch Camera</span>
        </Button>

        <Button 
          onClick={() => setManualDialogOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-5 h-12 font-bold shadow-lg gap-2 text-xs uppercase tracking-wider"
        >
          <Search className="h-4 w-4" />
          <span>Manual Entry (دستی حاضری)</span>
        </Button>

        <Button 
          variant="ghost" 
          onClick={() => router.push(`/admin/attendance/manage/${examId}/${today}/${targetClass}`)}
          className="text-white hover:bg-white/10 flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-2xl"
        >
          <Users className="h-5 w-5 text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">View Sheet</span>
        </Button>
      </div>

      {/* Manual Roll Number Verification Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="rounded-3xl border-white/10 bg-navy-900 text-white shadow-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary-400" />
              Manual Roll Verification
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Enter student roll number to log attendance directly without scanning QR.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Roll Number (رول نمبر)
              </label>
              <Input 
                autoFocus
                placeholder="e.g. 1001" 
                value={manualRoll} 
                onChange={(e) => setManualRoll(e.target.value)} 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-lg font-bold h-12 rounded-xl text-center tracking-widest"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setManualDialogOpen(false)} 
                className="text-white hover:bg-white/10 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={manualLoading || !manualRoll.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 h-11"
              >
                {manualLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Mark Present
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

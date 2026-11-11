export type UserRole = 'admin' | 'teacher';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  phone?: string;
  photoURL?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  fatherName: string;
  gender: 'male' | 'female';
  class: string;
  section: string;
  sessionId: string;
  corridor: 'Corridor A' | 'Corridor B' | 'Corridor C';
  photoURL?: string;
  qrCode?: string;
  qrToken: string;
  status: 'active' | 'withdrawn' | 'graduated';
  schoolId: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  maxTheory?: number;
  maxPractical?: number;
  maxMarks: number;
  appliesTo: string[];
  isActive: boolean;
}

export interface Session {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  classes: string[];
  createdAt: any;
}

export interface SchoolProfile {
  schoolName: string;
  schoolNameUrdu?: string;
  logoURL?: string;
  logoStoragePath?: string;
  faviconURL?: string;
  principalSignatureURL?: string;
  directorSignatureURL?: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  phone2?: string;
  email?: string;
  website?: string;
  motto?: string;
  startingRollNumber?: number;
  rollNumberSlipInstructions?: string;
  resultCardRemarks?: {
    excellent: string;
    good: string;
    needsImprovement: string;
  };
  updatedAt?: any;
}

export interface PrintConfig {
  showLogoOnPrints: boolean;
  showStampOnResults: boolean;
  showSignatureOnResults: boolean;
  showAddressOnPrints: boolean;
  showPhoneOnPrints: boolean;
  showEmailOnPrints: boolean;
  resultCardOrientation: 'portrait' | 'landscape';
  rollSlipPerPage: 1 | 2 | 4;
  attendanceSheetFooter?: string;
  markSheetFooter?: string;
  rollNumberSlipInstructions?: string;
}

export interface SchoolSettings {
  id: string;
  profile: SchoolProfile | null;
  activeSession: Session | null;
  printConfig: PrintConfig | null;
  subjects: Subject[];
  classes: string[];
  sections: string[]; // Global default sections
  classSections?: Record<string, string[]>; // Mapping of ClassName -> SectionNames
  gradingScale?: {
    grade: string;
    min: number;
    label: string;
    remark?: string; // Dynamic remark based on grade
  }[];
  remarksConfig?: RemarksConfig;
}

export interface RemarksCategoryTemplates {
  firstPosition: string;
  secondPosition: string;
  thirdPosition: string;
  topTen: string;
  gradeAPlus: string;
  gradeA: string;
  gradeB: string;
  gradeC: string;
  gradeD: string;
  fail: string;
}

export interface RemarksConfig {
  singleTerm: RemarksCategoryTemplates;
  combinedTerm: RemarksCategoryTemplates;
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  className: string;
  sectionName: string; // Hierarchical awareness
  subject: string;
  subjectName?: string;
  subjectId: string;
  sessionId: string;
  classId?: string;
  sectionId?: string;
  isAttendanceLead?: boolean;
  dutyDate?: string; 
  createdAt: any;
}

export interface Exam {
  id: string;
  title: string;
  examTypeId: string;
  sessionId: string;
  year: number;
  classes: string[];
  classConfigs: Record<string, {
    subjects: Record<string, {
      name: string;
      maxMarks: number;
      date?: string;
      reportingTime?: string;
      startTime?: string;
      order?: number;
    }>
  }>;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  passPercentage: number;
  schoolId: string;
  createdAt: any;
}

export interface DateSheet {
  id: string;
  examTitle: string;
  className: string;
  sectionName?: string;
  papers: {
    subjectId: string;
    subjectName: string;
    date: string;
    reportingTime: string;
    startTime: string;
  }[];
  updatedAt?: any;
}

export interface Mark {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  subjectId: string;
  classId: string;
  sectionName: string; // Specific section for this mark
  marks: number;
  maxMarks: number;
  theory?: number;
  practical?: number;
  total?: number;
  enteredBy: string;
  schoolId: string;
  updatedAt?: any;
}

export interface Result {
  id: string;
  studentId: string;
  examId: string;
  schoolId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  gender?: 'male' | 'female';
  photoURL?: string;
  subjects: Record<string, {
    name: string;
    marks: number;
    maxMarks: number;
    grade: string;
  }>;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  status: 'Pass' | 'Fail';
  remarks: string;
  computedAt: any;
  // Metadata for printing
  dateOfBirth?: string;
  issueNo?: string;
  dateOfIssue?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  sectionName: string;
  status: 'present' | 'absent';
  markedAt: string;
  markedBy: string;
  timestamp: string;
}

export interface SeatingPlan {
  id: string;
  examId: string;
  examTitle: string;
  roomName: string;
  corridor: string;
  totalCapacity: number;
  columns: {
    colIndex: number;
    className: string;
    sectionName?: string;
    students: {
      studentId: string;
      rollNumber: string;
      name: string;
      className: string;
      sectionName: string;
      seatNumber: number;
    }[];
  }[];
  schoolId: string;
  createdAt: any;
  createdBy: string;
}

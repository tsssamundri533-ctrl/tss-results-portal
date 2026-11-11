-- ==============================================================================
-- TSS Results Portal - Complete Supabase Schema (PostgreSQL)
-- Supports Multi-Term (First Term, Second Term, Annual) & Relational Integrity
-- ==============================================================================

-- 1. School Settings & Profile
CREATE TABLE IF NOT EXISTS public.school_settings (
    id TEXT PRIMARY KEY DEFAULT 'tss-main-school',
    school_name TEXT NOT NULL DEFAULT 'The Spirit School Samundri Campus',
    school_name_urdu TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    principal_signature_url TEXT,
    director_signature_url TEXT,
    address TEXT DEFAULT 'Housing Colony #2 Samundri',
    city TEXT DEFAULT 'Samundri',
    province TEXT DEFAULT 'Punjab',
    country TEXT DEFAULT 'Pakistan',
    phone TEXT DEFAULT '0333-9114333 | 0345-9114333',
    phone2 TEXT,
    email TEXT,
    website TEXT,
    motto TEXT,
    starting_roll_number INTEGER DEFAULT 1001,
    roll_number_slip_instructions TEXT,
    grading_scale JSONB DEFAULT '[]'::jsonb,
    print_config JSONB DEFAULT '{}'::jsonb,
    result_card_remarks JSONB DEFAULT '{}'::jsonb,
    classes JSONB DEFAULT '[]'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    class_sections JSONB DEFAULT '{}'::jsonb,
    subjects JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Academic Sessions
CREATE TABLE IF NOT EXISTS public.academic_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TEXT,
    end_date TEXT,
    classes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exams & Terms (Multi-Term Support: First Term, Second Term, Annual, etc.)
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    exam_type_id TEXT NOT NULL DEFAULT 'first-term',
    session_id TEXT,
    year INTEGER DEFAULT 2026,
    classes JSONB DEFAULT '[]'::jsonb,
    class_configs JSONB DEFAULT '{}'::jsonb,
    start_date TEXT,
    end_date TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    pass_percentage NUMERIC DEFAULT 33,
    school_id TEXT DEFAULT 'tss-main-school',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students Registry (Cloudinary photos preserved via photo_url)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    roll_number TEXT NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    gender TEXT DEFAULT 'male',
    class_name TEXT NOT NULL,
    section_name TEXT NOT NULL,
    session_id TEXT DEFAULT 'default',
    corridor TEXT,
    photo_url TEXT,
    qr_token TEXT,
    status TEXT DEFAULT 'active',
    school_id TEXT DEFAULT 'tss-main-school',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_class_section ON public.students (class_name, section_name);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON public.students (roll_number);

-- 5. Staff & User Profiles
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher',
    phone TEXT,
    photo_url TEXT,
    school_id TEXT DEFAULT 'tss-main-school',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Teacher Subject & Class Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT,
    class_name TEXT NOT NULL,
    section_name TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT,
    session_id TEXT,
    school_id TEXT DEFAULT 'tss-main-school',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments (teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_subject ON public.assignments (class_name, section_name, subject_id);

-- 7. Student Marks Entry (Per Exam / Term)
CREATE TABLE IF NOT EXISTS public.marks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT,
    exam_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    class_name TEXT,
    section_name TEXT,
    marks NUMERIC NOT NULL DEFAULT 0,
    max_marks NUMERIC NOT NULL DEFAULT 100,
    theory NUMERIC,
    practical NUMERIC,
    total NUMERIC,
    entered_by TEXT,
    school_id TEXT DEFAULT 'tss-main-school',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_exam_subject UNIQUE (student_id, exam_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_marks_exam_class ON public.marks (exam_id, class_name, section_name);
CREATE INDEX IF NOT EXISTS idx_marks_student ON public.marks (student_id);

-- 8. Final Computed Results (Gazettes & Result Cards)
CREATE TABLE IF NOT EXISTS public.results (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    school_id TEXT DEFAULT 'tss-main-school',
    student_name TEXT,
    roll_number TEXT,
    class_name TEXT,
    section_name TEXT,
    gender TEXT,
    photo_url TEXT,
    subjects JSONB DEFAULT '{}'::jsonb,
    total_obtained NUMERIC DEFAULT 0,
    total_max NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    grade TEXT,
    status TEXT DEFAULT 'Pass',
    remarks TEXT,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_exam_result UNIQUE (student_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_results_exam_class ON public.results (exam_id, class_name, section_name);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results (student_id);

-- 9. Date Sheets
CREATE TABLE IF NOT EXISTS public.date_sheets (
    id TEXT PRIMARY KEY,
    exam_title TEXT,
    class_name TEXT,
    papers JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Seating Plans
CREATE TABLE IF NOT EXISTS public.seating_plans (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    exam_title TEXT,
    room_name TEXT,
    corridor TEXT,
    total_capacity INTEGER,
    columns JSONB DEFAULT '[]'::jsonb,
    school_id TEXT DEFAULT 'tss-main-school',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Grant Access & Setup Permissions
-- ==============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Disable Row Level Security during migration for seamless access
ALTER TABLE public.school_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_sheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_plans DISABLE ROW LEVEL SECURITY;

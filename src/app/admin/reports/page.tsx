'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  ArrowUpRight,
  Loader2,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
} from '@/components/ui/chart';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Pie,
  PieChart,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { Student, Result } from '@/types';
import { motion } from 'framer-motion';
import { getStudents, getResults } from '@/lib/supabase-service';

const COLORS = ['#1B62DE', '#29C4C4', '#F97316', '#8B5CF6', '#EC4899'];

export default function ReportsPage() {
  const { schoolId } = useAuthStore();
  const { settings } = useSchoolStore();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [results, setResults] = React.useState<Result[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [sData, rData] = await Promise.all([
          getStudents(),
          getResults()
        ]);
        setStudents(sData);
        setResults(rData);
      } catch (err) {
        console.error('Failed to load analytics data from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Process data for charts
  const enrollmentData = React.useMemo(() => {
    if (!students || !settings?.classes) return [];
    return settings.classes.map(cls => ({
      name: cls,
      count: students.filter(s => s.class === cls).length
    }));
  }, [students, settings]);

  const performanceData = React.useMemo(() => {
    if (!results) return [];
    const grades = ['A+', 'A', 'B', 'C', 'D', 'F'];
    return grades.map(g => ({
      grade: g,
      students: results.filter(r => r.grade === g).length
    }));
  }, [results]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Aggregating Data Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Institutional Analytics</h1>
          <p className="text-muted-foreground font-medium">Visualized academic performance and enrollment trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full gap-2 border-2 font-bold px-6 h-11 bg-white dark:bg-card dark:text-white dark:border-white/10">
            <Filter className="h-4 w-4" />
            Global Filters
          </Button>
          <Button className="rounded-full shadow-lg h-11 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white">
            Export Gazette
          </Button>
        </div>
      </header>

      {/* High-Level Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-card p-6">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Growth Rate</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-navy-900 dark:text-white">+12%</h3>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Higher than last session
          </p>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-card p-6">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Pass Ratio</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-primary-600 dark:text-primary-400">88.4%</h3>
            <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-card p-6">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Avg Score</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-amber-600 dark:text-amber-400">74.2</h3>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-navy-900 dark:bg-navy-950 text-white p-6">
          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Total Records</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-white">{results?.length || 0}</h3>
            <div className="h-10 w-10 rounded-xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 px-4 sm:px-0">
        {/* Enrollment Chart */}
        <Card className="border-none shadow-card rounded-[2rem] overflow-hidden bg-white dark:bg-card">
          <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
            <CardTitle className="text-xl">Enrollment by Grade</CardTitle>
            <CardDescription>Current student distribution across active classes.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: '#111827', color: '#fff' }}
                    cursor={{ fill: '#f8fafc', opacity: 0.05 }}
                  />
                  <Bar dataKey="count" fill="#1B62DE" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution Chart */}
        <Card className="border-none shadow-card rounded-[2rem] overflow-hidden bg-white dark:bg-card">
          <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
            <CardTitle className="text-xl">Performance Bell Curve</CardTitle>
            <CardDescription>Grade-wise breakdown of computed results.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="students"
                    nameKey="grade"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: '#111827', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} content={<CustomChartLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights Table */}
      <Card className="border-none shadow-card rounded-[2rem] overflow-hidden bg-white dark:bg-card px-4 sm:px-0 mx-4 sm:mx-0">
        <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
          <CardTitle className="text-xl">Subject-Wise Summary</CardTitle>
          <CardDescription>Comparative metrics across active curriculum components.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-white/5">
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Component</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest text-center">Avg Score</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest text-center">Top Score</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {['Mathematics', 'Science', 'English', 'Urdu'].map((sub, i) => (
                  <tr key={sub} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5 font-bold text-navy-900 dark:text-white font-outfit">{sub}</td>
                    <td className="px-8 py-5 text-center">
                       <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-navy-950 border-slate-100 dark:border-white/10 text-primary-600 dark:text-primary-400 font-bold px-3">
                         {70 + (i * 4)}%
                       </Badge>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-navy-900 dark:text-white">98 / 100</td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-1 text-emerald-500 dark:text-emerald-400 font-bold text-xs">
                         <TrendingUp className="h-3 w-3" />
                         +2.5%
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomChartLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
      {['A+', 'A', 'B', 'C', 'D', 'F'].map((g, i) => (
        <div key={g} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{g}</span>
        </div>
      ))}
    </div>
  );
}

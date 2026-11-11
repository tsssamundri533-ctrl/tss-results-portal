
import { Attendance, Student, Exam, SchoolSettings } from '@/types';
import { format } from 'date-fns';
import { PRINT_SHARED_STYLES } from './shared-styles';

/**
 * Attendance Register Template (Portrait A4)
 * High-density proctoring log for official verification.
 */
export async function generateAttendanceReportHtml(
  records: Attendance[], 
  students: Student[], 
  exam: Exam, 
  settings: SchoolSettings,
  date: string,
  className: string,
  inchargeName: string
) {
  const stats = {
    total: students.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
  };

  const rows = students.map((student, idx) => {
    const record = records.find(r => r.studentId === student.id);
    const status = record?.status || '—';
    const time = record?.timestamp ? format(new Date(record.timestamp), 'hh:mm aa') : '—';
    
    return `
      <tr>
        <td style="text-align: center; color: #666;">${idx + 1}</td>
        <td style="font-weight: 900;">${student.rollNumber}</td>
        <td style="text-align: left; font-weight: 800;">${student.name}</td>
        <td style="font-size: 9px; color: #444;">${student.fatherName}</td>
        <td class="status ${status}">${status.toUpperCase()}</td>
        <td style="font-size: 10px; font-weight: 700;">${time}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Register - TSSS</title>
      <style>
        ${PRINT_SHARED_STYLES}
        .wrapper { margin: 10mm; border: 2px solid #000; height: 277mm; display: flex; flex-direction: column; }
        .header { text-align: center; padding: 20px; border-bottom: 2px solid #000; }
        .header h1 { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
        .header p { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-top: 4px; }
        
        .exam-banner { background: #000; color: #fff; padding: 8px; font-weight: 900; text-transform: uppercase; font-size: 14px; margin-top: 10px; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 2px solid #000; }
        .stat-box { padding: 15px; text-align: center; border-right: 1px solid #000; }
        .stat-box:last-child { border-right: none; }
        .stat-box .lbl { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 3px; }
        .stat-box .val { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 900; }

        .table-wrap { flex: 1; padding: 15px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
        th { background: #f5f5f5; padding: 10px 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; border: 1.5px solid #000; text-align: center; }
        td { padding: 8px; border: 1px solid #ccc; text-align: center; font-size: 12px; }
        td.status.present { font-weight: 900; }
        td.status.absent { background: #000; color: #fff; font-weight: 900; }

        .footer { padding: 20px 40px 40px; border-top: 2px solid #000; display: flex; justify-content: space-between; align-items: flex-end; }
        .sig-block { width: 180px; text-align: center; border-top: 2px solid #000; padding-top: 5px; }
        .sig-block span { font-size: 11px; font-weight: 900; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="document-page">
        <div class="wrapper">
          <div class="header">
            <h1>${settings.profile?.schoolName || 'The Spirit School Samundri'}</h1>
            <p>Official Attendance Registry • ${format(new Date(date), 'EEEE, MMM dd, yyyy')}</p>
            <div class="exam-banner">GRADE ${className} — ${exam.title}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-box"><span class="lbl">Total Enrollment</span><div class="val">${stats.total}</div></div>
            <div class="stat-box"><span class="lbl">Verified Present</span><div class="val">${stats.present}</div></div>
            <div class="stat-box"><span class="lbl">Reported Absent</span><div class="val">${stats.absent}</div></div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 35px">#</th>
                  <th style="width: 80px">Roll No</th>
                  <th style="text-align: left">Candidate Name</th>
                  <th>Father's Name</th>
                  <th style="width: 80px">Status</th>
                  <th style="width: 100px">Time Log</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>

          <div class="footer">
            <div class="sig-block"><span>Proctor: ${inchargeName}</span></div>
            <div class="sig-block"><span>Principal / Authorized</span></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}


import QRCode from 'qrcode';
import { format } from 'date-fns';
import { Student, DateSheet, Result, Exam, SchoolSettings, Attendance } from '@/types';

/**
 * Institutional Print Template Engine for The Spirit School Samundri.
 * Meticulously optimized for A4 paper (210mm x 297mm).
 * Adheres to DD-MM-YYYY date format and 3-letter Day format.
 * 
 * RESOLUTION: High-Density Auto-Scaling.
 * As subjects increase, row padding shrinks to prevent footer overflow.
 */

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Outfit:wght@700;900&display=swap');
  
  @media print {
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; background: white !important; }
    .page-break { page-break-after: always; }
  }

  body {
    font-family: 'Inter', sans-serif;
    color: #000000;
    background: #ffffff;
    padding: 0;
    margin: 0;
  }

  .document-page {
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    background: white;
    display: flex; 
    flex-direction: column;
    position: relative;
    box-sizing: border-box;
    overflow: hidden; /* CRITICAL: Prevent 2nd page spill */
  }

  .slip-wrapper {
    margin: 8mm;
    height: 281mm;
    border: 2px solid #000000;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: white;
    justify-content: flex-start;
  }

  .header {
    background: #ffffff;
    color: #000000;
    padding: 10px 25px;
    text-align: center;
    border-bottom: 2px solid #000000;
    flex-shrink: 0;
  }

  .school-logo-wrap {
    width: 45px;
    height: 45px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
  }

  .school-logo-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: grayscale(1);
  }

  .header h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 900;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: -0.5px;
  }

  .header p {
    font-size: 8px;
    margin-top: 2px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #444444;
  }

  .exam-pill {
    background: #000000;
    color: #ffffff;
    display: inline-block;
    padding: 3px 15px;
    border-radius: 4px;
    margin-top: 5px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .content-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 15px 25px;
    box-sizing: border-box;
    gap: 15px;
    min-height: 0;
  }

  .identity-row {
    display: flex;
    gap: 15px;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .info-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .field-box {
    border: 1px solid #000000;
    padding: 6px 10px;
    border-radius: 6px;
  }

  .field-label {
    font-size: 7px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 1px;
    display: block;
    color: #555555;
  }

  .field-value {
    font-size: 12px;
    font-weight: 900;
    font-family: 'Outfit', sans-serif;
    text-transform: uppercase;
  }

  .photo-box {
    width: 80px;
    height: 100px;
    border: 1px solid #000000;
    border-radius: 6px;
    overflow: hidden;
    background: #ffffff;
    flex-shrink: 0;
  }

  .photo-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1);
  }

  .section-header {
    font-size: 12px;
    font-weight: 900;
    font-family: 'Outfit', sans-serif;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    border-bottom: 1.5px solid #000000;
    padding-bottom: 2px;
    flex-shrink: 0;
  }

  .header-bar {
    width: 4px;
    height: 12px;
    background: #000000;
  }

  .timetable-wrap {
    flex: 1; 
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin-bottom: 15px;
  }

  .timetable-table {
    width: 100%;
    border-collapse: collapse;
  }

  .timetable-table th {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    padding: 8px;
    text-align: left;
    border-bottom: 1.5px solid #000000;
  }

  .timetable-table td {
    padding: 11px 8px; /* Managed Density */
    border-bottom: 1px solid #eeeeee;
    font-size: 12px;
    font-weight: 800;
  }

  .timetable-table tr:nth-child(even) {
    background: #fafafa;
  }

  .instructions-box {
    background: #ffffff;
    border: 1.5px solid #000000;
    border-radius: 8px;
    padding: 12px 18px;
    flex-shrink: 0;
  }

  .instruction-row {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
  }

  .instruction-num {
    width: 18px;
    height: 18px;
    background: #000000;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 900;
    flex-shrink: 0;
    border-radius: 3px;
  }

  .footer {
    padding: 20px 40px 30px 40px;
    border-top: 2px solid #000000;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-shrink: 0;
    background: #ffffff;
    margin-top: auto;
  }

  .sig-terminal {
    text-align: center;
    width: 170px;
    border-top: 1.5px solid #000000;
    padding-top: 6px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    position: relative;
  }

  .sig-img {
    position: absolute;
    bottom: 35px;
    left: 50%;
    transform: translateX(-50%);
    height: 50px;
    object-fit: contain;
    filter: grayscale(1);
  }

  .qr-terminal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }

  .qr-terminal img {
    width: 75px; 
    height: 75px;
    border: 2px solid #000000;
    padding: 2px;
    background: white;
  }

  .qr-terminal span {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

export async function generateResultsBatchHtml(results: Result[], students: Student[], exam: Exam, settings: SchoolSettings) {
  const pages = await Promise.all(results.map(async (result) => {
    const student = students.find(s => s.id === result.studentId);
    const qrData = await QRCode.toDataURL(JSON.stringify({ 
      sid: result.studentId, 
      scho: result.schoolId, 
      tok: student?.qrToken 
    }), { margin: 1, scale: 6 });

    return `
      <div class="document-page page-break">
        <div class="slip-wrapper">
          <div class="header">
            <div class="school-logo-wrap">
              <img src="${settings.profile?.logoURL || ''}">
            </div>
            <h1>${settings.profile?.schoolName || 'The Spirit School Samundri'}</h1>
            <p>${settings.profile?.address || 'Samundri'}</p>
            <div class="exam-pill">${exam?.title || 'Examination Cycle'}</div>
          </div>

          <div class="content-body">
            <div class="identity-row">
              <div class="info-grid">
                <div class="field-box">
                  <span class="field-label">Candidate Name</span>
                  <div class="field-value">${result.studentName}</div>
                </div>
                <div class="field-box" style="background: #f8fafc;">
                  <span class="field-label">Roll Number</span>
                  <div class="field-value" style="font-size: 18px;">#${result.rollNumber}</div>
                </div>
                <div class="field-box">
                  <span class="field-label">Class & Section</span>
                  <div class="field-value">${result.className} — ${result.sectionName}</div>
                </div>
                <div class="field-box">
                  <span class="field-label">Father's Name</span>
                  <div class="field-value">${student?.fatherName || '—'}</div>
                </div>
              </div>
              <div class="photo-box">
                <img src="${result.photoURL || 'https://placehold.co/200x250?text=Photo'}">
              </div>
            </div>

            <div class="timetable-wrap">
              <div class="section-header">
                <div class="header-bar"></div>
                Marks Evaluation Matrix
              </div>
              <table class="timetable-table">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Component</th>
                    <th style="text-align: center;">Max</th>
                    <th style="text-align: center;">Obtained</th>
                    <th style="text-align: right;">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(result.subjects).map(([id, sub], idx) => `
                    <tr>
                      <td style="text-align: center; color: #666666; font-size: 10px;">${idx + 1}</td>
                      <td style="font-weight: 800;">${sub.name}</td>
                      <td style="text-align: center;">${sub.maxMarks}</td>
                      <td style="text-align: center; font-weight: 900;">${sub.marks}</td>
                      <td style="text-align: right;">
                        <span style="display: inline-block; width: 35px; border: 1.5px solid #000000; text-align: center; font-weight: 900; border-radius: 4px; background: white; font-size: 12px;">${sub.grade}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex-shrink: 0; margin-top: 10px;">
               <div class="field-box" style="text-align: center;">
                  <span class="field-label">Percentage</span>
                  <div class="field-value">${result.percentage}%</div>
               </div>
               <div class="field-box" style="text-align: center; background: #000000; color: white;">
                  <span class="field-label" style="color: #cccccc;">Status</span>
                  <div class="field-value" style="color: white;">${result.status.toUpperCase()}</div>
               </div>
               <div class="field-box" style="text-align: center;">
                  <span class="field-label">Final Grade</span>
                  <div class="field-value">${result.grade}</div>
               </div>
            </div>

            <div class="instructions-box" style="margin-top: 10px;">
               <span class="field-label" style="margin-bottom: 4px;">Institutional Remarks</span>
               <p style="font-size: 13px; font-weight: 700; margin: 0; font-style: italic;">"${result.remarks}"</p>
            </div>
          </div>

          <div class="footer">
            <div class="sig-terminal">Class Incharge</div>
            <div class="qr-terminal">
              <img src="${qrData}">
              <span>Verified Identity</span>
            </div>
            <div class="sig-terminal">
              ${settings.profile?.principalSignatureURL ? `<img src="${settings.profile.principalSignatureURL}" class="sig-img">` : ''}
              Principal Signature
            </div>
          </div>
        </div>
      </div>
    `;
  }));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Batch Results - The Spirit School Samundri</title>
      <style>${SHARED_STYLES}</style>
    </head>
    <body>
      ${pages.join('')}
    </body>
    </html>
  `;
}

export async function generateSlipsHtml(students: Student[], dateSheet: DateSheet, settings: SchoolSettings) {
  const slips = await Promise.all(students.map(async (student) => {
    const qrToken = await QRCode.toDataURL(JSON.stringify({ 
      sid: student.id, 
      scho: student.schoolId, 
      tok: student.qrToken 
    }), { margin: 1, scale: 6 });

    const instructions = [
      "Bring this <b>Admit Card</b> and valid <b>School ID</b> daily. Entry is restricted without these.",
      "Report to the exam hall <b>30 minutes before</b> start time. Late entry is not permitted.",
      "Use of <b>mobile phones, smartwatches, or calculators</b> is strictly forbidden.",
      "Sharing stationery is not allowed. Maintain <b>complete silence</b> and discipline in the hall.",
      "Mark your <b>Roll Number</b> clearly on the answer sheet. Errors may lead to cancellation."
    ];

    const paperRows = (dateSheet?.papers || []).slice(0, 12);
    
    return `
      <div class="document-page page-break">
        <div class="slip-wrapper">
          <div class="header">
            <div class="school-logo-wrap">
              <img src="${settings.profile?.logoURL || ''}">
            </div>
            <h1>${settings.profile?.schoolName || 'The Spirit School Samundri'}</h1>
            <p>Session • ${settings.activeSession?.title || '2026'}</p>
            <div class="exam-pill">${dateSheet?.examTitle || 'Examination Slip'}</div>
          </div>

          <div class="content-body">
            <div class="identity-row">
              <div class="info-grid">
                <div class="field-box">
                  <span class="field-label">Candidate Name</span>
                  <div class="field-value">${student.name}</div>
                </div>
                <div class="field-box" style="background: #f8fafc; border-width: 1.5px;">
                  <span class="field-label">Institutional Roll No.</span>
                  <div class="field-value" style="font-size: 18px;">#${student.rollNumber}</div>
                </div>
                <div class="field-box">
                  <span class="field-label">Grade & Section</span>
                  <div class="field-value">${student.class} — ${student.section}</div>
                </div>
                <div class="field-box">
                  <span class="field-label">Father's Name</span>
                  <div class="field-value">${student.fatherName}</div>
                </div>
              </div>
              <div class="photo-box">
                ${student.photoURL ? `<img src="${student.photoURL}">` : `<div style="text-align: center; color: #000000; font-weight: 900; font-size: 10px; padding: 35px 10px;">AFFIX<br>ID PHOTO</div>`}
              </div>
            </div>

            <div class="timetable-wrap">
              <div class="section-header">
                <div class="header-bar"></div>
                Assessment Timetable
              </div>
              <table class="timetable-table">
                <thead>
                  <tr>
                    <th style="width: 35px; text-align: center;">#</th>
                    <th>Component</th>
                    <th style="width: 110px;">Date</th>
                    <th style="width: 60px;">Day</th>
                    <th style="width: 90px;">Reporting</th>
                    <th style="width: 90px; text-align: right;">Start</th>
                  </tr>
                </thead>
                <tbody>
                  ${paperRows.map((p, idx) => {
                    const paperDate = p.date ? new Date(p.date) : null;
                    return `
                      <tr>
                        <td style="text-align: center; color: #666666; font-size: 11px;">${idx + 1}</td>
                        <td style="font-weight: 900;">${p.subjectName}</td>
                        <td style="white-space: nowrap;">${paperDate ? format(paperDate, 'dd-MM-yyyy') : '—'}</td>
                        <td style="font-size: 11px;">${paperDate ? format(paperDate, 'EEE') : '—'}</td>
                        <td style="font-size: 10px; color: #444;">${p.reportingTime || '08:30 AM'}</td>
                        <td style="text-align: right; font-weight: 900;">${p.startTime || '09:00 AM'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="protocols-terminal" style="flex-shrink: 0; margin-top: 20px;">
              <div class="section-header">
                <div class="header-bar"></div>
                Proctoring Protocols
              </div>
              <div class="instructions-box">
                ${instructions.map((inst, i) => `
                  <div class="instruction-row">
                    <div class="instruction-num">${i+1}</div>
                    <span>${inst}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="sig-terminal">Candidate Signature</div>
            <div class="qr-terminal">
              <img src="${qrToken}">
              <span>Identity Verified</span>
            </div>
            <div class="sig-terminal">
              ${settings.profile?.principalSignatureURL ? `<img src="${settings.profile.principalSignatureURL}" class="sig-img">` : ''}
              Principal Signature
            </div>
          </div>
        </div>
      </div>
    `;
  }));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admit Cards - The Spirit School Samundri</title>
      <style>${SHARED_STYLES}</style>
    </head>
    <body>
      ${slips.join('')}
    </body>
    </html>
  `;
}

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
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 900;">${student.rollNumber}</td>
        <td style="font-weight: 700;">${student.name}</td>
        <td style="color: #333333;">${student.fatherName}</td>
        <td style="text-align: center; font-weight: 900; background: ${status === 'absent' ? '#000000' : 'transparent'}; color: ${status === 'absent' ? '#ffffff' : '#000000'};">
          ${status.toUpperCase()}
        </td>
        <td style="text-align: center; font-size: 10px;">${time}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Register - The Spirit School Samundri</title>
      <style>${SHARED_STYLES}</style>
    </head>
    <body>
      <div class="document-page">
        <div class="slip-wrapper" style="border-width: 1.5px; margin: 0; height: 100%; border-radius: 0;">
          <div class="header" style="border-bottom-width: 1.5px;">
            <h1>${settings.profile?.schoolName || 'The Spirit School Samundri'}</h1>
            <p>Official Attendance Register • ${format(new Date(date), 'EEEE, MMM dd, yyyy')}</p>
            <div class="exam-pill">Grade ${className} — ${exam.title}</div>
          </div>

          <div class="content-body" style="justify-content: flex-start; gap: 15px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex-shrink: 0;">
               <div class="field-box" style="text-align: center;">
                  <span class="field-label">Verified Present</span>
                  <div class="field-value" style="font-size: 18px;">${stats.present}</div>
               </div>
               <div class="field-box" style="text-align: center; background: #000000; color: white;">
                  <span class="field-label" style="color: #cccccc;">Reported Absent</span>
                  <div class="field-value" style="font-size: 18px; color: white;">${stats.absent}</div>
               </div>
               <div class="field-box" style="text-align: center;">
                  <span class="field-label">Enrollment Rate</span>
                  <div class="field-value" style="font-size: 18px;">${Math.round((stats.present / stats.total) * 100)}%</div>
               </div>
            </div>

            <div class="timetable-wrap">
              <table class="timetable-table">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th style="width: 80px;">Roll No</th>
                    <th>Candidate</th>
                    <th>Father's Name</th>
                    <th style="width: 80px; text-align: center;">Status</th>
                    <th style="width: 80px; text-align: center;">Log</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>

            <div class="instructions-box" style="margin-top: auto; flex-shrink: 0;">
               <span class="field-label">Designated Proctor</span>
               <p style="font-size: 14px; font-weight: 900; color: #000000;">${inchargeName}</p>
            </div>
          </div>

          <div class="footer" style="padding-bottom: 20px;">
            <div class="sig-terminal">Incharge Signature</div>
            <div class="sig-terminal">
              ${settings.profile?.principalSignatureURL ? `<img src="${settings.profile.principalSignatureURL}" class="sig-img">` : ''}
              Principal / Seal
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

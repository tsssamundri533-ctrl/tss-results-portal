import QRCode from 'qrcode';
import { format, parseISO } from 'date-fns';
import { Student, DateSheet, SchoolSettings } from '@/types';
import { PRINT_SHARED_STYLES } from './shared-styles';

const TSS_LOGO_FALLBACK = "https://i.postimg.cc/8PSpzG5K/tss-logo.png";
const MALE_AVATAR = "https://i.postimg.cc/x1BZ31bs/male.png";
const FEMALE_AVATAR = "https://i.postimg.cc/7hgPwR8W/1487318.png";

function formatDisplayDate(dateStr?: string): { date: string; day: string } {
  if (!dateStr || dateStr.trim() === '' || dateStr === '—') {
    return { date: '—', day: '—' };
  }
  try {
    const d = dateStr.includes('T') ? new Date(dateStr) : parseISO(dateStr);
    if (isNaN(d.getTime())) {
      return { date: dateStr, day: '—' };
    }
    return {
      date: format(d, 'dd-MM-yyyy'),
      day: format(d, 'EEE')
    };
  } catch {
    return { date: dateStr, day: '—' };
  }
}

/**
 * High-Density Single-Page Roll Number Slip (Admit Card) Template
 * Designed for The Spirit School Samundri.
 * Strict Single A4 Portrait Page Fit with 9-Row Date Sheet Table,
 * Official Royal Navy (#0f2a4a) and Crimson Red (#dc2626) branding,
 * Multi-tier executive header with verified contact details,
 * Spacious date sheet rows, generously spaced instructions,
 * and simplified, student-friendly school terminology.
 */
export async function generateSlipsHtml(students: Student[], dateSheet: DateSheet, settings: SchoolSettings) {
  const slips = await Promise.all(students.map(async (student) => {
    const qrToken = await QRCode.toDataURL(JSON.stringify({ 
      sid: student.id, 
      scho: student.schoolId, 
      tok: student.qrToken 
    }), { 
      margin: 1, 
      scale: 6,
      color: {
        dark: '#0f2a4a',
        light: '#ffffff'
      }
    });

    // Force 9 rows minimum to fill the vertical space balanced and elegantly
    const papers = dateSheet?.papers || [];
    const displayRows = [...papers];
    while (displayRows.length < 9) {
      displayRows.push({ subjectName: '—', date: '', reportingTime: '', startTime: '' } as any);
    }

    const defaultAvatar = (student.gender?.toLowerCase() === 'female') ? FEMALE_AVATAR : MALE_AVATAR;
    const photoUrl = student.photoURL || defaultAvatar;
    const logoUrl = settings.profile?.logoURL || TSS_LOGO_FALLBACK;
    
    // Clean school name to eliminate any duplicate "SAMUNDRI CAMPUS"
    let rawSchoolName = settings.profile?.schoolName || 'THE SPIRIT SCHOOL';
    const cleanSchoolName = rawSchoolName
      .replace(/\s*SAMUNDRI\s*CAMPUS\s*/gi, '')
      .replace(/\s*SAMUNDRI\s*/gi, '')
      .trim() || 'THE SPIRIT SCHOOL';

    const rawExamTitle = (dateSheet?.examTitle || '').trim();
    const examTitle = rawExamTitle
      ? (rawExamTitle.toUpperCase().includes('EXAM') ? rawExamTitle.toUpperCase() : `${rawExamTitle.toUpperCase()} EXAMINATION`)
      : 'EXAMINATION 2026';
    const sessionTitle = settings.activeSession?.title || '2026';
    const phone = settings.profile?.phone || '0333-9114333 | 0345-9114333';
    const email = settings.profile?.email || 'tss.samundri@gmail.com';
    const address = settings.profile?.address || 'Housing Colony #2 Samundri';

    return `
      <div class="document-page page-break">
        <div class="card-border">
          <!-- Institutional Header -->
          <div class="header">
            <div class="logo-box">
              <img src="${logoUrl}" alt="School Logo">
            </div>
            <div class="school-title-row">
              <h1 class="school-name">${cleanSchoolName}</h1>
              <span class="campus-badge">SAMUNDRI CAMPUS</span>
            </div>
            <div class="title-underline"></div>
            <p class="address-line">${address}</p>
            <div class="contact-line">
              <span>📞 ${phone}</span>
              <span class="sep">•</span>
              <span>✉ ${email}</span>
            </div>
            <p class="session-lbl">ACADEMIC SESSION: ${sessionTitle}</p>
            
            <!-- Executive 2-Tier Exam Banner -->
            <div class="exam-banner">
              <div class="exam-banner-main">ROLL NUMBER SLIP</div>
              <div class="exam-banner-sub">${examTitle}</div>
            </div>
          </div>

          <!-- Identity Grid (4-Box Layout + Student Photo) -->
          <div class="id-grid">
            <div class="id-col">
              <div class="id-box">
                <span class="id-lbl">STUDENT NAME</span>
                <span class="id-val">${student.name}</span>
              </div>
              <div class="id-box">
                <span class="id-lbl">CLASS & SECTION</span>
                <span class="id-val">${student.class} — ${student.section}</span>
              </div>
            </div>
            <div class="id-col">
              <div class="id-box highlight-box">
                <span class="id-lbl highlight-lbl">ROLL NUMBER</span>
                <span class="id-val highlight-val">#${student.rollNumber}</span>
              </div>
              <div class="id-box">
                <span class="id-lbl">FATHER'S NAME</span>
                <span class="id-val">${student.fatherName || '—'}</span>
              </div>
            </div>
            <div class="photo-box">
              <img src="${photoUrl}" alt="Student Photo">
            </div>
          </div>

          <!-- Examination Date Sheet (9 Rows Fixed Single-Page Matrix) -->
          <div class="section-title">
            <div class="bar"></div>
            EXAMINATION DATE SHEET
          </div>

          <div class="timetable-container">
            <table class="tt-table">
              <thead>
                <tr>
                  <th style="width: 45px;">SR #</th>
                  <th style="text-align: left; padding-left: 14px;">SUBJECT NAME</th>
                  <th style="width: 105px;">DATE</th>
                  <th style="width: 65px;">DAY</th>
                  <th style="width: 115px;">REPORTING TIME</th>
                  <th style="width: 105px; text-align: right; padding-right: 14px;">START TIME</th>
                </tr>
              </thead>
              <tbody>
                ${displayRows.map((p, idx) => {
                  const dInfo = formatDisplayDate(p.date);
                  return `
                    <tr class="${p.subjectName === '—' ? 'empty-row' : ''}">
                      <td>${idx + 1}</td>
                      <td class="subj-cell">${p.subjectName}</td>
                      <td>${dInfo.date}</td>
                      <td>${dInfo.day}</td>
                      <td style="color: #475569; font-weight: 600;">${p.reportingTime || '—'}</td>
                      <td class="start-time-cell">${p.startTime || '—'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Important Instructions for Students -->
          <div class="section-title" style="margin-top: 10px;">
            <div class="bar"></div>
            IMPORTANT INSTRUCTIONS FOR STUDENTS
          </div>

          <div class="protocol-box">
            <div class="p-row">
              <div class="p-num">1</div>
              <span>Bring this <b>Roll Number Slip</b> and your <b>School ID Card</b> to the examination hall every day.</span>
            </div>
            <div class="p-row">
              <div class="p-num">2</div>
              <span>Arrive at the examination hall at least <b>15 to 20 minutes before</b> the paper starting time.</span>
            </div>
            <div class="p-row">
              <div class="p-num">3</div>
              <span>Mobile phones, smartwatches, and unauthorized books or notes are <b>strictly prohibited</b>.</span>
            </div>
            <div class="p-row">
              <div class="p-num">4</div>
              <span>Bring your own stationery (pens, pencils, eraser, ruler). <b>Borrowing or sharing is not allowed</b>.</span>
            </div>
            <div class="p-row">
              <div class="p-num">5</div>
              <span>Write your <b>Roll Number, Name, and Class</b> clearly on your answer sheet before writing answers.</span>
            </div>
          </div>

          <!-- Authentication Footer -->
          <div class="footer">
            <div class="sig-block">
               <div class="sig-line"></div>
               <span>STUDENT'S SIGNATURE</span>
            </div>
            <div class="qr-block">
               <img src="${qrToken}" alt="Verification QR">
               <span>OFFICIAL VERIFICATION</span>
            </div>
            <div class="sig-block">
               ${settings.profile?.principalSignatureURL ? `<img src="${settings.profile.principalSignatureURL}" class="sig-img" alt="Principal Signature">` : ''}
               <div class="sig-line"></div>
               <span>PRINCIPAL'S SIGNATURE</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Roll Number Slips - The Spirit School</title>
      <style>
        ${PRINT_SHARED_STYLES}
        :root {
          --navy: #0f2a4a;
          --navy-light: #1e3a8a;
          --crimson: #dc2626;
          --text: #0f172a;
          --text-muted: #475569;
          --border-dark: #0f2a4a;
          --border-gray: #cbd5e1;
        }

        .card-border { 
          margin: 6mm; 
          border: 2px solid var(--navy); 
          border-radius: 8px;
          height: 283mm; 
          display: flex; 
          flex-direction: column; 
          padding: 5mm 8mm 4mm 8mm; 
          position: relative; 
          box-sizing: border-box;
          background: #ffffff;
        }
        
        /* Header */
        .header { 
          text-align: center; 
          margin-bottom: 7px; 
          flex-shrink: 0; 
        }
        .logo-box { 
          width: 46px; 
          height: 46px; 
          margin: 0 auto 3px; 
        }
        .logo-box img { 
          width: 100%; 
          height: 100%; 
          object-fit: contain; 
        }
        .school-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .school-name { 
          font-family: 'Outfit', sans-serif; 
          font-size: 23px; 
          font-weight: 900; 
          text-transform: uppercase; 
          margin: 0; 
          letter-spacing: 0.02em; 
          color: var(--navy);
          line-height: 1.1;
        }
        .campus-badge {
          background: var(--crimson);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 2.5px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .title-underline {
          height: 2px;
          background: var(--navy);
          margin: 3px auto 4px auto;
          width: 75%;
        }
        .address-line {
          font-size: 11.5px;
          font-weight: 700;
          color: #1e293b;
          margin: 1px 0;
          line-height: 1.2;
        }
        .contact-line {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 2px 0;
          line-height: 1.2;
        }
        .contact-line .sep {
          color: #94a3b8;
        }
        .session-lbl { 
          font-size: 10px; 
          font-weight: 800; 
          color: var(--navy); 
          text-transform: uppercase; 
          letter-spacing: 0.8px; 
          margin: 2px 0 5px 0;
        }

        /* Executive 2-Tier Exam Banner */
        .exam-banner {
          background: var(--navy);
          color: #ffffff;
          border-radius: 6px;
          padding: 5px 14px 6px;
          margin: 2px 0 6px 0;
          text-align: center;
          box-shadow: 0 2px 4px rgba(15, 42, 74, 0.12);
        }
        .exam-banner-main {
          font-family: 'Outfit', sans-serif;
          font-size: 14.5px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #ffffff;
          line-height: 1.15;
        }
        .exam-banner-sub {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #93c5fd;
          margin-top: 2px;
          line-height: 1.15;
        }

        /* Identity Matrix (4-Box Grid) */
        .id-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr 105px; 
          gap: 8px; 
          margin-bottom: 9px; 
          flex-shrink: 0; 
        }
        .id-box { 
          border: 1.5px solid var(--navy); 
          border-radius: 6px; 
          padding: 5px 12px; 
          display: flex; 
          flex-direction: column; 
          gap: 1.5px; 
          margin-bottom: 5px; 
          background: #ffffff;
        }
        .id-box.highlight-box {
          background: #f8fafc;
          border: 1.5px solid var(--navy);
        }
        .id-lbl { 
          font-size: 8px; 
          font-weight: 800; 
          color: var(--navy); 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }
        .id-lbl.highlight-lbl {
          color: var(--navy);
        }
        .id-val { 
          font-family: 'Outfit', sans-serif; 
          font-size: 14px; 
          font-weight: 800; 
          text-transform: uppercase; 
          color: var(--text); 
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .id-val.highlight-val { 
          font-size: 17.5px; 
          font-weight: 900; 
          color: var(--navy); 
        }
        
        .photo-box { 
          width: 105px; 
          height: 118px; 
          border: 1.5px solid var(--navy); 
          border-radius: 6px; 
          overflow: hidden; 
          background: #f8fafc; 
          flex-shrink: 0; 
          box-shadow: 0 1px 3px rgba(15, 42, 74, 0.08);
        }
        .photo-box img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          display: block;
        }

        /* Section Title */
        .section-title { 
          font-family: 'Outfit', sans-serif; 
          font-size: 13px; 
          font-weight: 900; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          margin-bottom: 7px; 
          text-transform: uppercase; 
          color: var(--navy); 
          flex-shrink: 0; 
          letter-spacing: 0.5px;
        }
        .section-title .bar { 
          width: 4px; 
          height: 15px; 
          background: var(--crimson); 
          border-radius: 2px;
        }

        /* Timetable Table - Comfortably Spaced Rows */
        .timetable-container { 
          margin-bottom: 10px; 
          flex-shrink: 0; 
        }
        .tt-table { 
          width: 100%; 
          border-collapse: collapse; 
          border: 1.5px solid var(--navy);
        }
        .tt-table th { 
          background: var(--navy);
          color: #ffffff;
          padding: 6.5px 6px; 
          font-size: 9.5px; 
          font-weight: 800; 
          text-transform: uppercase; 
          text-align: center; 
          letter-spacing: 0.5px;
          border: 1px solid var(--navy);
        }
        .tt-table td { 
          padding: 0 8px; 
          border: 1px solid var(--border-gray); 
          text-align: center; 
          font-size: 12.5px; 
          font-weight: 700; 
          height: 11mm; 
          color: var(--text);
        }
        .tt-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .tt-table td.subj-cell {
          text-align: left;
          font-weight: 800;
          color: var(--navy);
          padding-left: 14px;
          text-transform: uppercase;
        }
        .tt-table td.start-time-cell {
          text-align: right;
          padding-right: 14px;
          font-weight: 800;
          color: var(--navy);
        }
        .tt-table tr.empty-row td { 
          color: #cbd5e1; 
          font-style: italic; 
          font-weight: 400; 
        }

        /* Instructions Protocol Box - Spacious & Highly Legible */
        .protocol-box { 
          border: 1.5px solid var(--navy); 
          border-radius: 8px; 
          padding: 10px 18px; 
          display: flex; 
          flex-direction: column; 
          gap: 7.5px; 
          margin-bottom: 12px; 
          flex-shrink: 0; 
          background: #fafafa;
        }
        .p-row { 
          display: flex; 
          gap: 11px; 
          align-items: center; 
          font-size: 12px; 
          font-weight: 600; 
          line-height: 1.45; 
          color: #1e293b;
        }
        .p-row b {
          color: var(--navy);
          font-weight: 700;
        }
        .p-num { 
          width: 21px; 
          height: 21px; 
          background: var(--navy); 
          color: #ffffff; 
          border-radius: 4px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 10.5px; 
          font-weight: 800; 
          flex-shrink: 0; 
        }

        /* Footer */
        .footer { 
          margin-top: auto; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
          padding: 6px 6px 0; 
          flex-shrink: 0; 
        }
        .sig-block { 
          text-align: center; 
          width: 180px; 
          position: relative; 
        }
        .sig-line { 
          border-top: 1.5px solid var(--navy); 
          margin-bottom: 5px; 
        }
        .sig-block span { 
          font-size: 9.5px; 
          font-weight: 800; 
          color: var(--navy); 
          letter-spacing: 0.5px; 
          text-transform: uppercase; 
        }
        .sig-img { 
          position: absolute; 
          bottom: 22px; 
          left: 50%; 
          transform: translateX(-50%); 
          height: 46px; 
          object-fit: contain; 
        }
        .qr-block { 
          text-align: center; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 2.5px; 
        }
        .qr-block img { 
          width: 58px; 
          height: 58px; 
          border: 1.5px solid var(--navy); 
          padding: 1px; 
          background: #fff; 
          border-radius: 4px;
        }
        .qr-block span { 
          font-size: 7.5px; 
          font-weight: 800; 
          color: var(--navy); 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      ${slips.join('')}
    </body>
    </html>
  `;
}

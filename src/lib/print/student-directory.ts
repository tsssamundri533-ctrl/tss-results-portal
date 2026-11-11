import { Student, SchoolSettings } from '@/types';
import { format } from 'date-fns';

const MALE_AVATAR = "https://i.postimg.cc/x1BZ31bs/male.png";
const FEMALE_AVATAR = "https://i.postimg.cc/7hgPwR8W/1487318.png";
const TSS_LOGO_FALLBACK = "https://res.cloudinary.com/dc4h1odcj/image/upload/v1740643729/tsss/Logo.png";

export interface StudentDirectoryOptions {
  className?: string;
  sectionName?: string;
  searchTerm?: string;
}

/**
 * Generates an executive, institutional Student Enrollment & Verification Directory.
 * Formatted for A4 printing with automatic page separation per class (each class begins on a new page).
 * Includes student photos, roll numbers, names, fathers, class, section, and verification signatures.
 */
export async function generateStudentDirectoryHtml(
  students: Student[],
  settings: SchoolSettings,
  options?: StudentDirectoryOptions
): Promise<string> {
  const logoUrl = settings?.profile?.logoURL || TSS_LOGO_FALLBACK;
  const rawSchoolName = settings?.profile?.schoolName || 'THE SPIRIT SCHOOL';
  const cleanSchoolName = rawSchoolName
    .replace(/\s*SAMUNDRI\s*CAMPUS\s*/gi, '')
    .replace(/\s*SAMUNDRI\s*/gi, '')
    .trim() || 'THE SPIRIT SCHOOL';

  const sessionTitle = settings?.activeSession?.title || '2026';
  const phone = settings?.profile?.phone || '0333-9114333 | 0345-9114333';
  const address = settings?.profile?.address || 'Housing Colony #2 Samundri';
  const generationDate = format(new Date(), 'dd MMMM yyyy, hh:mm a');

  const filterClass = options?.className || 'all';
  const filterSection = options?.sectionName || 'all';

  // Sort students: by class order then by roll number numerically
  const classOrderMap: Record<string, number> = {};
  (settings?.classes || []).forEach((c, idx) => {
    classOrderMap[c.toLowerCase().trim()] = idx;
  });

  const sortedStudents = [...students].sort((a, b) => {
    const classA = (a.class || '').toLowerCase().trim();
    const classB = (b.class || '').toLowerCase().trim();
    const orderA = classOrderMap[classA] ?? 999;
    const orderB = classOrderMap[classB] ?? 999;
    if (orderA !== orderB) return orderA - orderB;

    const rollA = parseInt(a.rollNumber || '0', 10);
    const rollB = parseInt(b.rollNumber || '0', 10);
    if (!isNaN(rollA) && !isNaN(rollB) && rollA !== rollB) return rollA - rollB;

    return (a.name || '').localeCompare(b.name || '');
  });

  // Group by class so each class has its own separate page(s)
  const isGroupedByClass = filterClass === 'all';
  const groupedStudents: { className: string; list: Student[] }[] = [];

  if (isGroupedByClass) {
    const groups: Record<string, Student[]> = {};
    sortedStudents.forEach(s => {
      const c = (s.class || 'Unassigned').trim();
      if (!groups[c]) groups[c] = [];
      groups[c].push(s);
    });

    const groupKeys = Object.keys(groups).sort((a, b) => {
      const orderA = classOrderMap[a.toLowerCase().trim()] ?? 999;
      const orderB = classOrderMap[b.toLowerCase().trim()] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });

    groupKeys.forEach(c => {
      groupedStudents.push({ className: c, list: groups[c] });
    });
  } else {
    groupedStudents.push({ className: filterClass, list: sortedStudents });
  }

  // Generate distinct sheets for each class (each starts on a new page)
  const classSheetsHtml = groupedStudents.map((group, groupIdx) => {
    let classSr = 0;
    const isFirstClass = groupIdx === 0;

    const classScopeLabel = filterClass === 'all'
      ? `CLASS: ${group.className.toUpperCase()} • ENROLLMENT: ${group.list.length} STUDENTS`
      : filterSection === 'all'
      ? `CLASS: ${group.className.toUpperCase()} • ALL SECTIONS (${group.list.length} STUDENTS)`
      : `CLASS: ${group.className.toUpperCase()} • SECTION: ${filterSection.toUpperCase()} (${group.list.length} STUDENTS)`;

    const studentRows = group.list.map((s) => {
      classSr++;
      const defaultAvatar = (s.gender?.toLowerCase() === 'female') ? FEMALE_AVATAR : MALE_AVATAR;
      const photoSrc = s.photoURL || defaultAvatar;

      return `
        <tr class="student-row">
          <td class="text-center font-bold sr-cell">${classSr}</td>
          <td class="text-center photo-cell">
            <div class="photo-wrapper">
              <img src="${photoSrc}" alt="${s.name}" onerror="this.src='${defaultAvatar}'" />
            </div>
          </td>
          <td class="text-center roll-cell font-mono">${s.rollNumber || '—'}</td>
          <td class="name-cell">
            <div class="student-name">${s.name}</div>
          </td>
          <td class="father-cell">${s.fatherName || '—'}</td>
          <td class="text-center class-cell">${s.class || group.className}</td>
          <td class="text-center section-cell font-bold">${s.section || '—'}</td>
          <td class="text-center gender-cell">${(s.gender || 'male').toUpperCase()}</td>
          <td class="verify-cell">
            <div class="verify-box">
              <span class="checkbox-sq">☐</span>
              <span class="verify-line"></span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- CLASS SHEET: ${group.className} -->
      <div class="report-sheet ${!isFirstClass ? 'page-break-before' : ''}">
        
        <!-- Screen Class Indicator -->
        <div class="no-print screen-class-tag">
          <span>★ ${group.className.toUpperCase()}</span>
          <span>${group.list.length} Students • Class ${groupIdx + 1} of ${groupedStudents.length}</span>
        </div>

        <!-- Institutional Header -->
        <div class="inst-header">
          <div class="logo-box">
            <img src="${logoUrl}" alt="School Crest" />
          </div>
          <div class="inst-text">
            <h1 class="inst-name">${cleanSchoolName} <span class="campus-pill">SAMUNDRI CAMPUS</span></h1>
            <p class="inst-address">${address} • Ph: ${phone}</p>
            <h2 class="inst-title">STUDENT ENROLLMENT & VERIFICATION DIRECTORY</h2>
          </div>
          <div class="meta-box">
            <div><b>Class:</b> <span class="meta-class-highlight">${group.className.toUpperCase()}</span></div>
            <div><b>Session:</b> ${sessionTitle}</div>
            <div><b>Strength:</b> ${group.list.length} Candidates</div>
            <div><b>Printed:</b> ${generationDate}</div>
          </div>
        </div>

        <!-- Scope Banner -->
        <div class="scope-banner">
          <span class="scope-title">★ ${classScopeLabel}</span>
          <span class="scope-date">Official Campus Record • Verification Register</span>
        </div>

        <!-- Directory Table -->
        <table class="dir-table">
          <thead>
            <tr>
              <th style="width: 32px;">#</th>
              <th style="width: 44px;">Photo</th>
              <th style="width: 65px;">Roll No</th>
              <th class="text-left">Candidate Name</th>
              <th class="text-left" style="width: 140px;">Father's Name</th>
              <th style="width: 75px;">Grade</th>
              <th style="width: 50px;">Section</th>
              <th style="width: 60px;">Gender</th>
              <th style="width: 100px;">Verification / Sign</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows}
          </tbody>
        </table>

        <!-- Signatures & Certification Area -->
        <div class="signatures-area">
          <div class="sig-col">
            <div class="sig-line"></div>
            <div class="sig-title">Class Incharge</div>
            <div class="sig-subtitle">Data Verification Officer</div>
          </div>

          <div class="sig-col">
            <div class="sig-line"></div>
            <div class="sig-title">Examination Controller</div>
            <div class="sig-subtitle">Academic Terminal Incharge</div>
          </div>

          <div class="sig-col">
            <div class="sig-line"></div>
            <div class="sig-title">Principal's Signature</div>
            <div class="sig-subtitle">Institutional Seal & Stamp</div>
          </div>
        </div>

        <p class="cert-statement">
          Certified that all photographs, registration names, father names, and class allocations for <b>${group.className}</b> have been cross-checked with the official Admission & Withdrawal Register (AWR).
        </p>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Student Directory & Verification - The Spirit School</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap');

        @page {
          size: A4 portrait;
          margin: 10mm 10mm 12mm 10mm;
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 8pt;
            font-family: 'Inter', sans-serif;
            color: #64748b;
          }
        }

        @media print {
          html, body { 
            background: #ffffff !important; 
            margin: 0 !important; 
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { 
            display: none !important; 
          }
          .page-break-before { 
            page-break-before: always !important; 
            break-before: page !important;
          }
          .page-break-after { 
            page-break-after: always !important; 
            break-after: page !important;
          }
          .page-break-avoid { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
          }
          thead { 
            display: table-header-group; 
          }
          tfoot { 
            display: table-footer-group; 
          }
          tr { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
          }
          .report-sheet {
            max-width: 100% !important;
            margin: 0 0 0 0 !important;
            padding: 0 0 0 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: auto;
          }
          .report-sheet.page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .signatures-area {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0b192c;
          color: #0f172a;
          line-height: 1.3;
          font-size: 11px;
          padding-bottom: 40px;
        }

        /* Screen-Only Control Bar */
        .no-print.control-bar {
          position: sticky;
          top: 0;
          background: #0f2a4a;
          color: #ffffff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .control-bar h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .control-bar .actions {
          display: flex;
          gap: 12px;
        }
        .btn {
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-print {
          background: #2563eb;
          color: white;
          box-shadow: 0 2px 8px rgba(37,99,235,0.4);
        }
        .btn-print:hover { background: #1d4ed8; }
        .btn-close {
          background: #334155;
          color: white;
        }
        .btn-close:hover { background: #475569; }

        /* Screen Class Tag */
        .screen-class-tag {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f2a4a;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 6px 6px 0 0;
          margin: -12mm -10mm 14px -10mm;
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #be123c;
        }

        /* Document Container */
        .report-sheet {
          max-width: 210mm;
          margin: 24px auto;
          background: #ffffff;
          padding: 12mm 10mm;
          box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          border-radius: 6px;
          position: relative;
        }

        /* Institutional Header */
        .inst-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2.5px solid #0f2a4a;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .logo-box {
          width: 65px;
          height: 65px;
          flex-shrink: 0;
        }
        .logo-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .inst-text {
          flex: 1;
          text-align: center;
          padding: 0 15px;
        }
        .inst-name {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 900;
          color: #0f2a4a;
          text-transform: uppercase;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .campus-pill {
          display: inline-block;
          background: #be123c;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          padding: 1.5px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          margin-left: 6px;
          vertical-align: middle;
        }
        .inst-address {
          font-size: 9.5px;
          font-weight: 600;
          color: #475569;
          margin-top: 3px;
        }
        .inst-title {
          font-family: 'Outfit', sans-serif;
          font-size: 13.5px;
          font-weight: 800;
          color: #0f2a4a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        .meta-box {
          text-align: right;
          font-size: 9px;
          color: #475569;
          line-height: 1.4;
          flex-shrink: 0;
        }
        .meta-box b {
          color: #0f2a4a;
        }
        .meta-class-highlight {
          background: #0f2a4a;
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
          font-size: 9.5px;
          display: inline-block;
        }

        /* Scope Banner */
        .scope-banner {
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-left: 5px solid #0f2a4a;
          padding: 6px 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 4px;
        }
        .scope-title {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 800;
          color: #0f2a4a;
          letter-spacing: 0.5px;
        }
        .scope-date {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
        }

        /* Directory Table */
        table.dir-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          border: 1.5px solid #0f2a4a;
        }

        table.dir-table thead th {
          background: #0f2a4a;
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 7px 5px;
          border: 1px solid #1e3a8a;
          text-align: center;
        }

        table.dir-table thead th.text-left {
          text-align: left;
          padding-left: 8px;
        }

        table.dir-table tbody tr.student-row {
          border-bottom: 1px solid #e2e8f0;
        }
        table.dir-table tbody tr.student-row:nth-child(even) {
          background: #f8fafc;
        }
        table.dir-table tbody tr.student-row td {
          padding: 4px 6px;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }

        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

        .sr-cell {
          color: #64748b;
          font-weight: 800;
          width: 32px;
        }

        .photo-cell {
          width: 44px;
          padding: 3px !important;
        }
        .photo-wrapper {
          width: 32px;
          height: 36px;
          border-radius: 4px;
          overflow: hidden;
          margin: 0 auto;
          border: 1px solid #94a3b8;
          background: #f1f5f9;
        }
        .photo-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .roll-cell {
          font-size: 11.5px;
          font-weight: 800;
          color: #0f2a4a;
          width: 65px;
        }

        .name-cell {
          padding-left: 8px !important;
        }
        .student-name {
          font-weight: 800;
          color: #0f172a;
          font-size: 11px;
          text-transform: uppercase;
        }

        .father-cell {
          color: #334155;
          font-weight: 600;
          font-size: 10px;
        }

        .class-cell {
          font-weight: 700;
          color: #0f2a4a;
          width: 75px;
        }

        .section-cell {
          color: #be123c;
          font-size: 11px;
          width: 50px;
        }

        .gender-cell {
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          width: 60px;
        }

        .verify-cell {
          width: 100px;
        }
        .verify-box {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }
        .checkbox-sq {
          font-size: 13px;
          color: #94a3b8;
        }
        .verify-line {
          display: inline-block;
          width: 65px;
          border-bottom: 1px dashed #94a3b8;
          height: 12px;
        }

        /* Signatures Footer */
        .signatures-area {
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1.5px solid #0f2a4a;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .sig-col {
          text-align: center;
          width: 170px;
        }
        .sig-line {
          border-top: 1.5px solid #0f2a4a;
          margin-bottom: 5px;
        }
        .sig-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f2a4a;
          letter-spacing: 0.5px;
        }
        .sig-subtitle {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 500;
        }

        .cert-statement {
          margin-top: 15px;
          text-align: center;
          font-size: 8.5px;
          color: #64748b;
          font-style: italic;
          page-break-inside: avoid;
          break-inside: avoid;
        }
      </style>
    </head>
    <body>
      
      <!-- Screen Toolbar -->
      <div class="no-print control-bar">
        <div>
          <h2>Student Verification & Directory Print Preview</h2>
          <p style="font-size: 11px; opacity: 0.85;">
            Total: ${students.length} Candidates across ${groupedStudents.length} Classes • Page Separated by Class
          </p>
        </div>
        <div class="actions">
          <button class="btn btn-print" onclick="window.print()">
            🖨️ Print Master Directory
          </button>
          <button class="btn btn-close" onclick="window.close()">
            ✕ Close Preview
          </button>
        </div>
      </div>

      <!-- Class Sheets (Each class starts on its own fresh page) -->
      ${classSheetsHtml}

      <script>
        // Auto trigger print dialog on page load
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 400);
        });
      </script>
    </body>
    </html>
  `;
}

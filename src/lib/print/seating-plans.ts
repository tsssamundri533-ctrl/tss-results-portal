import { SeatingPlan, SchoolSettings } from '@/types';
import { PRINT_SHARED_STYLES } from './shared-styles';
import { format } from 'date-fns';

/**
 * Seating Plan Template (Landscape A4)
 * High-contrast monochrome floor plan with high-visibility Identity Tiles.
 */
export async function generateSeatingPlanHtml(plan: SeatingPlan, settings: SchoolSettings) {
  const totalStudents = plan.columns.reduce((acc, col) => acc + col.students.length, 0);

  const columnsHtml = plan.columns.map((col, cIdx) => {
    // Determine max seats to render in each column for grid consistency
    const maxRows = Math.max(...plan.columns.map(c => c.students.length), 5);
    
    return `
      <div class="column">
        <div class="col-header">
           <div class="cls-name">${col.className || 'VACANT'}</div>
           <div class="aisle-no">AISLE ${cIdx + 1}</div>
        </div>
        <div class="seats-list">
          ${Array.from({ length: maxRows }).map((_, rIdx) => {
            const student = col.students[rIdx];
            const seatNo = (plan.columns.slice(0, cIdx).reduce((acc, c) => acc + c.students.length, 0)) + rIdx + 1;
            
            if (!student) {
              return `<div class="seat vacant"></div>`;
            }

            return `
              <div class="seat">
                <div class="seat-head">
                   <span class="roll">ROLL: ${student.rollNumber}</span>
                   <span class="no">#${seatNo}</span>
                </div>
                <div class="student-name">${student.name}</div>
                <div class="student-meta">${student.className} — Sec ${student.sectionName || 'A'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Seating Plan - ${plan.roomName}</title>
      <style>
        ${PRINT_SHARED_STYLES}
        .document-page.landscape { width: 297mm; height: 210mm; padding: 10mm; }
        .wrapper { border: 2.5px solid #000; height: 100%; display: flex; flex-direction: column; padding: 8mm; background: #fff; }
        
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000; padding-bottom: 6mm; margin-bottom: 8mm; }
        .school-info h1 { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
        .school-info p { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #444; margin-top: 3px; letter-spacing: 2px; }
        
        .room-badge { border: 4px solid #000; padding: 8px 30px; text-align: center; }
        .room-badge .lbl { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #666; display: block; margin-bottom: 2px; }
        .room-badge .val { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 900; text-transform: uppercase; }

        .meta-strip { display: flex; gap: 30px; margin-top: 10px; }
        .meta-item { font-size: 10px; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; gap: 5px; }
        .meta-dot { width: 4px; height: 4px; background: #000; border-radius: 50%; }

        .hall-grid { display: flex; gap: 12px; justify-content: center; flex: 1; overflow: hidden; }
        .column { width: 50mm; display: flex; flex-direction: column; gap: 8px; }
        .col-header { background: #000; color: #fff; padding: 8px; text-align: center; border-radius: 6px; }
        .col-header .cls-name { font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .col-header .aisle-no { font-size: 8px; font-weight: 700; opacity: 0.7; letter-spacing: 1px; }

        .seats-list { display: flex; flex-direction: column; gap: 8px; }
        .seat { border: 2px solid #000; border-radius: 10px; height: 32mm; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; }
        .seat.vacant { border: 1.5px dashed #ccc; opacity: 0.2; }
        
        .seat-head { display: flex; justify-content: space-between; align-items: flex-start; }
        .seat-head .roll { font-size: 10px; font-weight: 900; }
        .seat-head .no { font-size: 9px; font-weight: 900; color: #aaa; }
        
        .student-name { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 900; text-transform: uppercase; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .student-meta { font-size: 8px; font-weight: 900; color: #555; text-transform: uppercase; border-top: 1px solid #eee; padding-top: 3px; }

        .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8mm; border-top: 2px solid #000; }
        .sig-box { width: 220px; text-align: center; }
        .sig-line { border-top: 2px solid #000; margin-bottom: 5px; }
        .sig-box span { font-size: 11px; font-weight: 900; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="document-page landscape">
        <div class="wrapper">
          <div class="header">
            <div class="header-left">
               <div class="school-info">
                 <h1>${settings.profile?.schoolName || 'The Spirit School Samundri'}</h1>
                 <p>Examination Management Terminal</p>
               </div>
               <div class="meta-strip">
                 <div class="meta-item">Cycle: ${plan.examTitle}</div>
                 <div class="meta-dot"></div>
                 <div class="meta-item">Candidates: ${totalStudents}</div>
                 <div class="meta-dot"></div>
                 <div class="meta-item">Zone: ${plan.corridor}</div>
               </div>
            </div>
            <div class="room-badge">
              <span class="lbl">Designated Hall</span>
              <span class="val">${plan.roomName}</span>
            </div>
          </div>

          <div class="hall-grid">
            ${columnsHtml}
          </div>

          <div class="footer">
            <div class="sig-box"><div class="sig-line"></div><span>Class Incharge Signature</span></div>
            <div class="sig-box" style="width: 100px; font-style: italic; color: #ccc; font-size: 8px;">Official Registry Document<br>${format(new Date(), 'dd-MM-yyyy HH:mm')}</div>
            <div class="sig-box"><div class="sig-line"></div><span>Principal Authorized Seal</span></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

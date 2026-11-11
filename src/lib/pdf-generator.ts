'use client';

import { SchoolSettings, Student, Mark, Exam, Subject } from '@/types';

/**
 * Converts a remote image URL to a base64 string.
 */
async function getBase64Image(url: string): Promise<string> {
  if (!url) return '';
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return '';
  }
}

export async function generateRollSlips(school: SchoolSettings, students: Student[], examTitle: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const logoBase64 = school.profile?.logoURL ? await getBase64Image(school.profile.logoURL) : '';

  students.forEach((student, index) => {
    if (index > 0 && index % 2 === 0) doc.addPage();
    
    const yOffset = (index % 2) * 140 + 10;
    
    // Slip Border (Professional Double Line)
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, yOffset, 190, 130);
    doc.setDrawColor(79, 70, 229); // Primary Color
    doc.rect(11, yOffset + 1, 188, 128);
    
    // Header
    if (logoBase64) doc.addImage(logoBase64, 'PNG', 15, yOffset + 5, 22, 22);
    
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39); // Navy 900
    doc.setFont('helvetica', 'bold');
    doc.text(school.profile?.schoolName || 'SCHOOL NAME', 42, yOffset + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(school.profile?.address || 'Institution Address', 42, yOffset + 21);
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text(`EXAM ADMIT CARD - ${examTitle.toUpperCase()}`, 42, yOffset + 30);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(10, yOffset + 35, 200, yOffset + 35);

    // Student Identification Grid
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yOffset + 40, 120, 50, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Student Name`, 20, yOffset + 48);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name, 55, yOffset + 48);
    
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Father Name`, 20, yOffset + 56);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(student.fatherName || 'N/A', 55, yOffset + 56);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Class & Section`, 20, yOffset + 64);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.class} - ${student.section}`, 55, yOffset + 64);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exam Location`, 20, yOffset + 72);
    doc.setTextColor(249, 115, 22); // Amber
    doc.setFont('helvetica', 'bold');
    doc.text(student.corridor || 'Main Hall', 55, yOffset + 72);

    // Roll Number Box
    doc.setFillColor(79, 70, 229);
    doc.rect(140, yOffset + 40, 55, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('ROLL NUMBER', 150, yOffset + 48);
    doc.setFontSize(18);
    doc.text(student.rollNumber, 150, yOffset + 60);

    // Photo Box
    doc.setDrawColor(226, 232, 240);
    doc.rect(140, yOffset + 75, 55, 55);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text('AFFIX RECENT', 155, yOffset + 100);
    doc.text('PHOTO HERE', 157, yOffset + 105);

    // QR Code Simulation (Placeholder for real QR integration)
    doc.setDrawColor(0, 0, 0);
    doc.rect(145, yOffset + 80, 45, 45);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6);
    doc.text('SCAN FOR ENTRY', 153, yOffset + 128);

    // Instructions
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT INSTRUCTIONS:', 20, yOffset + 95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const inst = school.profile?.rollNumberSlipInstructions || "1. Bring this slip daily. 2. Arrive 15m early. 3. No mobile phones allowed.";
    doc.text(doc.splitTextToSize(inst, 110), 20, yOffset + 102);
    
    // Signatures
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.line(20, yOffset + 130, 70, yOffset + 130);
    doc.text('Candidate Sign', 30, yOffset + 135);
    
    doc.line(140, yOffset + 130, 190, yOffset + 130);
    doc.text('Authorized Seal', 148, yOffset + 135);
  });

  doc.save(`${examTitle.replace(/\s+/g, '_')}_Roll_Slips.pdf`);
}

export async function generateResultCard(school: SchoolSettings, student: Student, marks: any[], exam: Exam) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const logoBase64 = school.profile?.logoURL ? await getBase64Image(school.profile.logoURL) : '';

  // Header
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 15, 10, 25, 25);
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(school.profile?.schoolName || 'SCHOOL NAME', 45, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(school.profile?.address || '', 45, 26);
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 38, 200, 38);

  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.text(`OFFICIAL RESULT CARD - ${exam.title.toUpperCase()}`, 105, 48, { align: 'center' });

  // Student info
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Candidate Name: ${student.name}`, 15, 60);
  doc.text(`Father's Name: ${student.fatherName}`, 15, 66);
  doc.text(`Roll Number: ${student.rollNumber}`, 150, 60);
  doc.text(`Class: ${student.class}`, 150, 66);

  const tableData = marks.map((m) => [
    m.name || m.subjectId,
    m.maxMarks,
    m.marks,
    m.grade
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Subject Name', 'Max Marks', 'Marks Obtained', 'Grade']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`OVERALL PERFORMANCE: ${marks.reduce((a,b)=>a+b.marks, 0)} TOTAL`, 15, finalY);

  // Footer
  doc.setFontSize(10);
  doc.line(15, finalY + 40, 75, finalY + 40);
  doc.text('Class Teacher', 30, finalY + 45);
  
  doc.line(135, finalY + 40, 195, finalY + 40);
  doc.text('Principal Signature', 145, finalY + 45);

  doc.save(`Result_${student.rollNumber}_${student.name}.pdf`);
}

export async function generateAttendanceSheet(school: SchoolSettings, students: Student[], date: string, className: string) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(school.profile?.schoolName || 'School', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Examination Attendance Sheet: ${className} - ${date}`, 105, 22, { align: 'center' });

  const tableData = students.map((s, i) => [
    i + 1,
    s.rollNumber,
    s.name,
    s.corridor,
    '', // Signature column
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['#', 'Roll No', 'Student Name', 'Location', 'Signature / Thumb']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [17, 24, 39] },
    styles: { cellPadding: 4 }
  });

  doc.save(`Attendance_${className}_${date}.pdf`);
}

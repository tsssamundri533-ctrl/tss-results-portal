'use client';

import { Document, Page, View, Text, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { PDFSchoolHeader } from './PDFSchoolHeader';
import { Student, Result, Exam } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  headerBanner: {
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    padding: 6,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    borderRadius: 4,
    marginBottom: 20,
  },
  studentSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    border: '1 solid #E2E8F0',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    border: '1 dashed #CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    marginLeft: 20,
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  studentSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  rollCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rollText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    width: '100%',
    border: '1 solid #E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    padding: 8,
  },
  headerCell: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #F1F5F9',
    padding: 8,
  },
  cell: {
    fontSize: 10,
    color: '#334155',
  },
  summaryGrid: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    border: '1 solid #F1F5F9',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  remarksBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderLeft: '4 solid #4F46E5',
  },
  remarksLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4F46E5',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#312E81',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 40,
  },
  signContainer: {
    alignItems: 'center',
    width: 140,
  },
  signature: {
    width: 100,
    height: 40,
    marginBottom: 5,
  },
  line: {
    width: '100%',
    borderTop: '1 solid #111827',
    marginBottom: 5,
  },
  signLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  }
});

interface Props {
  result: Result;
  student: Student;
  school: any;
  examTitle: string;
  printConfig: any;
}

export function ResultCard({ result, student, school, examTitle, printConfig }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFSchoolHeader {...school} />
        
        <View style={styles.headerBanner}>
          <Text>{examTitle.toUpperCase()} REPORT CARD</Text>
        </View>

        <View style={styles.studentSection}>
          {student.photoURL ? (
            <Image src={student.photoURL} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
               <Text style={{ fontSize: 20, color: '#CBD5E1' }}>?</Text>
            </View>
          )}
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentSub}>S/O {student.fatherName}</Text>
            <Text style={styles.studentSub}>Class: {student.class} | Session: {school.sessionTitle}</Text>
          </View>
          <View style={styles.rollCol}>
            <Text style={{ fontSize: 8, color: '#64748B' }}>ROLL NUMBER</Text>
            <Text style={styles.rollText}>#{student.rollNumber}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 3 }]}>Subject</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Max</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Obtained</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Grade</Text>
          </View>
          
          {Object.entries(result.subjects).map(([id, sub]) => (
            <View key={id} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 3, fontWeight: 'bold' }]}>{sub.name}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>{sub.maxMarks}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'center', color: '#4F46E5', fontWeight: 'bold' }]}>{sub.marks}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{sub.grade}</Text>
            </View>
          ))}

          <View style={[styles.tableRow, { backgroundColor: '#F8FAFC', borderBottom: 0 }]}>
            <Text style={[styles.cell, { flex: 3, fontWeight: 'bold' }]}>TOTAL AGGREGATE</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{result.totalMax}</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{result.totalObtained}</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{result.grade}</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Percentage</Text>
            <Text style={styles.summaryValue}>{result.percentage}%</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Final Grade</Text>
            <Text style={[styles.summaryValue, { color: '#4F46E5' }]}>{result.grade}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Result Status</Text>
            <Text style={[styles.summaryValue, { color: result.status === 'Pass' ? '#10B981' : '#EF4444' }]}>
              {result.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.remarksBox}>
          <Text style={styles.remarksLabel}>Academic Remarks</Text>
          <Text style={styles.remarksText}>"{result.remarks}"</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signContainer}>
            <View style={styles.line} />
            <Text style={styles.signLabel}>Class Teacher</Text>
          </View>
          
          {printConfig?.showStampOnResults && school.stampURL && (
            <View style={{ position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)' }}>
               <Image src={school.stampURL} style={{ width: 60, height: 60, opacity: 0.8 }} />
            </View>
          )}

          <View style={styles.signContainer}>
            {printConfig?.showSignatureOnResults && school.signatureURL ? (
              <Image src={school.signatureURL} style={styles.signature} />
            ) : <View style={{ height: 45 }} />}
            <View style={styles.line} />
            <Text style={styles.signLabel}>Principal / Authorized</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

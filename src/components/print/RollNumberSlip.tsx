'use client';

import { Document, Page, View, Text, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { PDFSchoolHeader } from './PDFSchoolHeader';
import { Student, DateSheet } from '@/types';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  slipContainer: {
    width: '100%',
    height: '48.5%', 
    border: '2 solid #1B62DE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  innerBorder: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    border: '1 solid #E2E8F0',
    borderRadius: 10,
    pointerEvents: 'none',
  },
  examHeading: {
    textAlign: 'center',
    marginVertical: 4,
    paddingVertical: 2,
  },
  examTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B62DE',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  body: {
    flexDirection: 'row',
    marginTop: 4,
  },
  details: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    border: '1 solid #F1F5F9',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottom: '1 solid #F1F5F9',
    paddingBottom: 4,
  },
  label: {
    fontSize: 8,
    color: '#64748B',
    width: 65,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  rightCol: {
    width: 85, // Fixed width to match boxes
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoBox: {
    width: 85,
    height: 85,
    border: '1 solid #CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Ensures square crop
  },
  rollBox: {
    width: 85, // Match photo and QR width
    backgroundColor: '#1B62DE',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginVertical: 4,
  },
  rollLabel: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  rollNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  qrContainer: {
    width: 85,
    height: 85,
    backgroundColor: '#FFFFFF',
    border: '1 solid #1B62DE',
    borderRadius: 8,
    padding: 2, // Minimal padding for scan safety
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  table: {
    marginTop: 10,
    width: '100%',
    border: '1 solid #E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1B62DE',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #F1F5F9',
    padding: 5,
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
    paddingHorizontal: 3,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  instructions: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: '1 solid #E2E8F0',
  },
  instHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#1B62DE',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  instText: {
    fontSize: 7,
    color: '#64748B',
    lineHeight: 1.4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 10,
  },
  signLine: {
    width: 100,
    borderTop: '1.5 solid #111827',
    marginTop: 15,
    alignItems: 'center',
  },
  signText: {
    fontSize: 7,
    marginTop: 2,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#111827',
  }
});

interface Props {
  students: (Student & { qrBase64?: string; photoBase64?: string })[];
  school: any;
  dateSheet: DateSheet;
}

export function RollNumberSlip({ students, school, dateSheet }: Props) {
  const studentPairs = [];
  for (let i = 0; i < students.length; i += 2) {
    studentPairs.push(students.slice(i, i + 2));
  }

  const papers = [...(dateSheet?.papers || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Document>
      {studentPairs.map((pair, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {pair.map((student) => (
            <View key={student.id} style={styles.slipContainer}>
              <View style={styles.innerBorder} />
              
              <PDFSchoolHeader 
                {...school} 
              />

              <View style={styles.examHeading}>
                <Text style={styles.examTitle}>
                  {dateSheet?.examTitle || "Examination Cycle"}
                </Text>
              </View>

              <View style={styles.body}>
                <View style={styles.details}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{student.name}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Father</Text>
                    <Text style={styles.value}>{student.fatherName}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Class</Text>
                    <Text style={styles.value}>{student.class} - {student.section}</Text>
                  </View>
                  <View style={[styles.row, { borderBottom: 0, marginBottom: 0 }]}>
                    <Text style={styles.label}>Zone</Text>
                    <Text style={[styles.value, { color: '#1B62DE' }]}>{student.corridor}</Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <View style={styles.photoBox}>
                    {student.photoBase64 ? (
                      <Image src={student.photoBase64} style={styles.photoImage} />
                    ) : (
                      <Text style={{ fontSize: 7, color: '#94A3B8', fontWeight: 'bold' }}>PHOTO</Text>
                    )}
                  </View>

                  <View style={styles.rollBox}>
                    <Text style={styles.rollLabel}>ROLL NUMBER</Text>
                    <Text style={styles.rollNumber}>{student.rollNumber}</Text>
                  </View>
                  
                  {student.qrBase64 && (
                    <View style={styles.qrContainer}>
                      <Image src={student.qrBase64} style={styles.qrImage} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: '8%' }]}>#</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: '22%' }]}>Date</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: '15%' }]}>Day</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: '18%' }]}>Reporting</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: '17%' }]}>Start</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { width: '20%' }]}>Subject</Text>
                </View>

                {papers.length > 0 ? papers.map((paper, idx) => {
                  const subDate = paper.date ? new Date(paper.date) : null;
                  return (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: '8%' }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { width: '22%', fontWeight: 'bold' }]}>
                        {subDate ? format(subDate, 'dd-MM-yyyy') : '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: '15%' }]}>
                        {subDate ? format(subDate, 'EEE') : '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: '18%', fontWeight: 'bold' }]}>{paper.reportingTime || '08:30 AM'}</Text>
                      <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: '#1B62DE' }]}>{paper.startTime || '09:00 AM'}</Text>
                      <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{paper.subjectName}</Text>
                    </View>
                  );
                }) : (
                  <View style={{ padding: 15, textAlign: 'center' }}>
                    <Text style={{ fontSize: 8, color: '#94A3B8', fontStyle: 'italic' }}>No independent schedule defined for this class.</Text>
                  </View>
                )}
              </View>

              <View style={styles.instructions}>
                <Text style={styles.instHeader}>Important Notice:</Text>
                <Text style={styles.instText}>
                  {school.rollNumberSlipInstructions || "1. Admit card is mandatory. 2. Arrive 15m early. 3. Mobile phones prohibited. 4. Maintain discipline."}
                </Text>
              </View>

              <View style={styles.footer}>
                <View style={styles.signLine}>
                  <Text style={styles.signText}>Candidate Sign</Text>
                </View>
                <View style={styles.signLine}>
                  <Text style={styles.signText}>Principal Seal</Text>
                </View>
              </View>
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
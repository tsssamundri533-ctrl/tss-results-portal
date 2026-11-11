'use client';

import { View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottom: '1 solid #E2E8F0',
    paddingBottom: 8,
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  contactText: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  motto: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#4F46E5',
    marginTop: 2,
  },
  sessionContainer: {
    textAlign: 'right',
    justifyContent: 'center',
  },
  sessionTitle: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: 'bold',
  }
});

interface PDFSchoolHeaderProps {
  schoolName: string;
  logoBase64?: string;
  address: string;
  phone: string;
  email?: string;
  motto?: string;
  sessionTitle: string;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

export function PDFSchoolHeader({
  schoolName,
  logoBase64,
  address,
  phone,
  email,
  motto,
  sessionTitle,
  showLogo,
  showAddress,
  showPhone,
  showEmail,
}: PDFSchoolHeaderProps) {
  const contactParts = [];
  if (showAddress && address) contactParts.push(address);
  if (showPhone && phone) contactParts.push(phone);
  if (showEmail && email) contactParts.push(email);

  return (
    <View style={styles.header}>
      {showLogo && logoBase64 ? (
        <Image src={logoBase64} style={styles.logo} />
      ) : showLogo ? (
        <View style={styles.logoPlaceholder} />
      ) : null}
      
      <View style={styles.info}>
        <Text style={styles.schoolName}>{schoolName}</Text>
        {contactParts.length > 0 && (
          <Text style={styles.contactText}>
            {contactParts.join(' | ')}
          </Text>
        )}
        {motto && <Text style={styles.motto}>"{motto}"</Text>}
      </View>

      <View style={styles.sessionContainer}>
        <Text style={styles.sessionTitle}>{sessionTitle}</Text>
      </View>
    </View>
  );
}

# **App Name**: TSSS

## Core Features:

- Authentication & Access Control: Secure user login with Firebase Authentication and role-based access for Admin and Teacher.
- Student & Teacher Management: Admin interface for managing student details, assigning teachers to classes and subjects.
- Real-time Marks Entry: Teachers can enter student marks in assigned subjects with auto-save, debounced input, and optimistic UI for instant feedback, stored in Firestore.
- Automated Result Generation: Automatically calculate totals, percentages, and grades for students, generating individual result cards.
- Offline PWA Support & Sync: Store marks and attendance data locally using IndexedDB and automatically sync with Firestore when internet connectivity returns.
- Role-Based Dashboards: Mobile-first Admin and Teacher dashboards displaying relevant data and quick access to core functions.
- Printable Roll Number Slips & Seating Plans: Generate and print PDF documents for student roll number slips (with QR codes) and seating plans with auto-assigned students.

## Style Guidelines:

- Primary color: A sophisticated, deep blue (`#1B62DE`) for trust and professionalism.
- Background color: A very light, subtle blue-grey (`#EEF3FA`) to ensure a clean and modern canvas.
- Accent color: A vibrant teal-cyan (`#29C4C4`) to highlight important actions and information, providing good contrast.
- Body and headline font: 'Inter' (sans-serif) for its modern, neutral, and highly legible characteristics, suitable for all text roles.
- Utilize a clean, outline-style icon set that aligns with modern design principles and enhances clarity on mobile interfaces, consistent with shadcn UI.
- Implement a mobile-first, responsive design with card-based UIs for data presentation. Employ a collapsible sidebar for larger screens and persistent bottom navigation for mobile, featuring large, thumb-friendly buttons for easy interaction.
- Incorporate subtle, functional animations such as smooth transitions between views, button hover/press feedback, and loading skeletons to enhance user experience and convey state changes without being distracting.
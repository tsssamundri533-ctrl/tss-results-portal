/**
 * Shared Institutional Print Styles
 * Standardizes A4 geometry and high-fidelity typography across all documents.
 */
export const PRINT_SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Outfit:wght@700;900&display=swap');
  
  @media print {
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
    .page-break { page-break-after: always; }
    .no-print { display: none !important; }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', sans-serif;
    color: #000000;
    background: #ffffff;
    line-height: 1.2;
  }

  .document-page {
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    background: white;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }
  
  .document-page.landscape {
    width: 297mm;
    height: 210mm;
  }

  .font-outfit { font-family: 'Outfit', sans-serif; }
`;

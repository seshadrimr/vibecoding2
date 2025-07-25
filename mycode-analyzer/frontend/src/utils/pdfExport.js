import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF report of the repository analysis
 * @param {Object} data - Repository analysis data
 * @param {Array} data.files - Array of analyzed files
 * @param {string} data.repoUrl - Repository URL
 * @returns {jsPDF} - PDF document object
 */
export const generateAnalysisReport = (data) => {
  const { files, repoUrl } = data;
  
  // Initialize PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('C# Repository Analysis Report', 14, 22);
  
  // Add repository info
  doc.setFontSize(12);
  doc.text(`Repository: ${repoUrl}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
  doc.text(`Total Files Analyzed: ${files.length}`, 14, 44);
  
  // Add statistics
  const logicFiles = files.filter(file => file.classification === 'logic').length;
  const boilerplateFiles = files.filter(file => file.classification === 'boilerplate').length;
  
  doc.setFontSize(16);
  doc.text('File Classification Summary', 14, 54);
  
  // Add classification chart data
  const chartData = [
    ['Classification', 'Count', 'Percentage'],
    ['Logic', logicFiles, `${Math.round((logicFiles / files.length) * 100)}%`],
    ['Boilerplate', boilerplateFiles, `${Math.round((boilerplateFiles / files.length) * 100)}%`],
    ['Total', files.length, '100%']
  ];
  
  doc.autoTable({
    startY: 60,
    head: [chartData[0]],
    body: chartData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });
  
  // Add file list
  doc.setFontSize(16);
  doc.text('File List', 14, doc.autoTable.previous.finalY + 15);
  
  const fileData = files.map((file, index) => [
    index + 1,
    file.path,
    file.classification || 'Unknown',
  ]);
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [['#', 'File Path', 'Classification']],
    body: fileData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 }
    },
    styles: { overflow: 'linebreak' },
    bodyStyles: { valign: 'middle' },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `MyCodeAnalyzer Report - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

/**
 * Save the analysis report as a PDF file
 * @param {Object} data - Repository analysis data
 */
export const downloadAnalysisReport = (data) => {
  const doc = generateAnalysisReport(data);
  
  // Extract repository name from URL for the filename
  const repoName = data.repoUrl.split('/').pop() || 'repository';
  
  // Save the PDF
  doc.save(`${repoName}-analysis-report.pdf`);
};

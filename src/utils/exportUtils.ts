import * as XLSX from 'xlsx';
import { DocumentRecord, ExchangeRates } from '../types/document';
import { convertToTotalLAK, formatDateDisplay, formatMultiCurrencySummary, getOperationStatusLabel, getPaymentStatusLabel, getUrgencyLabel } from './formatters';

export function exportDocumentsToExcel(documents: DocumentRecord[], rates: ExchangeRates) {
  const exportData = documents.map((doc, idx) => {
    const totalRevLAK = convertToTotalLAK(doc.totalValue, rates);
    const outstandingLAK = convertToTotalLAK(doc.customerPayment.outstandingBalance, rates);
    
    return {
      'ລຳດັບ': idx + 1,
      'ລາຍຊື່ບໍລິສັດ': doc.companyName,
      'ປະເພດ': doc.isNewCompany ? 'ບໍລິສັດໃໝ່' : (doc.isContractRenewal ? 'ຕໍ່ສັນຍາ' : 'ປົກກະຕິ'),
      'ສາຍ': doc.line,
      'ເລກທີ່ຂາເຂົ້າ': doc.incomingNo,
      'ມື້ເປີດວຽກ': formatDateDisplay(doc.workOpenDate),
      'ເລກ TIN': doc.tinNo,
      'ຜູ້ປະສານງານ': doc.coordinatorName,
      'ຄວາມດ່ວນ': getUrgencyLabel(doc.urgency).label,
      'ຈຳນວນວັນດຳເນີນ': doc.processingDays,
      'ມື້ສຳເລັດ': formatDateDisplay(doc.completionDate),
      'ມື້ໝົດອາຍຸ': formatDateDisplay(doc.expiryDate),
      'ຈ້ຳກາ': doc.isStamped ? '✓' : '✗',
      'ປະກອບ': doc.isAssembled ? '✓' : '✗',
      'ຍື່ນ': doc.isSubmitted ? '✓' : '✗',
      'ຕິດຕາມ': doc.isTracked ? '✓' : '✗',
      'ສະຖານທີ່ຍື່ນ': doc.submissionLocation,
      'ມື້ຍື່ນອາກອນ': formatDateDisplay(doc.taxSubmissionDate),
      'ເລກທີ່ຍື່ນ': doc.submissionIncomingNo,
      'ສະຖານະການດຳເນີນງານ': getOperationStatusLabel(doc.operationStatus).label,
      'ສະຖານະຊຳລະເງິນ': getPaymentStatusLabel(doc.customerPayment.paymentStatus).label,
      'ມູນຄ່າທັງໝົດ (ລາຍຮັບ)': formatMultiCurrencySummary(doc.totalValue, rates),
      'ມູນຄ່າລາຍຮັບຄິດເປັນ (LAK)': totalRevLAK,
      'ຍອດຄ້າງຊຳລະ (LAK)': outstandingLAK,
      'ໂປຣແກຣມຕິດຕັ້ງ': [
        doc.softwareInstallation.apis ? 'APIS' : '',
        doc.softwareInstallation.tsd ? 'TSD' : '',
        doc.softwareInstallation.pkt ? 'PKT' : '',
        doc.softwareInstallation.renew2026 ? 'ຕໍ່ 2026' : '',
        doc.softwareInstallation.other
      ].filter(Boolean).join(', '),
      'ສະຖານະຕິດຕັ້ງ': doc.softwareInstallation.isInstalled ? 'ຕິດຕັ້ງແລ້ວ' : 'ຍັງບໍ່ຕິດຕັ້ງ',
      'ໝາຍເຫດ': doc.softwareInstallation.remarks || doc.postCompletion.remarks || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set auto width
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  worksheet['!cols'] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    worksheet['!cols'].push({ wch: 18 });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ລາຍການເອກະສານ');
  
  const now = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Document_Report_${now}.xlsx`);
}

export function printPDFReport(elementId: string, title: string = 'ລາຍງານລະບົບຕິດຕາມເອກະສານ') {
  const content = document.getElementById(elementId);
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="lo">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Noto Sans Lao', sans-serif;
          padding: 20px;
          background: white;
          color: #111827;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="mb-6 border-b pb-4 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">${title}</h1>
          <p class="text-sm text-slate-500">ວັນທີອອກລາຍງານ: ${new Date().toLocaleDateString('lo-LA')} | ເວລາ: ${new Date().toLocaleTimeString('lo-LA')}</p>
        </div>
        <button onclick="window.print()" class="no-print bg-blue-600 text-white px-4 py-2 rounded font-medium shadow hover:bg-blue-700">
          🖨️ ພິມ / ດາວໂຫຼດ PDF
        </button>
      </div>
      <div>
        ${content.innerHTML}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 600);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

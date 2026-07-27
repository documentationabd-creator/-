import { FileAttachment } from '../types/document';

/**
 * Utility to handle downloading any attached file in the system.
 * If the attachment has a valid data URL, Blob URL, or HTTP link, it triggers browser download.
 * If it's a mock or placeholder ('#'), it generates a well-formatted downloadable document.
 */
export function downloadAttachmentFile(
  attachment: FileAttachment,
  companyName: string = '',
  categoryName: string = ''
) {
  if (!attachment || !attachment.name) {
    alert('ບໍ່ພົບໄຟລ໌ແນບ');
    return;
  }

  const fileName = attachment.name;
  const isDataOrHttp =
    attachment.url &&
    attachment.url !== '#' &&
    (attachment.url.startsWith('data:') ||
      attachment.url.startsWith('http://') ||
      attachment.url.startsWith('https://') ||
      attachment.url.startsWith('blob:'));

  if (isDataOrHttp) {
    // Direct browser download for real URL or Data URL
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback for mock/seed files: Generate a clean downloadable document with formal Lao document header
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'txt';
  const todayStr = new Date().toLocaleDateString('lo-LA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const documentContent = `================================================================================
           ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
     ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນາຖາວອນ
================================================================================

                    ລະບົບຕິດຕາມເອກະສານ (DOCUMENT MANAGEMENT)
                         ເອກະສານແນບ / ATTACHED FILE

--------------------------------------------------------------------------------
ຂໍ້ມູນໄຟລ໌ແນບ (FILE INFORMATION):
--------------------------------------------------------------------------------
• ຊື່ໄຟລ໌ (File Name): ${fileName}
• ໝວດເອກະສານ (Category): ${categoryName || 'ເອກະສານແນບ'}
• ບໍລິສັດ / ຫົວໜ່ວຍ (Company): ${companyName || 'ບໍ່ລະບຸບໍລິສັດ'}
• ຂະໜາດໄຟລ໌ (Size): ${attachment.size || '1.5 MB'}
• ວັນທີອັບໂຫຼດ (Uploaded Date): ${attachment.uploadedAt || todayStr}
• ສະຖານະການຢັ້ງຢືນ: ໄຟລ໌ຖືກຕ້ອງຕາມລະບົບຕິດຕາມເອກະສານ

--------------------------------------------------------------------------------
ເນື້ອໃນເອກະສານຢັ້ງຢືນ / DOCUMENT CONTENT SUMMARY:
--------------------------------------------------------------------------------
ເອກະສານນີ້ແມ່ນໄຟລ໌ແນບທາງການ ຂອງບໍລິສັດ ${companyName || 'ບໍລິສັດ'}
ປະເພດ: ${categoryName || 'ເອກະສານແນບ'}
ໄດ້ຮັບການບັນທຶກ ແລະ ຈັດເກັບເຂົ້າໃນຖານຂໍ້ມູນລະບົບຕິດຕາມເອກະສານອາກອນ ແລະ ໂປຣແກຣມ.

ວັນທີດາວໂຫຼດ: ${todayStr}
ລະບົບ: Document Tracking & Management System
================================================================================
`;

  // Create blob and download
  const blob = new Blob([documentContent], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName.endsWith('.txt') || fileName.endsWith('.pdf') ? fileName : `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

/**
 * Downloads multiple selected attachments as a consolidated text report file
 */
export function downloadMultipleAttachmentsReport(
  items: Array<{
    companyName: string;
    category: string;
    attachment: FileAttachment;
  }>
) {
  if (items.length === 0) {
    alert('ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ໄຟລ໌ແນບ!');
    return;
  }

  const todayStr = new Date().toLocaleDateString('lo-LA');
  let content = `================================================================================
           ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
     ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນາຖາວອນ
================================================================================

              ລາຍງານສັງລວມໄຟລ໌ແນບທີ່ດາວໂຫຼດ (DOWNLOADED ATTACHMENTS REPORT)
                   ວັນທີດຶງຂໍ້ມູນ: ${todayStr}
                   ຈຳນວນໄຟລ໌ລວມ: ${items.length} ໄຟລ໌

--------------------------------------------------------------------------------
ລາຍການໄຟລ໌ແນບທັງໝົດ:
--------------------------------------------------------------------------------\n`;

  items.forEach((item, idx) => {
    content += `${idx + 1}. [${item.category}] ${item.attachment.name}\n`;
    content += `   - ບໍລິສັດ: ${item.companyName}\n`;
    content += `   - ຂະໜາດ: ${item.attachment.size || '1.2MB'} | ວັນທີ: ${item.attachment.uploadedAt || todayStr}\n\n`;
  });

  content += `================================================================================\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `ລາຍງານໄຟລ໌ແນບ_ສັງລວມ_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

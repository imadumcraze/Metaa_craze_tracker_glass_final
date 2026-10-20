import { Client, MonthlyPackage, ContentItem } from '../types';
import { MONTH_NAMES } from './storage';

export interface ExportReportParams {
  client: Client;
  pkg?: MonthlyPackage;
  month: number;
  year: number;
  items: ContentItem[];
  accessToken: string;
}

export const exportReportToGoogleSheets = async ({
  client,
  pkg,
  month,
  year,
  items,
  accessToken
}: ExportReportParams): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const monthName = MONTH_NAMES[month - 1];
  const title = `Metaa Craze - ${client.name} - ${monthName} ${year} Content Report`;

  // 1. Create spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: `${monthName} ${year} Delivery`
          }
        }
      ]
    })
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Sheets API error: ${createResponse.status}`);
  }

  const spreadsheetData = await createResponse.json();
  const spreadsheetId = spreadsheetData.spreadsheetId;
  const spreadsheetUrl = spreadsheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Prepare tabular data
  const totalAgreed = pkg ? pkg.totalDeliverables : items.length;
  const publishedCount = items.filter(i => i.status === 'Published').length;
  const approvedCount = items.filter(i => i.status === 'Approved').length;
  const pendingCount = items.filter(i => i.status === 'Pending Approval').length;
  const inProgressCount = items.filter(i => i.status === 'In Progress').length;
  const completedCount = items.filter(i => i.status === 'Completed').length;
  const notStartedCount = items.filter(i => i.status === 'Not Started').length;
  const onHoldCount = items.filter(i => i.status === 'On Hold').length;
  const completionRate = totalAgreed > 0 ? ((publishedCount / totalAgreed) * 100).toFixed(1) : '0';

  const rows: (string | number)[][] = [
    ['METAA CRAZE PRODUCTIONS (PVT) LTD.'],
    ['MONTHLY SOCIAL MEDIA CONTENT DELIVERY REPORT'],
    [''],
    ['Client:', client.name, 'Company:', client.companyName],
    ['Reporting Period:', `${monthName} ${year}`, 'Generated Date:', new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Contact Person:', client.contactPerson, 'Contact:', `${client.contactNumber} | ${client.email}`],
    ['Monthly Package Fee:', client.monthlyPackageFee || 'N/A', 'Package ID:', pkg?.packageId || 'Custom'],
    [''],
    ['DELIVERY SUMMARY & PERFORMANCE METRICS'],
    [
      'Total Agreed',
      'Published',
      'Approved',
      'Pending Approval',
      'In Progress',
      'Completed',
      'Not Started',
      'On Hold',
      'Completion Rate'
    ],
    [
      totalAgreed,
      publishedCount,
      approvedCount,
      pendingCount,
      inProgressCount,
      completedCount,
      notStartedCount,
      onHoldCount,
      `${completionRate}%`
    ],
    [''],
    ['CONTENT DELIVERY DETAILS'],
    [
      'No.',
      'Content Item',
      'Content Title / Description',
      'Planned Date',
      'Published Date',
      'Status',
      'Live Post URL',
      'Remarks'
    ],
    ...items.map((item, index) => [
      index + 1,
      item.displayNumber,
      item.title || '(No description provided)',
      item.plannedDate || 'Not set',
      item.status === 'Published' && item.actualPublishedDate ? item.actualPublishedDate : 'Not Published',
      item.status,
      item.postUrl || 'N/A',
      item.remarks || ''
    ]),
    [''],
    ['Metaa Craze Productions (Pvt) Ltd. — Verified Content Tracking Record']
  ];

  // 3. Write data to sheet
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${monthName} ${year} Delivery'!A1:I${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!updateResponse.ok) {
    console.warn('Failed to populate rows into new sheet, but spreadsheet was created');
  }

  return { spreadsheetId, spreadsheetUrl };
};

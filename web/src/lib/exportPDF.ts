import type jsPDF from 'jspdf';
import type { CellHookData } from 'jspdf-autotable';
import type { CalcResourceResult, ExpenseItem, ProjectEngagementConfig } from './calculations';
import type { WBSElement } from './database.types';

// Dynamic import to avoid SSR issues
async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  return { jsPDF, autoTable };
}

const BRAND = [99, 102, 241] as [number, number, number];   // indigo-500
const DARK  = [15, 15, 23]  as [number, number, number];   // #0f0f17
const LIGHT = [229, 231, 235] as [number, number, number]; // gray-200

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Dark header bar
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 28, 'F');

  // Brand accent line
  doc.setFillColor(...BRAND);
  doc.rect(0, 28, 210, 2, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('S3T', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('Solution Sizing & Scoping Tool', 14, 18);

  // Title right-aligned
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 196, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(subtitle, 196, 18, { align: 'right' });
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = doc.internal.pageSize.height - 10;
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`Created by Dr Ming Chan Tok · S3T Platform · ${new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, y);
  doc.text(`Page ${pageNum} of ${totalPages}`, 196, y, { align: 'right' });
  // Footer line
  doc.setDrawColor(55, 65, 81);
  doc.line(14, y - 3, 196, y - 3);
}

// ─── P&L Summary PDF ─────────────────────────────────────────────────────────
export async function exportPLSummaryPDF(
  projectName: string,
  calcResources: CalcResourceResult[],
  expenses: ExpenseItem[],
  totals: { revenue: number; cost: number; margin: number; pm: number; hours: number; expenseCost: number },
  config: ProjectEngagementConfig
) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginPct = totals.revenue > 0 ? totals.margin / totals.revenue : 0;

  addHeader(doc, 'P&L Summary', projectName);

  // KPI summary boxes
  const kpis = [
    { label: 'Total Revenue', value: `MYR ${totals.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` },
    { label: 'Total Cost',    value: `MYR ${totals.cost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` },
    { label: 'Net Margin',    value: `MYR ${totals.margin.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` },
    { label: 'Margin %',      value: `${(marginPct * 100).toFixed(1)}%` },
    { label: 'Total Effort',  value: `${totals.pm.toFixed(2)} PM` },
    { label: 'Total Hours',   value: `${totals.hours.toLocaleString()} hrs` },
  ];

  kpis.forEach((kpi, i) => {
    const boxW = 30;
    const boxX = 14 + i * (boxW + 2);
    doc.setFillColor(26, 26, 38);
    doc.roundedRect(boxX, 34, boxW, 18, 2, 2, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), boxX + boxW / 2, 40, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, boxX + boxW / 2, 47, { align: 'center' });
  });

  // Config row
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Discount: ${((config.global_discount ?? 0) * 100).toFixed(0)}%  ·  Allowance: ${((config.global_allowance ?? 0) * 100).toFixed(0)}%  ·  Currency: ${config.sell_currency ?? 'MYR'}`,
    14, 58
  );

  // Resource table
  const resourceRows = calcResources.map(r => [
    r.name,
    `${r.code} · ${r.title}`,
    r.totalPM.toFixed(2),
    `MYR ${r.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
    `MYR ${r.costTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
    `${(r.marginPct * 100).toFixed(1)}%`,
  ]);

  const expenseRows = expenses.map(e => [
    e.description,
    e.category,
    '—',
    `MYR ${e.sell.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
    `MYR ${e.cost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
    e.sell > 0 ? `${(((e.sell - e.cost) / e.sell) * 100).toFixed(1)}%` : '—',
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['Resource / Item', 'Code · Role', 'PM / Qty', 'Revenue (MYR)', 'Cost (MYR)', 'Margin %']],
    body: [...resourceRows, ...expenseRows],
    foot: [['TOTAL', '', `${totals.pm.toFixed(2)} PM`,
      `MYR ${totals.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
      `MYR ${totals.cost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
      `${(marginPct * 100).toFixed(1)}%`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: [26, 26, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fillColor: [20, 20, 30], textColor: LIGHT, fontSize: 7.5 },
    alternateRowStyles: { fillColor: [26, 26, 38] },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', textColor: [16, 185, 129] },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: { pageNumber: number }) => {
      addFooter(doc, data.pageNumber, doc.getNumberOfPages());
    },
  });

  doc.save(`S3T_PL_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── WBS Export PDF ───────────────────────────────────────────────────────────
export async function exportWBSPDF(projectName: string, elements: WBSElement[]) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  addHeader(doc, 'WBS Report', projectName);

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed':  return [16, 185, 129] as [number, number, number];
      case 'in_progress': return [99, 102, 241] as [number, number, number];
      case 'blocked':    return [239, 68, 68] as [number, number, number];
      default:           return [107, 114, 128] as [number, number, number];
    }
  };

  const rows = elements.map(e => [
    e.wbs_code,
    '  '.repeat((e.level ?? 1) - 1) + e.name,
    e.level ?? 1,
    e.phase ?? '—',
    e.status.replace('_', ' '),
    e.effort_hours ? `${e.effort_hours}h` : '—',
    e.start_date ? new Date(e.start_date).toLocaleDateString('en-MY') : '—',
    e.end_date   ? new Date(e.end_date).toLocaleDateString('en-MY')   : '—',
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['WBS Code', 'Name', 'Lvl', 'Phase', 'Status', 'Effort', 'Start', 'End']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fillColor: [20, 20, 30], textColor: LIGHT, fontSize: 7.5 },
    alternateRowStyles: { fillColor: [26, 26, 38] },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', textColor: BRAND },
      1: { cellWidth: 90 },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data: CellHookData) => {
      if (data.column.index === 4 && data.section === 'body') {
        const status = elements[data.row.index]?.status ?? '';
        data.cell.styles.textColor = statusColor(status);
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (data: { pageNumber: number }) => {
      addFooter(doc, data.pageNumber, doc.getNumberOfPages());
    },
  });

  doc.save(`S3T_WBS_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

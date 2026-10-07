import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import type { ProjectEngagementConfig, CalcResourceResult, ProjectTotals, EngagementResource } from './calculations';
import type { Project, WBSElement } from './database.types';

type SOWProject = Pick<Project, 'name' | 'description' | 'start_date' | 'end_date'>;
type SOWWBSRow = Pick<WBSElement, 'wbs_code' | 'name' | 'effort_hours'>;
type SOWItem = SOWWBSRow | EngagementResource;

// docx's Paragraph has no `bold` option — bold must be set on a TextRun.
function headerCell(text: string) {
  return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] });
}

export async function generateSOW(
  project: SOWProject,
  wbsElements: SOWItem[],
  calcResources: CalcResourceResult[],
  totals: ProjectTotals,
  config: ProjectEngagementConfig
) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "STATEMENT OF WORK",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Project: ${project.name}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Description: ", bold: true }),
              new TextRun(project.description || "No description provided."),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Customer: ", bold: true }),
              new TextRun(config.customer_name || "TBD"),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Timeline: ", bold: true }),
              new TextRun(`${project.start_date || 'TBD'} to ${project.end_date || 'TBD'}`),
            ],
          }),

          new Paragraph({
            text: "Scope of Work",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          createWBSTable(wbsElements),

          new Paragraph({
            text: "Resource Plan",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          createResourcesTable(calcResources),

          new Paragraph({
            text: "Commercial Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Total Effort: ", bold: true }),
              new TextRun(`${totals.hours} hours (${totals.pm.toFixed(1)} Person-Months)`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Total Price: ", bold: true }),
              new TextRun(`${config.sell_currency || 'MYR'} ${totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  a.download = `SOW_${project.name.replace(/\s+/g, "_")}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function createWBSTable(wbsElements: SOWItem[]) {
  const rows = [
    new TableRow({
      children: [headerCell("WBS Code"), headerCell("Phase / Task"), headerCell("Effort (Hrs)")],
    }),
  ];

  wbsElements.forEach((el) => {
    const code = ('wbs_code' in el ? el.wbs_code : el.code) || '';
    const name = el.name || '';
    const effort = 'effort_hours' in el
      ? (el.effort_hours?.toString() || '0')
      : (Array.isArray(el.effort) ? el.effort.reduce<number>((acc, v) => acc + (v || 0), 0).toFixed(1) : '0');

    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(code)] }),
          new TableCell({ children: [new Paragraph(name)] }),
          new TableCell({ children: [new Paragraph(effort)] }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows,
  });
}

function createResourcesTable(calcResources: CalcResourceResult[]) {
  const rows = [
    new TableRow({
      children: [headerCell("Role"), headerCell("Category"), headerCell("Hours")],
    }),
  ];

  calcResources.forEach((r) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(r.title || r.name)] }),
          new TableCell({ children: [new Paragraph(r.category)] }),
          new TableCell({ children: [new Paragraph(r.totalHours.toString())] }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows,
  });
}

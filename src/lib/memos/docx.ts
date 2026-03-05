import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  PageBreak,
  ShadingType,
} from "docx";
import type { MemoSectionOutput, MemoSectionId } from "./types";

/** Union type for document section children (paragraphs and tables) */
type DocChild = Paragraph | Table;

// ─── Color Constants ────────────────────────────────────────────

const NAVY = "102A43";
const NAVY_MID = "486581";
const NAVY_LIGHT = "D9E2EC";
const NAVY_BG = "F0F4F8";
const GOLD = "D4A017";
const WHITE = "FFFFFF";
const TEXT_COLOR = "334E68";

// ─── Section Display Order ──────────────────────────────────────

const SECTION_ORDER: MemoSectionId[] = [
  "EXECUTIVE_SUMMARY",
  "FINANCIAL_COMPARISON",
  "COMMUTE_TALENT",
  "RISK_ASSUMPTIONS",
  "RECOMMENDATION",
];

// ─── Interfaces ─────────────────────────────────────────────────

interface MemoDocxParams {
  dealName: string;
  clientName?: string | null;
  brokerName?: string | null;
  brokerageName?: string | null;
  sections: Record<string, MemoSectionOutput>;
  generatedDate: string;
  audience: string;
  tone: string;
}

// ─── Main Builder ───────────────────────────────────────────────

export async function buildMemoDocx(params: MemoDocxParams): Promise<Buffer> {
  const {
    dealName,
    clientName,
    brokerName,
    brokerageName,
    sections,
    generatedDate,
    audience,
    tone,
  } = params;

  const children: DocChild[] = [];

  // ── Cover Section ──
  children.push(...buildCoverSection(dealName, clientName, brokerName, brokerageName, generatedDate, audience, tone));

  // ── Content Sections ──
  const orderedSections = SECTION_ORDER.filter((id) => id in sections);
  for (let i = 0; i < orderedSections.length; i++) {
    const sectionId = orderedSections[i];
    const section = sections[sectionId];

    // Page break before each section (except first)
    if (i > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    children.push(...buildSection(section));
  }

  // Build document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
            color: TEXT_COLOR,
          },
          paragraph: {
            spacing: { after: 120 },
          },
        },
        heading1: {
          run: {
            font: "Calibri",
            size: 32, // 16pt
            bold: true,
            color: NAVY,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        heading2: {
          run: {
            font: "Calibri",
            size: 26, // 13pt
            bold: true,
            color: NAVY,
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${dealName} — Lease Analysis Memo`,
                    font: "Calibri",
                    size: 16, // 8pt
                    color: NAVY_MID,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
                },
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `CONFIDENTIAL`,
                    font: "Calibri",
                    size: 14,
                    color: GOLD,
                    bold: true,
                  }),
                  new TextRun({
                    text: `  |  TenantAlpha${clientName ? ` — ${clientName}` : ""} — ${dealName}`,
                    font: "Calibri",
                    size: 14,
                    color: NAVY_MID,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
                },
                spacing: { before: 200 },
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ─── Cover Section Builder ──────────────────────────────────────

function buildCoverSection(
  dealName: string,
  clientName: string | null | undefined,
  brokerName: string | null | undefined,
  brokerageName: string | null | undefined,
  generatedDate: string,
  audience: string,
  tone: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Spacer
  paragraphs.push(new Paragraph({ spacing: { before: 600 } }));

  // Tag line
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "LEASE OPTIONS ANALYSIS",
          font: "Calibri",
          size: 20, // 10pt
          bold: true,
          color: GOLD,
          allCaps: true,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Deal name
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: dealName,
          font: "Calibri",
          size: 52, // 26pt
          bold: true,
          color: NAVY,
        }),
      ],
      spacing: { after: 120 },
    })
  );

  // Client name
  if (clientName) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared for ${clientName}`,
            font: "Calibri",
            size: 24, // 12pt
            color: NAVY_MID,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // Memo metadata
  const metaLine = `${audience} Audience  |  ${tone.replace("_", " ")} Tone  |  ${generatedDate}`;
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: metaLine,
          font: "Calibri",
          size: 18, // 9pt
          color: NAVY_MID,
          italics: true,
        }),
      ],
      spacing: { after: 80 },
    })
  );

  // Broker info
  if (brokerName) {
    const brokerLine = `Prepared by ${brokerName}${brokerageName ? ` · ${brokerageName}` : ""}`;
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: brokerLine,
            font: "Calibri",
            size: 20,
            color: NAVY_MID,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // Divider
  paragraphs.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
      },
      spacing: { before: 200, after: 400 },
    })
  );

  return paragraphs;
}

// ─── Section Builder ────────────────────────────────────────────

function buildSection(section: MemoSectionOutput): DocChild[] {
  const elements: DocChild[] = [];

  // Section title
  elements.push(
    new Paragraph({
      text: section.sectionTitle,
      heading: HeadingLevel.HEADING_1,
    })
  );

  // Bullets
  for (const bullet of section.bullets) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: bullet,
            size: 22,
          }),
        ],
        bullet: { level: 0 },
        spacing: { after: 80 },
      })
    );
  }

  // Tables — rendered as native Word tables for proper alignment
  for (const tableData of section.tables) {
    // Table title
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: tableData.title,
            bold: true,
            size: 22,
            color: NAVY,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    // Native Word table
    elements.push(buildTable(tableData.columns, tableData.rows));

    // Spacing after table
    elements.push(new Paragraph({ spacing: { after: 120 } }));
  }

  // Callouts
  for (const callout of section.callouts) {
    elements.push(...buildCallout(callout.label, callout.text));
  }

  // Assumptions
  if (section.assumptions.length > 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Assumptions & Notes",
            bold: true,
            size: 18, // 9pt
            color: NAVY_MID,
            italics: true,
          }),
        ],
        spacing: { before: 200, after: 60 },
      })
    );

    for (const assumption of section.assumptions) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${assumption}`,
              size: 18,
              color: NAVY_MID,
              italics: true,
            }),
          ],
          spacing: { after: 40 },
          indent: { left: 360 },
        })
      );
    }
  }

  return elements;
}

// ─── Table Builder (native Word tables) ─────────────────────────

/** Standard cell margins for consistent spacing */
const CELL_MARGINS = {
  top: 40,
  bottom: 40,
  left: 80,
  right: 80,
} as const;

/** Detect if a cell value looks numeric (currency, %, numbers) for right-alignment */
function isNumericCell(value: string): boolean {
  return /^[\s]*[\$\-\+]?[\d,]+\.?\d*[%]?[\s]*$/.test(value.trim()) ||
    /^\$/.test(value.trim()) ||
    /\d+%$/.test(value.trim()) ||
    /^[\d,]+(\.\d+)?$/.test(value.trim());
}

function buildTable(columns: string[], rows: string[][]): Table {
  const colCount = columns.length;
  // Total usable width ~9360 DXA (6.5 inches at 1440 DXA/inch)
  const totalWidth = 9360;

  // Smart column sizing: first column (labels) gets more space
  const firstColWidth = Math.floor(totalWidth * 0.3);
  const otherColWidth = colCount > 1
    ? Math.floor((totalWidth - firstColWidth) / (colCount - 1))
    : totalWidth;

  const getColWidth = (idx: number) => idx === 0 ? firstColWidth : otherColWidth;

  // Header row with navy background
  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map(
      (col, idx) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: col,
                  bold: true,
                  size: 18,
                  color: WHITE,
                  font: "Calibri",
                }),
              ],
              alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
              spacing: { after: 0 },
            }),
          ],
          shading: { type: ShadingType.SOLID, color: NAVY },
          width: { size: getColWidth(idx), type: WidthType.DXA },
          margins: CELL_MARGINS,
          verticalAlign: "center" as never,
        })
    ),
  });

  // Data rows with alternating shading
  const dataRows = rows.map(
    (row, rowIdx) =>
      new TableRow({
        children: row.map(
          (cell, cellIdx) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      size: 18,
                      color: TEXT_COLOR,
                      bold: cellIdx === 0,
                      font: "Calibri",
                    }),
                  ],
                  alignment: cellIdx === 0
                    ? AlignmentType.LEFT
                    : isNumericCell(cell)
                      ? AlignmentType.RIGHT
                      : AlignmentType.CENTER,
                  spacing: { after: 0 },
                }),
              ],
              shading:
                rowIdx % 2 === 0
                  ? { type: ShadingType.SOLID, color: NAVY_BG }
                  : { type: ShadingType.SOLID, color: WHITE },
              width: { size: getColWidth(cellIdx), type: WidthType.DXA },
              margins: CELL_MARGINS,
              verticalAlign: "center" as never,
            })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
      left: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
      right: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
    },
  });
}

// ─── Callout Builder ────────────────────────────────────────────

function buildCallout(label: string, text: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: label,
          bold: true,
          size: 22,
          color: NAVY,
          font: "Calibri",
        }),
      ],
      indent: { left: 360 },
      spacing: { before: 200, after: 40 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
      },
      shading: { type: ShadingType.SOLID, color: NAVY_BG },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text,
          size: 20,
          color: TEXT_COLOR,
          font: "Calibri",
        }),
      ],
      indent: { left: 360 },
      spacing: { after: 120 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
      },
      shading: { type: ShadingType.SOLID, color: NAVY_BG },
    }),
  ];
}

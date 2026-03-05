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
  Tab,
  TabStopType,
  TabStopPosition,
} from "docx";
import type { MemoSectionOutput, MemoSectionId } from "./types";

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

  const children: Paragraph[] = [];

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

function buildSection(section: MemoSectionOutput): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Section title
  paragraphs.push(
    new Paragraph({
      text: section.sectionTitle,
      heading: HeadingLevel.HEADING_1,
    })
  );

  // Bullets
  for (const bullet of section.bullets) {
    paragraphs.push(
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

  // Tables
  for (const tableData of section.tables) {
    // Table title
    paragraphs.push(
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

    // Build table
    const table = buildTable(tableData.columns, tableData.rows);
    // Tables can't be pushed into Paragraph[] — we need to use a different approach
    // The docx library requires tables to be children of Document sections
    // For now, we'll render table data as tab-separated paragraphs
    paragraphs.push(...buildTableAsParagraphs(tableData.columns, tableData.rows));
  }

  // Callouts
  for (const callout of section.callouts) {
    paragraphs.push(...buildCallout(callout.label, callout.text));
  }

  // Assumptions
  if (section.assumptions.length > 0) {
    paragraphs.push(
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
      paragraphs.push(
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

  return paragraphs;
}

// ─── Table Builder ──────────────────────────────────────────────

function buildTable(columns: string[], rows: string[][]): Table {
  const colCount = columns.length;
  const colWidth = Math.floor(9000 / colCount); // Distribute across ~6.25 inches

  // Header row
  const headerRow = new TableRow({
    children: columns.map(
      (col) =>
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
              alignment: AlignmentType.LEFT,
            }),
          ],
          shading: { type: ShadingType.SOLID, color: NAVY },
          width: { size: colWidth, type: WidthType.DXA },
        })
    ),
  });

  // Data rows
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
                      bold: cellIdx === 0, // Bold first column (option name)
                      font: "Calibri",
                    }),
                  ],
                  alignment: cellIdx > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                }),
              ],
              shading:
                rowIdx % 2 === 1
                  ? { type: ShadingType.SOLID, color: NAVY_BG }
                  : undefined,
              width: { size: colWidth, type: WidthType.DXA },
            })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Render table as formatted paragraphs (fallback since Document sections
 * accept both Paragraph and Table as children, but our section builder
 * uses Paragraph[]). We'll handle this by returning a special marker.
 *
 * Actually, docx FileChild union accepts both Paragraph and Table.
 * We need to adjust our approach to use FileChild[] instead of Paragraph[].
 */
function buildTableAsParagraphs(columns: string[], rows: string[][]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const separator = "   |   ";

  // Header row
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: columns.join(separator),
          bold: true,
          size: 18,
          color: NAVY,
          font: "Calibri",
        }),
      ],
      spacing: { after: 40 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: NAVY },
      },
    })
  );

  // Data rows
  for (let i = 0; i < rows.length; i++) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: rows[i].join(separator),
            size: 18,
            color: TEXT_COLOR,
            font: "Calibri",
          }),
        ],
        spacing: { after: 40 },
        shading:
          i % 2 === 1
            ? { type: ShadingType.SOLID, color: NAVY_BG }
            : undefined,
      })
    );
  }

  // Bottom border
  paragraphs.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: NAVY_LIGHT },
      },
      spacing: { after: 120 },
    })
  );

  return paragraphs;
}

// ─── Callout Builder ────────────────────────────────────────────

function buildCallout(label: string, text: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `▎ ${label}`,
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

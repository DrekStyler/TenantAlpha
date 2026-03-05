import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ComparisonResult } from "@/engine/types";
import type { AmenityResult } from "@/types/location";
import { AMENITY_CATEGORIES } from "@/types/location";

// Using PDF built-in Helvetica — no network fetch required.
// External font CDN calls (Google Fonts) are unreliable in serverless functions.

const colors = {
  navy: "#102a43",
  navyMid: "#486581",
  navyLight: "#d9e2ec",
  navyBg: "#f0f4f8",
  gold: "#d4a017",
  white: "#ffffff",
  text: "#334e68",
  muted: "#627d98",
  border: "#d9e2ec",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", paddingHorizontal: 40, paddingVertical: 36, color: colors.text },

  // Cover
  coverPage: { fontFamily: "Helvetica", paddingHorizontal: 0, paddingVertical: 0 },
  coverHero: { backgroundColor: colors.navy, padding: 48, minHeight: 300, justifyContent: "flex-end" },
  coverTag: { color: colors.gold, fontSize: 10, fontWeight: 600, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" },
  coverTitle: { color: colors.white, fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 },
  coverClient: { color: "#9fb3c8", fontSize: 13 },
  coverFooter: { paddingHorizontal: 48, paddingVertical: 32, backgroundColor: colors.navyBg },
  coverBroker: { fontSize: 11, color: colors.navyMid, lineHeight: 1.6 },
  coverDate: { fontSize: 10, color: colors.muted, marginTop: 8 },

  // Header / footer on content pages
  pageHeader: { marginBottom: 24, borderBottomWidth: 2, borderBottomColor: colors.navy, paddingBottom: 10 },
  pageHeaderTitle: { fontSize: 16, fontWeight: 700, color: colors.navy },
  pageHeaderSub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  pageFooter: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  pageFooterText: { fontSize: 8, color: colors.muted },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: colors.navy, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },

  // Best Value Banner
  banner: { backgroundColor: colors.navy, borderRadius: 6, padding: 14, marginBottom: 16 },
  bannerLabel: { fontSize: 8, color: "#9fb3c8", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  bannerTitle: { fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 6 },
  bannerReason: { fontSize: 10, color: "#c8d8e8", marginBottom: 3, flexDirection: "row" },
  bannerCheck: { color: colors.gold, marginRight: 6 },

  // Summary text
  summaryText: { fontSize: 10, lineHeight: 1.7, color: colors.text },

  // Table
  table: { width: "100%" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: colors.navy, borderRadius: 4, marginBottom: 1 },
  tableHeaderCell: { color: colors.white, fontSize: 8, fontWeight: 600, padding: "6 8", flex: 1, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.navyLight },
  tableRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.navyLight, backgroundColor: colors.navyBg },
  tableCell: { fontSize: 9, padding: "6 8", flex: 1, color: colors.text },
  tableCellBold: { fontSize: 9, padding: "6 8", flex: 1, color: colors.navy, fontWeight: 600 },
  tableCellRight: { fontSize: 9, padding: "6 8", flex: 1, color: colors.text, textAlign: "right" },

  // Disclaimer
  disclaimerText: { fontSize: 8, color: colors.muted, lineHeight: 1.6 },
  disclaimerTitle: { fontSize: 10, fontWeight: 600, color: colors.navyMid, marginBottom: 6 },

  // Location
  scoreCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  scoreValue: { fontSize: 14, fontWeight: 700, color: colors.white, textAlign: "center" },
  scoreLabel: { fontSize: 8, color: colors.muted, textAlign: "center", marginTop: 2 },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function fmtSF(n: number) {
  return `$${n.toFixed(2)}/SF`;
}

interface PDFDocumentProps {
  deal: { dealName: string; clientName?: string | null; propertyType?: string | null };
  options: Array<{
    optionName: string;
    rentableSF: number;
    termMonths: number;
    baseRentY1: number;
    rentStructure: string;
    escalationType?: string | null;
    escalationPercent?: number | null;
    freeRentMonths: number;
    tiAllowance?: number | null;
    estimatedBuildoutCost?: number | null;
    opExPerSF?: number | null;
    parkingCostMonthly?: number | null;
    discountRate?: number | null;
  }>;
  calculationResults: ComparisonResult;
  aiSummary?: string;
  chartImages?: Record<string, string>;
  brokerProfile?: {
    name?: string | null;
    brokerageName?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
  } | null;
  locationData?: Array<{
    optionName: string;
    propertyAddress?: string | null;
    formattedAddress?: string | null;
    walkScore?: number | null;
    driveScore?: number | null;
    amenities: AmenityResult[];
  }> | null;
}

function PageFooter({ dealName, clientName }: { dealName: string; clientName?: string | null }) {
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.pageFooterText}>
        TenantAlpha{clientName ? ` — ${clientName}` : ""} — {dealName}
      </Text>
      <Text style={[s.pageFooterText, { color: colors.gold }]}>CONFIDENTIAL</Text>
    </View>
  );
}

export function PDFDocument({
  deal,
  options,
  calculationResults,
  aiSummary,
  chartImages,
  brokerProfile,
  locationData,
}: PDFDocumentProps) {
  const { bestValueOption, bestValueReasons, rankedByNPV, rankedByEffectiveRent } = calculationResults;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Discount rate from first option (all should be the same)
  const discountRate = options[0]?.discountRate ?? null;

  // NPV differential: best option vs. next-best
  const sortedByNPV = [...calculationResults.options].sort((a, b) => a.npvOfCosts - b.npvOfCosts);
  const npvDifferential = sortedByNPV.length >= 2 ? sortedByNPV[1].npvOfCosts - sortedByNPV[0].npvOfCosts : null;

  // Check if any option has employee or revenue data
  const hasEmployeeData = calculationResults.options.some((o) => o.costPerEmployeePerYear != null);
  const hasRevenueData = calculationResults.options.some((o) => o.rentAsPercentOfRevenue != null);

  return (
    <Document
      title={`${deal.dealName} — Lease Analysis`}
      author={brokerProfile?.name ?? "TenantAlpha"}
    >
      {/* ── COVER PAGE ── */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={s.coverHero}>
          {brokerProfile?.logoUrl && (
            <Image src={brokerProfile.logoUrl} style={{ width: 100, marginBottom: 24 }} />
          )}
          <Text style={s.coverTag}>Lease Options Analysis</Text>
          <Text style={s.coverTitle}>{deal.dealName}</Text>
          {deal.clientName && <Text style={s.coverClient}>{deal.clientName}</Text>}
        </View>
        <View style={s.coverFooter}>
          {brokerProfile && (
            <Text style={s.coverBroker}>
              Prepared by {brokerProfile.name ?? "Your Broker"}
              {brokerProfile.brokerageName ? ` · ${brokerProfile.brokerageName}` : ""}
              {brokerProfile.email ? `\n${brokerProfile.email}` : ""}
              {brokerProfile.phone ? ` · ${brokerProfile.phone}` : ""}
            </Text>
          )}
          <Text style={s.coverDate}>{today}</Text>
        </View>
      </Page>

      {/* ── EXECUTIVE SUMMARY ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>Executive Summary</Text>
          <Text style={s.pageHeaderSub}>{deal.dealName}</Text>
        </View>

        {/* Deal Parameters */}
        <View style={{ flexDirection: "row", marginBottom: 14, gap: 12 }}>
          <View style={{ backgroundColor: colors.navyBg, borderRadius: 4, padding: 8, flex: 1 }}>
            <Text style={{ fontSize: 8, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Options Analyzed</Text>
            <Text style={{ fontSize: 14, fontWeight: 700, color: colors.navy }}>{options.length}</Text>
          </View>
          {deal.propertyType && (
            <View style={{ backgroundColor: colors.navyBg, borderRadius: 4, padding: 8, flex: 1 }}>
              <Text style={{ fontSize: 8, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Property Type</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, color: colors.navy }}>{deal.propertyType}</Text>
            </View>
          )}
          <View style={{ backgroundColor: colors.navyBg, borderRadius: 4, padding: 8, flex: 1 }}>
            <Text style={{ fontSize: 8, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Term Range</Text>
            <Text style={{ fontSize: 14, fontWeight: 700, color: colors.navy }}>
              {(() => {
                const terms = options.map((o) => o.termMonths / 12);
                const min = Math.min(...terms);
                const max = Math.max(...terms);
                return min === max ? `${min.toFixed(0)} yrs` : `${min.toFixed(0)}–${max.toFixed(0)} yrs`;
              })()}
            </Text>
          </View>
          {discountRate != null && (
            <View style={{ backgroundColor: colors.navyBg, borderRadius: 4, padding: 8, flex: 1 }}>
              <Text style={{ fontSize: 8, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Discount Rate</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, color: colors.navy }}>{discountRate.toFixed(1)}%</Text>
            </View>
          )}
        </View>

        {/* Best Value Banner */}
        <View style={s.banner}>
          <Text style={s.bannerLabel}>Recommendation</Text>
          <Text style={s.bannerTitle}>{bestValueOption}</Text>
          {bestValueReasons.map((r, i) => (
            <View key={i} style={s.bannerReason}>
              <Text style={s.bannerCheck}>✓</Text>
              <Text style={{ fontSize: 10, color: "#c8d8e8", flex: 1 }}>{r}</Text>
            </View>
          ))}
          {/* NPV differential vs next-best option */}
          {npvDifferential != null && (
            <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: "#334e68", paddingTop: 6 }}>
              <Text style={{ fontSize: 9, color: colors.gold, fontWeight: 600 }}>
                NPV Savings: {fmt(npvDifferential)} vs. next-best option
              </Text>
            </View>
          )}
        </View>

        {/* Rankings */}
        <View style={[s.section, { marginBottom: 12 }]}>
          <Text style={s.sectionTitle}>Rankings</Text>
          <Text style={{ fontSize: 10, color: colors.text, marginBottom: 4 }}>
            By NPV (lowest cost): {rankedByNPV.join(" → ")}
          </Text>
          <Text style={{ fontSize: 10, color: colors.text }}>
            By Effective Rent: {rankedByEffectiveRent.join(" → ")}
          </Text>
        </View>

        {/* AI Summary */}
        {aiSummary && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Commentary</Text>
            <Text style={s.summaryText}>{aiSummary}</Text>
          </View>
        )}

        <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
      </Page>

      {/* ── OPTIONS OVERVIEW ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>Lease Options Overview</Text>
          <Text style={s.pageHeaderSub}>Key terms for all options</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, { flex: 1.6 }]}>Option</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.8 }]}>Size (SF)</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.6 }]}>Term</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.9 }]}>Base Rent Y1</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.9 }]}>Escalation</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.7 }]}>Structure</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.7 }]}>OpEx/SF</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.6 }]}>Free Rent</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.8 }]}>TI Allow.</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.7 }]}>Parking</Text>
          </View>
          {options.map((opt, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCellBold, { flex: 1.6, fontSize: 8 }]}>{opt.optionName}</Text>
              <Text style={[s.tableCellRight, { flex: 0.8, fontSize: 8 }]}>{opt.rentableSF.toLocaleString()}</Text>
              <Text style={[s.tableCellRight, { flex: 0.6, fontSize: 8 }]}>{(opt.termMonths / 12).toFixed(0)} yr</Text>
              <Text style={[s.tableCellRight, { flex: 0.9, fontSize: 8 }]}>{fmtSF(opt.baseRentY1)}</Text>
              <Text style={[s.tableCell, { flex: 0.9, fontSize: 8 }]}>
                {opt.escalationType === "CPI"
                  ? `CPI ${opt.escalationPercent?.toFixed(1) ?? "—"}%`
                  : `${opt.escalationPercent?.toFixed(1) ?? "—"}% Fixed`}
              </Text>
              <Text style={[s.tableCell, { flex: 0.7, fontSize: 8 }]}>{opt.rentStructure}</Text>
              <Text style={[s.tableCellRight, { flex: 0.7, fontSize: 8 }]}>
                {opt.opExPerSF ? fmtSF(opt.opExPerSF) : "—"}
              </Text>
              <Text style={[s.tableCellRight, { flex: 0.6, fontSize: 8 }]}>{opt.freeRentMonths} mo</Text>
              <Text style={[s.tableCellRight, { flex: 0.8, fontSize: 8 }]}>
                {opt.tiAllowance ? fmt(opt.tiAllowance) : "—"}
              </Text>
              <Text style={[s.tableCellRight, { flex: 0.7, fontSize: 8 }]}>
                {opt.parkingCostMonthly ? `${fmt(opt.parkingCostMonthly)}/mo` : "—"}
              </Text>
            </View>
          ))}
        </View>

        <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
      </Page>

      {/* ── ROI METRICS TABLE ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>ROI Metrics Summary</Text>
          <Text style={s.pageHeaderSub}>Calculated financial metrics per option</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Option</Text>
            <Text style={s.tableHeaderCell}>Total Cost</Text>
            <Text style={s.tableHeaderCell}>NPV*</Text>
            <Text style={s.tableHeaderCell}>Eff. Rent/SF</Text>
            <Text style={s.tableHeaderCell}>Eff. w/ TI</Text>
            <Text style={s.tableHeaderCell}>Free Rent</Text>
            <Text style={s.tableHeaderCell}>TI Gap</Text>
            {hasEmployeeData && <Text style={s.tableHeaderCell}>Cost/Emp</Text>}
            {hasRevenueData && <Text style={s.tableHeaderCell}>% Rev</Text>}
          </View>
          {calculationResults.options.map((opt, i) => {
            const isBest = opt.optionName === bestValueOption;
            return (
              <View key={i} style={isBest ? { ...s.tableRow, backgroundColor: "#e6f0f8" } : i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[isBest ? s.tableCellBold : s.tableCell, { flex: 1.5, fontSize: 8 }]}>
                  {opt.optionName}{isBest ? " ★" : ""}
                </Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>{fmt(opt.totalOccupancyCost)}</Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>{fmt(opt.npvOfCosts)}</Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>{fmtSF(opt.effectiveRentPerSF)}</Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>{fmtSF(opt.effectiveRentPerSFWithTI)}</Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>
                  {opt.totalFreeRentSavings > 0 ? fmt(opt.totalFreeRentSavings) : "—"}
                </Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>
                  {opt.tiGap > 0 ? fmt(opt.tiGap) : "—"}
                </Text>
                {hasEmployeeData && (
                  <Text style={[s.tableCellRight, { fontSize: 8 }]}>
                    {opt.costPerEmployeePerYear != null ? fmt(opt.costPerEmployeePerYear) : "—"}
                  </Text>
                )}
                {hasRevenueData && (
                  <Text style={[s.tableCellRight, { fontSize: 8 }]}>
                    {opt.rentAsPercentOfRevenue != null ? `${opt.rentAsPercentOfRevenue.toFixed(1)}%` : "—"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Discount rate footnote */}
        {discountRate != null && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: colors.muted, fontStyle: "italic" }}>
              * NPV discounted at {discountRate.toFixed(1)}% using monthly compounding
            </Text>
          </View>
        )}

        <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
      </Page>

      {/* ── CASH FLOW TABLES ── */}
      {calculationResults.options.map((opt) => (
        <Page key={opt.optionName} size="LETTER" style={s.page}>
          <View style={s.pageHeader}>
            <Text style={s.pageHeaderTitle}>Annual Cash Flow — {opt.optionName}</Text>
            <Text style={s.pageHeaderSub}>Year-by-year occupancy cost breakdown</Text>
          </View>

          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <Text style={[s.tableHeaderCell, { flex: 0.6 }]}>Year</Text>
              <Text style={s.tableHeaderCell}>Base Rent</Text>
              <Text style={s.tableHeaderCell}>OpEx</Text>
              <Text style={s.tableHeaderCell}>Parking</Text>
              <Text style={s.tableHeaderCell}>Other</Text>
              <Text style={[s.tableHeaderCell, { fontWeight: 700 }]}>Total</Text>
              <Text style={s.tableHeaderCell}>Cumulative</Text>
            </View>
            {opt.annualCashFlows.map((cf, j) => (
              <View key={j} style={j % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 0.6 }]}>Yr {cf.year}</Text>
                <Text style={s.tableCellRight}>{fmt(cf.baseRent)}</Text>
                <Text style={s.tableCellRight}>{cf.opEx > 0 ? fmt(cf.opEx) : "—"}</Text>
                <Text style={s.tableCellRight}>{cf.parking > 0 ? fmt(cf.parking) : "—"}</Text>
                <Text style={s.tableCellRight}>{cf.otherFees > 0 ? fmt(cf.otherFees) : "—"}</Text>
                <Text style={s.tableCellRight}>{fmt(cf.totalCost)}</Text>
                <Text style={[s.tableCellRight, { color: colors.muted }]}>{fmt(cf.cumulativeCost)}</Text>
              </View>
            ))}
            {/* Total row */}
            <View style={{ flexDirection: "row", backgroundColor: colors.navy, borderRadius: 4, marginTop: 1 }}>
              <Text style={[s.tableHeaderCell, { flex: 0.6 }]}>Total</Text>
              <Text style={s.tableHeaderCell}></Text>
              <Text style={s.tableHeaderCell}></Text>
              <Text style={s.tableHeaderCell}></Text>
              <Text style={s.tableHeaderCell}></Text>
              <Text style={[s.tableHeaderCell, { color: colors.gold }]}>{fmt(opt.totalOccupancyCost)}</Text>
              <Text style={s.tableHeaderCell}></Text>
            </View>
          </View>

          <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
        </Page>
      ))}

      {/* ── CHARTS PAGE (if chart images provided) ── */}
      {chartImages && Object.keys(chartImages).length > 0 && (
        <Page size="LETTER" style={s.page}>
          <View style={s.pageHeader}>
            <Text style={s.pageHeaderTitle}>Visual Analysis</Text>
            <Text style={s.pageHeaderSub}>Cost comparison charts</Text>
          </View>

          {Object.entries(chartImages).map(([key, src]) => (
            <View key={key} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: 600, color: colors.navyMid, marginBottom: 8, textTransform: "capitalize" }}>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Text>
              <Image src={src} style={{ width: "100%", objectFit: "contain" }} />
            </View>
          ))}

          <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
        </Page>
      )}

      {/* ── LOCATION ANALYSIS ── */}
      {locationData && locationData.length > 0 && (
        <Page size="LETTER" style={s.page}>
          <View style={s.pageHeader}>
            <Text style={s.pageHeaderTitle}>Location Analysis</Text>
            <Text style={s.pageHeaderSub}>Walk & drive scores and nearby amenities</Text>
          </View>

          {/* Score Comparison Table */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Walkability & Accessibility Scores</Text>
            <View style={s.table}>
              <View style={s.tableHeaderRow}>
                <Text style={[s.tableHeaderCell, { flex: 2 }]}>Option</Text>
                <Text style={s.tableHeaderCell}>Address</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.7, textAlign: "center" }]}>Walk</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.7, textAlign: "center" }]}>Drive</Text>
              </View>
              {locationData.map((loc, i) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCellBold, { flex: 2 }]}>{loc.optionName}</Text>
                  <Text style={[s.tableCell, { fontSize: 8 }]}>
                    {loc.formattedAddress ?? loc.propertyAddress ?? "—"}
                  </Text>
                  <Text style={[s.tableCellRight, {
                    flex: 0.7,
                    textAlign: "center",
                    fontWeight: 600,
                    color: loc.walkScore != null
                      ? loc.walkScore >= 70 ? "#2d6a4f" : loc.walkScore >= 40 ? "#b45309" : "#dc2626"
                      : colors.muted,
                  }]}>
                    {loc.walkScore ?? "—"}
                  </Text>
                  <Text style={[s.tableCellRight, {
                    flex: 0.7,
                    textAlign: "center",
                    fontWeight: 600,
                    color: loc.driveScore != null
                      ? loc.driveScore >= 70 ? "#2d6a4f" : loc.driveScore >= 40 ? "#b45309" : "#dc2626"
                      : colors.muted,
                  }]}>
                    {loc.driveScore ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Amenity Counts by Category */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Nearby Amenities Comparison</Text>
            <View style={s.table}>
              <View style={s.tableHeaderRow}>
                <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Category</Text>
                {locationData.map((loc, i) => (
                  <Text key={i} style={[s.tableHeaderCell, { textAlign: "center" }]}>
                    {loc.optionName}
                  </Text>
                ))}
              </View>
              {AMENITY_CATEGORIES.map((cat) => {
                const counts = locationData.map(
                  (loc) => loc.amenities.filter((a) => a.category === cat.key).length
                );
                const maxCount = Math.max(...counts);
                if (maxCount === 0) return null;
                return (
                  <View key={cat.key} style={s.tableRow}>
                    <Text style={[s.tableCell, { flex: 1.5 }]}>
                      {cat.icon} {cat.label}
                    </Text>
                    {counts.map((count, i) => (
                      <Text
                        key={i}
                        style={[s.tableCellRight, {
                          textAlign: "center",
                          fontWeight: count === maxCount && count > 0 ? 600 : 400,
                          color: count === maxCount && count > 0 ? "#2d6a4f" : colors.text,
                        }]}
                      >
                        {count}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Score Legend */}
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 8, color: colors.muted, lineHeight: 1.5 }}>
              Walk Score (0–100): Measures walkability based on nearby amenities within 400m. Drive Score (0–100): Measures accessibility by car within 1,600m. Scores ≥ 70 = Excellent, 40–69 = Moderate, &lt; 40 = Limited. Higher counts in the amenity comparison indicate more options within the search radius.
            </Text>
          </View>

          <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
        </Page>
      )}

      {/* ── DISCLAIMER ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>Assumptions & Disclaimer</Text>
        </View>

        <View style={s.section}>
          <Text style={s.disclaimerTitle}>Calculation Assumptions</Text>
          <Text style={s.disclaimerText}>
            All financial projections are based on data provided by the user at the time of analysis. Rent escalations are applied annually based on the selected method (fixed percentage or CPI). Net Present Value (NPV) calculations discount future cash flows at the specified discount rate using either monthly or annual compounding as selected. Free rent savings reflect abated months only; deferred free rent is not deducted from total cost. Effective rent is calculated by dividing total occupancy cost by rentable square footage over the full lease term. TI gap reflects the difference between estimated buildout cost and landlord TI allowance, if provided. Operating expense escalations are applied annually if specified.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
          <Text style={s.disclaimerText}>
            This analysis is prepared for informational and comparison purposes only. It does not constitute legal, financial, accounting, or investment advice. Actual lease costs may differ from projections due to market conditions, lease negotiations, tenant improvements, operating expense reconciliations, and other factors. Users should consult qualified legal counsel and financial advisors before executing any lease agreement. TenantAlpha and its affiliates make no representation or warranty regarding the accuracy, completeness, or fitness for a particular purpose of this analysis.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.disclaimerTitle}>AI-Generated Content</Text>
          <Text style={s.disclaimerText}>
            The AI advisory comments in this report are generated by an artificial intelligence model and are intended solely as a starting point for discussion. They do not constitute professional advice and should be independently verified by a qualified commercial real estate professional.
          </Text>
        </View>

        <PageFooter dealName={deal.dealName} clientName={deal.clientName} />
      </Page>
    </Document>
  );
}

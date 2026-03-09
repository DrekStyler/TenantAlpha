"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import type { StrategicROI } from "@/types/survey";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface StrategicSectionProps {
  data: StrategicROI;
}

export function StrategicSection({ data }: StrategicSectionProps) {
  const radarData = [
    { subject: "Talent", score: data.talentAttractionScore },
    { subject: "Client Exp.", score: data.clientExperienceScore },
    { subject: "Market", score: data.marketPresenceScore },
    { subject: "Regulatory", score: data.regulatoryAlignmentScore },
  ];

  return (
    <Card>
      <CardHeader title="Strategic ROI" />
      <div className="space-y-4 p-6 pt-0">
        {/* Radar Chart */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e8e8e4" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "#5c5c56" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: "#7d7d77" }}
                tickCount={6}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#1a1a1a"
                fill="#1a1a1a"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  value !== undefined ? `${value.toFixed(1)}/10` : "N/A",
                  "Score",
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow label="Composite Score" value={`${data.compositeStrategicScore.toFixed(1)}/10`} highlight />
          <MetricRow label="Revenue Impact" value={`$${data.estimatedRevenueImpact.toLocaleString()}`} />
          <MetricRow label="Talent Score" value={`${data.talentAttractionScore.toFixed(1)}/10`} />
          <MetricRow label="Client Exp." value={`${data.clientExperienceScore.toFixed(1)}/10`} />
        </div>
      </div>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-navy-50 px-3 py-2">
      <span className="text-xs text-navy-500">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-green-700" : "text-navy-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

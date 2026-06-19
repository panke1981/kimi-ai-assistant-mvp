import { FileSpreadsheet, Layers3 } from "lucide-react";

import { WorkspacePanel } from "@/components/command-center/WorkspacePanel";
import {
  toneStyles,
  type AnalysisTrailEntry,
  type CommandFileItem,
  type StrategistSelection,
} from "@/lib/command-center-view";
import type { DiagnosisBlock, DiagnosisDomain } from "@/lib/command-center-data";

interface DiagnosisSidebarProps {
  diagnosisBlocks: DiagnosisBlock[];
  selectedDomain: DiagnosisDomain;
  files: CommandFileItem[];
  analysisTrail: AnalysisTrailEntry[];
  strategistSelection: StrategistSelection;
  onSelectDiagnosis: (id: DiagnosisDomain) => void;
  onSelectTrailEntry: (selection: StrategistSelection) => void;
}

export function DiagnosisSidebar({
  diagnosisBlocks,
  selectedDomain,
  files,
  analysisTrail,
  strategistSelection,
  onSelectDiagnosis,
  onSelectTrailEntry,
}: DiagnosisSidebarProps) {
  return (
    <WorkspacePanel className="flex min-h-0 flex-col overflow-hidden rounded-xl">
      <div className="border-b p-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mb-3 flex items-center gap-2">
          <Layers3 size={16} style={{ color: "var(--brand)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>诊断图层</h2>
        </div>
        <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>围绕收入、费用、利润、现金流组织经营判断。</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="space-y-2 p-3">
          {diagnosisBlocks.map((block) => {
            const active = selectedDomain === block.id;
            const tone = toneStyles[block.tone];
            return (
              <button
                key={block.id}
                onClick={() => onSelectDiagnosis(block.id)}
                className="w-full rounded-lg border p-3 text-left transition-colors"
                style={{
                  borderColor: active ? tone.border : "var(--border-subtle)",
                  background: active ? tone.bg : "#fff",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{block.title}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: tone.color, background: "#fff" }}>{block.status}</span>
                </div>
                <p className="text-lg font-semibold data-mono" style={{ color: tone.color }}>{block.metric}</p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>{block.compare}</p>
              </button>
            );
          })}
        </div>

        <div className="border-t px-3 py-3" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>最近分析</p>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{analysisTrail.length}/5</span>
          </div>
          {analysisTrail.length > 0 ? (
            <div className="space-y-1.5">
              {analysisTrail.map((entry) => {
                const active = strategistSelection.kind === entry.selection.kind && strategistSelection.id === entry.selection.id;
                const tone = toneStyles[entry.tone];
                return (
                  <button
                    key={entry.key}
                    onClick={() => onSelectTrailEntry(entry.selection)}
                    className="w-full rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                    style={{
                      borderColor: active ? tone.border : "var(--border-subtle)",
                      background: active ? tone.bg : "#fff",
                    }}
                    data-analysis-trail={entry.key}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ color: tone.color, background: "rgba(255,255,255,0.72)" }}>
                        {entry.label}
                      </span>
                      <span className="truncate text-[10px]" style={{ color: active ? tone.color : "var(--text-muted)" }}>
                        {active ? "当前" : entry.detail}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border bg-white px-2.5 py-2 text-[11px] leading-5" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              点击诊断、风险或任务后，这里会保留最近分析路径。
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t p-3" style={{ borderColor: "var(--border-subtle)" }}>
        <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>数据资产</p>
        {files.map((file) => (
          <div key={file.id} className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2">
            <FileSpreadsheet size={14} style={{ color: "var(--brand)" }} />
            <span className="truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>{file.originalName}</span>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
}

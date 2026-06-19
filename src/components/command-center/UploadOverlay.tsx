import { useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { fieldTypeColors, fieldTypeLabels, toFieldType } from "@/lib/field-display";
import { summarizeFieldConfirmation, type FieldConfirmationStatus } from "@/lib/field-confirmation-workflow";
import { fileTypeLabels } from "@/lib/file-upload-workflow";
import {
  toneStyles,
  type CommandFieldItem,
  type CommandFileItem,
  type UploadOverlayTab,
  type UploadOutcome,
} from "@/lib/command-center-view";

interface UploadOverlayProps {
  files: CommandFileItem[];
  fields: CommandFieldItem[];
  isDemo: boolean;
  isProcessing: boolean;
  processingLabel: string | null;
  uploadOutcome: UploadOutcome | null;
  canGenerateDiagnosis: boolean;
  hasDiagnosis: boolean;
  isGeneratingDiagnosis: boolean;
  activeTab: UploadOverlayTab;
  onClose: () => void;
  onActiveTabChange: (tab: UploadOverlayTab) => void;
  onUploadFile: (file: File) => void;
  onGenerateDiagnosis: () => void;
  onConfirmField: (field: CommandFieldItem, status: FieldConfirmationStatus) => void;
}

export function UploadOverlay({
  files,
  fields,
  isDemo,
  isProcessing,
  processingLabel,
  uploadOutcome,
  canGenerateDiagnosis,
  hasDiagnosis,
  isGeneratingDiagnosis,
  activeTab,
  onClose,
  onActiveTabChange,
  onUploadFile,
  onGenerateDiagnosis,
  onConfirmField,
}: UploadOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const { confirmedCount, pendingCount, ignoredCount, lowConfidenceCount } = summarizeFieldConfirmation(fields);
  const processedCount = files.filter((file) => file.status === "processed").length;
  const errorCount = files.filter((file) => file.status === "error").length;
  const qualityScore = Math.max(62, Math.min(98, Math.round(
    72
      + processedCount * 8
      + confirmedCount * 2
      - pendingCount * 4
      - errorCount * 10
      - lowConfidenceCount * 3,
  )));

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(onUploadFile);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-end bg-slate-900/12 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="m-5 flex h-[calc(100%-40px)] w-[520px] flex-col overflow-hidden rounded-xl border bg-white shadow-2xl" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>数据资产浮窗</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>上传资料、字段确认、数据质量检查都在当前工作台完成</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="关闭上传浮窗">
            <X size={16} />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2 px-5 py-4">
          {[
            { id: "upload" as const, label: "上传资料" },
            { id: "fields" as const, label: "字段确认" },
            { id: "quality" as const, label: "数据质量" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onActiveTabChange(tab.id)}
              className="rounded-lg border px-3 py-2 text-xs font-medium"
              style={{
                color: activeTab === tab.id ? "var(--brand)" : "var(--text-muted)",
                borderColor: activeTab === tab.id ? "rgba(37,99,235,0.24)" : "var(--border-subtle)",
                background: activeTab === tab.id ? "rgba(37,99,235,0.08)" : "#fff",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
          {activeTab === "upload" ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onClick={() => {
                  if (isProcessing) return;
                  if (isDemo) {
                    toast.info("本地单用户模式展示样例链路，不保存上传文件");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="rounded-xl border border-dashed p-8 text-center transition-colors"
                style={{
                  borderColor: dragActive ? "var(--brand)" : "rgba(37,99,235,0.28)",
                  background: dragActive ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)",
                  cursor: isProcessing ? "wait" : "pointer",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(37,99,235,0.1)", color: "var(--brand)" }}>
                  {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {isProcessing ? `正在处理 ${processingLabel ?? "文件"}` : "拖入 Excel / CSV 经营数据"}
                </p>
                <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                  {isDemo
                    ? "本地单用户模式展示样例链路，上传入口可见但不会保存更改。"
                    : "上传后会解析表头、识别字段、生成指标；诊断结果可在工作台重新生成。"}
                </p>
                <button
                  disabled={isProcessing}
                  className="mt-5 rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-60"
                  style={{ background: "var(--brand)", color: "white" }}
                >
                  {isProcessing ? "处理中..." : "选择文件"}
                </button>
              </div>

              {uploadOutcome ? (
                <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "rgba(15,118,110,0.2)", background: "rgba(15,118,110,0.06)" }}>
                  <div className="mb-3 flex items-start gap-3">
                    <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{uploadOutcome.fileName} 已完成处理</p>
                      <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>
                        {uploadOutcome.autoAnalyzed ? "字段已识别，指标已生成。下一步可以基于最新指标刷新经营诊断。" : "字段已识别，但指标不足以自动分析。请补充数据或确认字段。"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onGenerateDiagnosis}
                    disabled={!canGenerateDiagnosis || isGeneratingDiagnosis || !uploadOutcome.autoAnalyzed}
                    className="w-full rounded-lg px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "var(--brand)", color: "white" }}
                  >
                    {isGeneratingDiagnosis ? "正在生成诊断..." : hasDiagnosis ? "用最新数据重新诊断" : "生成经营诊断"}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "fields" ? (
            <div>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {[
                  { label: "已确认", value: confirmedCount, color: "var(--success)" },
                  { label: "待确认", value: pendingCount, color: "var(--warning)" },
                  { label: "已忽略", value: ignoredCount, color: "var(--text-muted)" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)", background: "#fff" }}>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                    <p className="mt-1 text-lg font-semibold data-mono" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pr-1">
                {fields.map((field) => {
                  const type = toFieldType(field.fieldType);
                  return (
                    <div key={field.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)", background: "#fff" }}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{field.originalField}</p>
                        <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: fieldTypeColors[type].bg, color: fieldTypeColors[type].text }}>
                          {fieldTypeLabels[type]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>映射为：{field.mappedField || "待确认"}</p>
                        <span className="shrink-0 text-[10px] data-mono" style={{ color: Number(field.confidence ?? 0) >= 0.85 ? "var(--success)" : "var(--warning)" }}>
                          {field.confidence ? `${(Number(field.confidence) * 100).toFixed(0)}%` : "-"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                          className="rounded-full px-2 py-1 text-[10px]"
                          style={{
                            color: field.isConfirmed === "confirmed" ? "var(--success)" : field.isConfirmed === "ignored" ? "var(--text-muted)" : "var(--warning)",
                            background: field.isConfirmed === "confirmed" ? "rgba(15,118,110,0.08)" : field.isConfirmed === "ignored" ? "rgba(100,116,139,0.08)" : "rgba(180,83,9,0.08)",
                          }}
                        >
                          {field.isConfirmed === "confirmed" ? "已确认" : field.isConfirmed === "ignored" ? "已忽略" : "待确认"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onConfirmField(field, "confirmed")}
                            disabled={field.isConfirmed === "confirmed"}
                            className="rounded-md border px-2 py-1 text-[10px] font-medium disabled:opacity-50"
                            style={{ borderColor: "rgba(15,118,110,0.22)", color: "var(--success)", background: "rgba(15,118,110,0.06)" }}
                          >
                            确认
                          </button>
                          <button
                            onClick={() => onConfirmField(field, "ignored")}
                            disabled={field.isConfirmed === "ignored"}
                            className="rounded-md border px-2 py-1 text-[10px] font-medium disabled:opacity-50"
                            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)", background: "#fff" }}
                          >
                            忽略
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {fields.length === 0 ? (
                  <div className="rounded-lg border px-3 py-8 text-center text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                    暂无字段识别结果，上传文件并处理后会显示字段映射
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab === "quality" ? (
            <div>
              <div className="rounded-xl border p-4" style={{ borderColor: qualityScore >= 85 ? "rgba(15,118,110,0.22)" : "rgba(180,83,9,0.2)", background: qualityScore >= 85 ? "rgba(15,118,110,0.06)" : "rgba(180,83,9,0.06)" }}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>数据可分析度</p>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>基于文件处理状态、字段确认率和低置信字段估算</p>
                  </div>
                  <p className="text-2xl font-semibold data-mono" style={{ color: qualityScore >= 85 ? "var(--success)" : "var(--warning)" }}>{qualityScore}</p>
                </div>
                <div className="h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full" style={{ width: `${qualityScore}%`, background: qualityScore >= 85 ? "var(--success)" : "var(--warning)" }} />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { label: "已处理文件", value: `${processedCount}/${files.length || 0}`, tone: processedCount > 0 ? "good" : "watch" },
                  { label: "字段确认率", value: fields.length ? `${Math.round((confirmedCount / fields.length) * 100)}%` : "-", tone: pendingCount === 0 && fields.length > 0 ? "good" : "watch" },
                  { label: "低置信字段", value: `${lowConfidenceCount}`, tone: lowConfidenceCount === 0 ? "good" : "risk" },
                  { label: "处理异常文件", value: `${errorCount}`, tone: errorCount === 0 ? "good" : "risk" },
                ].map((item) => {
                  const tone = toneStyles[item.tone as keyof typeof toneStyles];
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                      <span className="text-xs font-semibold data-mono" style={{ color: tone.color }}>{item.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)", background: "#fff" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>质量建议</p>
                <p className="mt-2 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>
                  {fields.length === 0
                    ? "先上传销售、费用或银行流水文件，系统会生成字段映射和基础指标。"
                    : pendingCount > 0 || lowConfidenceCount > 0
                      ? "优先确认低置信或待确认字段，避免收入、费用、现金流口径误判。"
                      : "当前字段和文件状态可以支撑经营诊断，可继续生成或刷新诊断。"}
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "upload" ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>最近数据集</p>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{files.filter((file) => file.status === "processed").length} 个已处理</span>
              </div>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border px-3 py-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet size={16} style={{ color: "var(--brand)" }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{file.originalName}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {fileTypeLabels[file.fileType] ?? "其他"} · {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "大小未知"}
                        </p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-1 text-[10px]"
                      style={{
                        color: file.status === "processed" ? "var(--success)" : file.status === "error" ? "var(--danger)" : "var(--brand)",
                        background: file.status === "processed" ? "rgba(15,118,110,0.08)" : file.status === "error" ? "rgba(220,38,38,0.08)" : "rgba(37,99,235,0.08)",
                      }}
                    >
                      {file.status === "processed" ? "已处理" : file.status === "error" ? "错误" : "处理中"}
                    </span>
                  </div>
                ))}
                {files.length === 0 ? (
                  <div className="rounded-lg border px-3 py-6 text-center text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                    暂无文件，上传 Excel / CSV 后会显示处理状态
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

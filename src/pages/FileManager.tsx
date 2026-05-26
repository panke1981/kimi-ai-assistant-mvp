import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Upload, FileText, Trash2, FileSpreadsheet, File,
  CheckCircle2, AlertCircle, Loader2, Plus,
} from "lucide-react";

const fileTypeLabels: Record<string, string> = {
  financial: "财务数据", bank_statement: "银行流水", sales: "销售数据",
  inventory: "库存数据", contract: "合同", ad_spend: "广告投放", other: "其他",
};
const fileTypeIcons: Record<string, React.ElementType> = {
  financial: FileSpreadsheet, bank_statement: FileSpreadsheet, sales: FileSpreadsheet,
  inventory: FileSpreadsheet, contract: FileText, ad_spend: FileSpreadsheet, other: File,
};

interface ParsedFile {
  headers: string[];
  previewRows: Record<string, any>[];
  rowCount: number;
}

export default function FileManager() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: companies } = trpc.company.list.useQuery();
  const { data: periods } = trpc.period.list.useQuery(
    { companyId: selectedCompany ?? 0 }, { enabled: !!selectedCompany }
  );
  const { data: fileList } = trpc.file.list.useQuery(
    { periodId: selectedPeriod ?? 0 }, { enabled: !!selectedPeriod }
  );

  const uploadFile = trpc.file.upload.useMutation({
    onSuccess: () => utils.file.list.invalidate({ periodId: selectedPeriod ?? 0 }),
  });
  const deleteFile = trpc.file.delete.useMutation({
    onSuccess: () => utils.file.list.invalidate({ periodId: selectedPeriod ?? 0 }),
  });
  const processFile = trpc.parse.processFile.useMutation({
    onSuccess: (data) => {
      if (data.autoAnalyzed) {
        utils.metric.list.invalidate({ periodId: selectedPeriod ?? 0 });
        utils.field.list.invalidate({ companyId: selectedCompany ?? 0 });
      }
      utils.file.list.invalidate({ periodId: selectedPeriod ?? 0 });
      setProcessingFile(null);
    },
    onError: () => setProcessingFile(null),
  });

  useEffect(() => { if (companies?.length && !selectedCompany) setSelectedCompany(companies[0].id); }, [companies, selectedCompany]);
  useEffect(() => { if (periods?.length && !selectedPeriod) setSelectedPeriod(periods[0].id); }, [periods, selectedPeriod]);

  // ─── Parse Excel/CSV ───────────────────────────────────
  const parseExcelFile = (file: File): Promise<ParsedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as unknown[][];

          if (jsonData.length < 2) {
            reject(new Error("文件内容为空或格式不正确"));
            return;
          }

          const headers = jsonData[0].map((h) => String(h).trim());
          const rows = jsonData.slice(1, 51); // First 50 data rows
          const previewRows = rows.map((row) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
            return obj;
          });

          resolve({ headers, previewRows, rowCount: jsonData.length - 1 });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // ─── Handle File Upload + Parse ────────────────────────
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFile = async (file: File) => {
    if (!selectedPeriod || !selectedCompany) return;

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`文件过大，请上传小于 10MB 的文件`);
      return;
    }

    // Empty file check
    if (file.size === 0) {
      toast.error("文件为空，请上传有效文件");
      return;
    }

    const id = `${file.name}-${Date.now()}`;
    setProcessingFile(id);

    try {
      // Step 1: Parse Excel/CSV
      let parsed: ParsedFile;
      if (file.name.endsWith(".csv")) {
        // Parse CSV manually
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const previewRows = lines.slice(1, 51).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => { obj[h] = values[i] ?? null; });
          return obj;
        });
        parsed = { headers, previewRows, rowCount: lines.length - 1 };
      } else {
        parsed = await parseExcelFile(file);
      }

      // Step 2: Upload raw file
      const base64 = await fileToBase64(file);
      const fileType = detectFileType(file.name);
      const uploadResult = await uploadFile.mutateAsync({
        periodId: selectedPeriod,
        companyId: selectedCompany,
        name: file.name,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileType,
        size: file.size,
        base64Content: base64,
      });

      // Step 3: Send parsed data to backend for AI processing
      await processFile.mutateAsync({
        fileId: uploadResult.id,
        companyId: selectedCompany,
        periodId: selectedPeriod,
        headers: parsed.headers,
        previewRows: parsed.previewRows,
      });
    } catch (err) {
      console.error("File processing failed:", err);
      setProcessingFile(null);
      toast.error(err instanceof Error ? err.message : "文件处理失败，请重试");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!selectedPeriod) return;
    Array.from(e.dataTransfer.files).forEach((f) => {
      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv")) {
        handleFile(f);
      }
    });
  }, [selectedPeriod]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedPeriod) return;
    Array.from(e.target.files).forEach(handleFile);
    e.target.value = "";
  };

  function detectFileType(filename: string): "financial" | "bank_statement" | "sales" | "inventory" | "contract" | "ad_spend" | "other" {
    const lower = filename.toLowerCase();
    if (lower.includes("ad") || lower.includes("广告") || lower.includes("投放")) return "ad_spend";
    if (lower.includes("bank") || lower.includes("银行") || lower.includes("流水")) return "bank_statement";
    if (lower.includes("sale") || lower.includes("销售") || lower.includes("订单") || lower.includes("交易")) return "sales";
    if (lower.includes("inv") || lower.includes("库存") || lower.includes("存货")) return "inventory";
    if (lower.includes("contract") || lower.includes("合同")) return "contract";
    if (lower.includes("fin") || lower.includes("财务") || lower.includes("记账")) return "financial";
    return "other";
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-light mb-1" style={{ color: "var(--text-primary)" }}>资料库</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          上传 Excel 或 CSV，AI 自动解析字段并计算经营指标
        </p>
      </div>

      {/* Selectors */}
      <div className="flex gap-4 mb-6">
        {companies?.length ? (
          <>
            <select value={selectedCompany ?? ""} onChange={(e) => { setSelectedCompany(Number(e.target.value)); setSelectedPeriod(null); }}
              className="px-4 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={selectedPeriod ?? ""} onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="px-4 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
              <option value="">选择月份</option>
              {periods?.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </>
        ) : (
          <button onClick={() => navigate("/company/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ color: "var(--brand)", borderColor: "rgba(167, 139, 250, 0.3)" }}>
            <Plus size={14} />
            创建企业以开始
          </button>
        )}
      </div>

      {/* Upload Zone */}
      {selectedPeriod ? (
        <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="relative mb-8 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200"
          style={{ borderColor: dragActive ? "var(--brand)" : "var(--border-default)", background: dragActive ? "rgba(167, 139, 250, 0.03)" : "var(--bg-input)" }}>
          <input ref={fileInputRef} type="file" multiple accept=".xlsx,.xls,.csv" onChange={onFileInputChange} className="hidden" />
          {processingFile ? (
            <>
              <Loader2 size={24} className="mx-auto mb-3 animate-spin" style={{ color: "var(--brand)" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>AI 正在解析数据并识别字段...</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>提取表头 → 字段识别 → 指标计算</p>
            </>
          ) : (
            <>
              <Upload size={24} style={{ color: "var(--text-muted)" }} className="mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>拖拽文件到此处，或点击上传</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>支持 Excel (.xlsx, .xls)、CSV 格式</p>
            </>
          )}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border p-8 text-center" style={{ borderColor: "var(--border-default)", background: "var(--bg-input)" }}>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>请选择企业和月份后开始上传</p>
        </div>
      )}

      {/* File List */}
      {fileList && fileList.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["文件名", "类型", "状态", "大小", "操作"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-normal" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fileList.map((f) => {
                const Icon = fileTypeIcons[f.fileType] || File;
                const isProcessing = f.status === "uploading" || f.status === "processing";
                return (
                  <tr key={f.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Icon size={16} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
                        <div>
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.originalName}</p>
                          <p className="text-[10px] data-mono" style={{ color: "var(--text-disabled)" }}>
                            {new Date(f.createdAt).toLocaleDateString("zh-CN")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-md" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
                        {fileTypeLabels[f.fileType] || "其他"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {f.status === "processed" ? (
                          <><CheckCircle2 size={12} style={{ color: "var(--success)" }} /><span className="text-xs" style={{ color: "var(--success)" }}>已处理</span>
                            {f.aiRecognizedFields && Array.isArray(f.aiRecognizedFields) && (
                              <span className="text-[10px] data-mono" style={{ color: "var(--text-disabled)" }}>{f.aiRecognizedFields.length} 个字段</span>
                            )}
                          </>
                        ) : isProcessing ? (
                          <><Loader2 size={12} className="animate-spin" style={{ color: "var(--brand)" }} /><span className="text-xs" style={{ color: "var(--brand)" }}>处理中</span></>
                        ) : f.status === "error" ? (
                          <><AlertCircle size={12} style={{ color: "var(--danger)" }} /><span className="text-xs" style={{ color: "var(--danger)" }}>错误</span></>
                        ) : (
                          <><span className="text-xs" style={{ color: "var(--text-muted)" }}>待处理</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs data-mono" style={{ color: "var(--text-muted)" }}>
                        {f.size ? `${(f.size / 1024).toFixed(1)} KB` : "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={(e) => { e.stopPropagation(); deleteFile.mutate({ id: f.id }); }}
                        className="p-1 transition-colors" style={{ color: "var(--text-muted)" }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {fileList && fileList.length === 0 && selectedPeriod && (
        <div className="text-center py-16">
          <File size={32} style={{ color: "var(--border-hover)" }} className="mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>暂无文件</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>拖拽或点击上方区域上传文件</p>
        </div>
      )}
    </div>
  );
}

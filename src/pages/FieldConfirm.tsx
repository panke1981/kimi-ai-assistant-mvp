import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useDemo, DEMO_FIELDS, DEMO_COMPANY } from "@/components/DemoProvider";
import {
  Check,
  X,
  Edit3,
  Brain,
  AlertCircle,
} from "lucide-react";

type FieldType = "revenue" | "cost" | "expense" | "profit" | "quantity" | "price" | "date" | "text" | "unknown";

const fieldTypeLabels: Record<string, string> = {
  revenue: "收入", cost: "成本", expense: "费用", profit: "利润",
  quantity: "数量", price: "价格", date: "日期", text: "文本", unknown: "未知",
};

const fieldTypeColors: Record<string, { bg: string; text: string }> = {
  revenue:  { bg: "rgba(52, 211, 153, 0.12)", text: "#34D399" },
  cost:     { bg: "rgba(248, 113, 113, 0.12)", text: "#F87171" },
  expense:  { bg: "rgba(251, 191, 36, 0.12)", text: "#FBBF24" },
  profit:   { bg: "rgba(96, 165, 250, 0.12)", text: "#60A5FA" },
  quantity: { bg: "rgba(167, 139, 250, 0.12)", text: "#A78BFA" },
  price:    { bg: "rgba(251, 191, 36, 0.12)", text: "#FBBF24" },
  date:     { bg: "rgba(103, 232, 249, 0.12)", text: "#67E8F9" },
  text:     { bg: "rgba(156, 163, 175, 0.12)", text: "#9CA3AF" },
  unknown:  { bg: "rgba(42, 42, 42, 0.5)", text: "#666666" },
};

export default function FieldConfirm() {
  const { isDemo } = useDemo();
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMapped, setEditMapped] = useState("");
  const [editType, setEditType] = useState("");
  const utils = trpc.useUtils();

  const { data: companiesData } = trpc.company.list.useQuery(undefined, { enabled: !isDemo });
  const companies = isDemo ? [{ id: DEMO_COMPANY.id, name: DEMO_COMPANY.name }] : companiesData;
  const { data: fieldsData, isLoading } = trpc.field.list.useQuery(
    { companyId: selectedCompany ?? 0 },
    { enabled: !!selectedCompany }
  );


  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  const confirmField = trpc.field.confirm.useMutation({
    onSuccess: () => utils.field.list.invalidate({ companyId: selectedCompany ?? 0 }),
  });



  const handleConfirm = (id: number, type: string) => {
    confirmField.mutate({ id, fieldType: type as FieldType, isConfirmed: "confirmed" });
  };
  const handleIgnore = (id: number) => {
    confirmField.mutate({ id, fieldType: "unknown" as FieldType, isConfirmed: "ignored" });
  };
  const handleEditSave = (id: number) => {
    confirmField.mutate(
      { id, mappedField: editMapped, fieldType: (editType || "unknown") as FieldType, isConfirmed: "confirmed" },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const demoFields = isDemo ? DEMO_FIELDS : [];
  const fields = isDemo ? demoFields : fieldsData;
  const pendingFields = fields?.filter((f) => f.isConfirmed === "pending") ?? [];
  const confirmedFields = (isDemo ? demoFields : fieldsData)?.filter((f) => f.isConfirmed === "confirmed") ?? [];


  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.1)" }}>
            <Brain size={14} style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-xl font-light" style={{ color: "var(--text-primary)" }}>AI 字段确认</h1>
        </div>
        <p className="text-sm ml-11" style={{ color: "var(--text-tertiary)" }}>
          AI 已识别数据字段，请确认或修正字段含义以建立企业专属字段字典
        </p>
      </div>

      {pendingFields.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <AlertCircle size={12} style={{ color: "var(--brand)" }} />
            待确认字段 ({pendingFields.length})
          </h2>
          <div className="space-y-2">
            {pendingFields.map((field) => (
              <div key={field.id} className="glass-panel rounded-lg p-4 border" style={{ borderColor: "rgba(167, 139, 250, 0.1)" }}>
                {editingId === field.id ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>原始字段名</p>
                      <p className="text-sm data-mono" style={{ color: "var(--text-primary)" }}>{field.originalField}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>映射为</p>
                      <input
                        type="text" value={editMapped} onChange={(e) => setEditMapped(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div className="w-32">
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>类型</p>
                      <select value={editType} onChange={(e) => setEditType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                      >
                        {Object.entries(fieldTypeLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-5">
                      <button onClick={() => handleEditSave(field.id)}
                        className="p-2 rounded-lg transition-colors" style={{ background: "rgba(167, 139, 250, 0.12)", color: "var(--brand)" }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="p-2 rounded-lg transition-colors" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>原始字段</p>
                        <p className="text-sm data-mono" style={{ color: "var(--text-primary)" }}>{field.originalField}</p>
                      </div>
                      <span style={{ color: "var(--border-hover)" }}>&#8594;</span>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>AI 建议映射</p>
                        <p className="text-sm data-mono" style={{ color: "var(--brand)" }}>{field.mappedField || "待确认"}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: fieldTypeColors[field.fieldType || "unknown"]?.bg,
                          color: fieldTypeColors[field.fieldType || "unknown"]?.text,
                        }}>
                        {fieldTypeLabels[field.fieldType || "unknown"]}
                      </span>
                      {field.confidence && (
                        <span className="text-[10px] data-mono" style={{ color: "var(--text-muted)" }}>
                          置信度 {(Number(field.confidence) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(field.id); setEditMapped(field.mappedField || field.originalField); setEditType(field.fieldType || "unknown"); }}
                        className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleConfirm(field.id, field.fieldType || "text")}
                        className="p-2 rounded-lg transition-colors" style={{ background: "rgba(52, 211, 153, 0.12)", color: "var(--success)" }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => handleIgnore(field.id)}
                        className="p-2 rounded-lg transition-colors" style={{ background: "rgba(248, 113, 113, 0.1)", color: "var(--danger)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmedFields.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <Check size={12} style={{ color: "var(--success)" }} />
            已确认字段 ({confirmedFields.length})
          </h2>
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  {["原始字段", "映射字段", "类型"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-normal" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confirmedFields.map((field) => (
                  <tr key={field.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="px-5 py-3 text-sm data-mono" style={{ color: "var(--text-secondary)" }}>{field.originalField}</td>
                    <td className="px-5 py-3 text-sm data-mono" style={{ color: "var(--brand)" }}>{field.mappedField || "-"}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: fieldTypeColors[field.fieldType || "unknown"]?.bg,
                          color: fieldTypeColors[field.fieldType || "unknown"]?.text,
                        }}>
                        {fieldTypeLabels[field.fieldType || "unknown"]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingFields.length === 0 && confirmedFields.length === 0 && !isLoading && !isDemo && (
        <div className="text-center py-20">
          <Brain size={32} style={{ color: "var(--border-hover)" }} className="mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>暂无字段数据</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>请先上传文件并让 AI 识别字段</p>
        </div>
      )}
    </div>
  );
}

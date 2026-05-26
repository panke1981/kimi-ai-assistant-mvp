import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useDemo, DEMO_COMPANY, DEMO_METRICS } from "@/components/DemoProvider";
import {
  Send, Bot, User, Loader2,
  TrendingUp, PiggyBank, Target, Users,
} from "lucide-react";

const quickPrompts = [
  { icon: TrendingUp, label: "分析收入趋势", prompt: "分析一下我们的收入趋势" },
  { icon: PiggyBank, label: "现金流分析", prompt: "分析一下现金流状况" },
  { icon: Target, label: "成本优化", prompt: "有哪些可以优化成本的地方" },
  { icon: Users, label: "人效分析", prompt: "分析一下人均产值和人效" },
];

interface ChatMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
}

// Demo response generator
function generateDemoResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  const revenue = DEMO_METRICS.find(m => m.name === "营业收入");
  const grossProfit = DEMO_METRICS.find(m => m.name === "毛利润");
  const netProfit = DEMO_METRICS.find(m => m.name === "净利润");
  const grossMargin = DEMO_METRICS.find(m => m.name === "毛利率");
  const netMargin = DEMO_METRICS.find(m => m.name === "净利率");
  const cost = DEMO_METRICS.find(m => m.name === "商品成本");
  const expense = DEMO_METRICS.find(m => m.name === "运营费用");
  const aov = DEMO_METRICS.find(m => m.name === "客单价");
  const qty = DEMO_METRICS.find(m => m.name === "销售数量");
  const txn = DEMO_METRICS.find(m => m.name === "交易笔数");
  const costRatio = DEMO_METRICS.find(m => m.name === "成本率");
  const expenseRatio = DEMO_METRICS.find(m => m.name === "费用率");

  if (msg.includes("收入") || msg.includes("营收")) {
    return `**收入趋势分析**

${DEMO_COMPANY.name} 本期营业收入为 **${revenue ? Number(revenue.value).toLocaleString() : "-"} 元**
- 交易笔数：${txn ? Number(txn.value).toLocaleString() : "-"} 笔
- 平均客单价：${aov ? aov.value : "-"} 元
- 总销售件数：${qty ? Number(qty.value).toLocaleString() : "-"} 件
- 环比增长：${revenue ? "+" + revenue.changePercent + "%" : "-"}

**评价**：收入规模良好，增长势头稳健。客单价处于合理区间，建议关注复购率和客户留存。`;
  }

  if (msg.includes("利润") || msg.includes("毛利") || msg.includes("净利")) {
    return `**利润分析**

| 指标 | 数值 |
|------|------|
| 毛利润 | ${grossProfit ? "¥" + Number(grossProfit.value).toLocaleString() : "-"} |
| 毛利率 | ${grossMargin ? grossMargin.value + "%" : "-"} |
| 净利润 | ${netProfit ? "¥" + Number(netProfit.value).toLocaleString() : "-"} |
| 净利率 | ${netMargin ? netMargin.value + "%" : "-"} |

**评价**：净利率 ${netMargin ? netMargin.value : "-"}%，${Number(netMargin?.value) >= 20 ? "盈利能力**优秀**，企业盈利强劲。" : Number(netMargin?.value) >= 10 ? "盈利能力**良好**，处于健康水平。" : "利润率一般，有提升空间。"}`;
  }

  if (msg.includes("成本")) {
    return `**成本分析**

- 商品成本：${cost ? "¥" + Number(cost.value).toLocaleString() : "-"}（占收入 ${costRatio ? costRatio.value : "-"}%）
- 运营费用：${expense ? "¥" + Number(expense.value).toLocaleString() : "-"}（占收入 ${expenseRatio ? expenseRatio.value : "-"}%）
- 成本率：${costRatio ? costRatio.value : "-"}%

**评价**：${Number(costRatio?.value) > 70 ? "成本率偏高，建议优化供应链。" : "成本控制在合理区间。"} ${Number(expenseRatio?.value) > 20 ? "费用率偏高，建议审视各项开支。" : "费用控制良好。"}`;
  }

  if (msg.includes("人效") || msg.includes("人均")) {
    return `**人效分析**

基于现有数据推算：
- 营业收入：${revenue ? "¥" + Number(revenue.value).toLocaleString() : "-"}
- 交易笔数：${txn ? Number(txn.value).toLocaleString() : "-"} 笔
- 客单价：${aov ? aov.value : "-"} 元

**建议**：如需精确的人效分析，建议补充员工人数数据。我可以为您计算人均产值、人均利润等指标。`;
  }

  if (msg.includes("你好") || msg.includes("您好")) {
    return `您好！我是 ${DEMO_COMPANY.name} 的 AI 经营助手。

目前掌握的 2026年4月 经营数据：
- 营业收入：**${revenue ? "¥" + Number(revenue.value).toLocaleString() : "-"}**
- 净利润：**${netProfit ? "¥" + Number(netProfit.value).toLocaleString() : "-"}**（净利率 ${netMargin ? netMargin.value : "-"}%）

您可以问我：
- 📊 收入趋势分析
- 💰 利润和毛利率
- 📉 成本结构分析
- 👥 人效分析
- ⚠️ 经营风险提示

请直接输入您关心的问题！`;
  }

  if (msg.includes("指标") || msg.includes("概况")) {
    return `${DEMO_COMPANY.name} 核心经营指标（2026年4月）：

${DEMO_METRICS.map(m => `- **${m.name}**：${m.unit === "%" ? m.value + "%" : m.unit === "笔" || m.unit === "件" ? Number(m.value).toLocaleString() : "¥" + Number(m.value).toLocaleString()}${m.unit !== "%" ? " " + m.unit : ""}`).join("\n")}

所有指标均基于已上传的经营数据自动计算。`;
  }

  return `感谢您的提问！我已掌握 ${DEMO_COMPANY.name} 的经营数据。

目前已知指标包括：营业收入、商品成本、运营费用、毛利润、净利润、毛利率、净利率、销售数量、客单价等。

您可以尝试问：
- "分析一下收入趋势"
- "利润情况怎么样"
- "成本结构如何"
- "查看全部指标"

请问有什么我可以帮您的？`;
}

export default function AIAssistant() {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [demoMessages, setDemoMessages] = useState<ChatMessage[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const { isDemo } = useDemo();

  const { data: companies } = trpc.company.list.useQuery(undefined, { enabled: !isDemo });
  const { data: history } = trpc.ai.getHistory.useQuery(
    { companyId: selectedCompany ?? 0 },
    { enabled: !!selectedCompany && !isDemo }
  );

  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  const sendMessage = trpc.ai.sendMessage.useMutation({
    onSuccess: () => {
      utils.ai.getHistory.invalidate({ companyId: selectedCompany ?? 0 });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, demoMessages, demoLoading]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;

    if (isDemo) {
      const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: message.trim() };
      setDemoMessages(prev => [...prev, userMsg]);
      setMessage("");
      setDemoLoading(true);

      // Simulate AI thinking delay
      setTimeout(() => {
        const response = generateDemoResponse(userMsg.content);
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
        setDemoMessages(prev => [...prev, aiMsg]);
        setDemoLoading(false);
      }, 600);
    } else {
      if (!selectedCompany || sendMessage.isPending) return;
      sendMessage.mutate({ companyId: selectedCompany, content: message.trim() });
    }
  }, [message, isDemo, selectedCompany, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isDemo) {
      setMessage(prompt);
      // Auto send after a brief delay
      setTimeout(() => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: prompt };
        setDemoMessages(prev => [...prev, userMsg]);
        setDemoLoading(true);
        setTimeout(() => {
          const response = generateDemoResponse(prompt);
          const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
          setDemoMessages(prev => [...prev, aiMsg]);
          setDemoLoading(false);
        }, 600);
      }, 100);
    } else {
      if (!selectedCompany || sendMessage.isPending) return;
      sendMessage.mutate({ companyId: selectedCompany, content: prompt });
    }
  };

  // Use demo messages or real history
  const messages = isDemo ? demoMessages : (history || []);
  const isLoading = isDemo ? demoLoading : sendMessage.isPending;
  const companyName = isDemo ? DEMO_COMPANY.name : (companies?.[0]?.name || "企业");

  return (
    <div className="h-[calc(100vh-72px)] md:h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(59,130,246,0.15))" }}>
              <Bot size={20} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <h1 className="text-lg font-light" style={{ color: "var(--text-primary)" }}>AI 经营助手</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--success)" }} />
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>在线</span>
              </div>
            </div>
          </div>

          {isDemo ? (
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: "rgba(167, 139, 250, 0.1)", color: "var(--brand)" }}>
              {companyName}
            </span>
          ) : (
            companies && companies.length > 0 && (
              <select value={selectedCompany ?? ""} onChange={(e) => setSelectedCompany(Number(e.target.value))}
                className="px-4 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(59,130,246,0.12))" }}>
                <Bot size={28} style={{ color: "var(--brand)" }} />
              </div>
              <h2 className="text-lg font-light mb-2" style={{ color: "var(--text-primary)" }}>
                您好，我是 {companyName} 的 AI 经营助手
              </h2>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--text-tertiary)" }}>
                我可以帮您分析经营数据、发现风险、优化策略。
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                {quickPrompts.map((p) => (
                  <button key={p.label} onClick={() => handleQuickPrompt(p.prompt)}
                    disabled={isLoading}
                    className="flex items-center gap-3 p-4 rounded-xl glass-panel text-left transition-all disabled:opacity-50 border"
                    style={{ borderColor: "var(--border-default)" }}>
                    <p.icon size={16} style={{ color: "var(--brand)" }} className="flex-shrink-0" />
                    <div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.label}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{p.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg: ChatMessage) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(59,130,246,0.15))" }}>
                  <Bot size={14} style={{ color: "var(--brand)" }} />
                </div>
              )}
              <div className="max-w-[70%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap"
                style={msg.role === "user"
                  ? { background: "var(--brand)", color: "#050505" }
                  : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }
                }>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "var(--bg-hover)" }}>
                  <User size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(59,130,246,0.15))" }}>
                <Bot size={14} style={{ color: "var(--brand)" }} />
              </div>
              <div className="glass-panel rounded-2xl px-5 py-3.5" style={{ border: "1px solid var(--border-default)" }}>
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" style={{ color: "var(--brand)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>AI 思考中...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 md:p-6 border-t" style={{ borderColor: "var(--border-default)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isDemo ? "输入经营分析问题..." : (selectedCompany ? "输入经营分析问题..." : "请先创建企业")}
              disabled={isLoading}
              className="flex-1 px-5 py-3 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
            <button onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="px-5 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--brand)", color: "#050505" }}>
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ color: "var(--text-disabled)" }}>
            AI 经营助手基于您上传的数据提供分析建议，不构成专业财务意见
          </p>
        </div>
      </div>
    </div>
  );
}

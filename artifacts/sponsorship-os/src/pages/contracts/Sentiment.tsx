import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAnalyzeSentiment, useListSentimentAnalyses } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, ChevronRight, TrendingUp, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowraLogo } from "@/components/FlowraLogo";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "text-accent bg-accent/10 border-accent/20",
  neutral: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  negative: "text-destructive bg-destructive/10 border-destructive/20",
  mixed: "text-primary bg-primary/10 border-primary/20",
};
const RISK_COLOR: Record<string, string> = {
  low: "text-accent",
  medium: "text-primary",
  high: "text-destructive",
};

export default function Sentiment() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [currentResult, setCurrentResult] = useState<any>(null);

  const analyzeMutation = useAnalyzeSentiment();
  const { data: history, isLoading: isHistoryLoading, refetch } = useListSentimentAnalyses(id!, { query: { enabled: !!id } as any });

  const handleAnalyze = () => {
    if (!input.trim()) return;
    analyzeMutation.mutate(
      { data: { rawInput: input, contractId: id } },
      {
        onSuccess: (res) => {
          setCurrentResult(res);
          setInput("");
          refetch();
        },
        onError: (err: any) => toast({ title: "Analysis failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in pb-20">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
          <Link href={`/app/contracts/${id}`} className="hover:text-primary transition-colors">CONTRACT</Link>
          <ChevronRight className="h-3 w-3" />
          <span>SENTIMENT ANALYSIS</span>
        </div>
        <h1 className="font-editorial text-4xl font-light">Sentiment Analysis</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">Paste brand emails or messages to detect tone, payment risk, and scope creep signals.</p>
      </div>

      <div className="glass-card p-6 relative overflow-hidden group focus-within:border-primary/40 focus-within:shadow-[0_0_30px_-10px_rgba(255,184,0,0.2)] transition-all duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <MessageSquare className="h-24 w-24" />
        </div>
        <Textarea
          placeholder="Paste a brand email, Slack message, or any communication here…"
          className="min-h-[180px] resize-none font-mono text-sm bg-transparent border-0 focus-visible:ring-0 p-0 text-foreground/90 leading-relaxed placeholder:text-muted-foreground/50 relative z-10"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-2 relative z-10">
          <p className="text-xs font-mono text-muted-foreground">{input.length} CHARACTERS</p>
          <button
            onClick={handleAnalyze}
            disabled={!input.trim() || analyzeMutation.isPending}
            className="h-10 px-6 rounded-lg btn-glow bg-primary text-primary-foreground font-semibold flex items-center transition-all disabled:opacity-50 text-sm hover:bg-primary/90"
          >
            {analyzeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            Analyze Text
          </button>
        </div>
      </div>

      {/* Current result */}
      {currentResult && (
        <div className="animate-fade-in-up">
          <h2 className="text-label mb-4 text-primary">ANALYSIS RESULTS</h2>
          <AnalysisResult result={currentResult} toast={toast} />
        </div>
      )}

      {/* History */}
      <div className="pt-8">
        <h2 className="text-label mb-4">ANALYSIS HISTORY</h2>
        {isHistoryLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : ((history as any[]) || []).length === 0 ? (
          <div className="glass-card border-dashed border-white/[0.1] py-16 flex flex-col items-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-4 opacity-50" />
            <p className="text-sm">No analyses yet. Paste a message above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {((history as any[]) || []).map((item: any) => (
              <div 
                key={item.id} 
                className="glass-card p-4 cursor-pointer hover:bg-white/[0.04] transition-all duration-300 border-white/[0.05] hover:border-primary/30"
                onClick={() => setCurrentResult(item)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80 truncate font-mono mb-2">{item.rawInput?.slice(0, 80)}…</p>
                    <p className="text-xs text-muted-foreground font-mono">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <span className={`text-xs font-mono px-2 py-1 rounded border uppercase ${SENTIMENT_COLOR[item.sentiment] || "bg-white/[0.05] text-muted-foreground border-white/[0.1]"}`}>
                      {item.sentiment}
                    </span>
                    <span className="text-xs font-mono px-2 py-1 rounded border bg-white/[0.03] border-white/[0.1] text-foreground flex items-center gap-1.5 uppercase">
                      <span className={`w-2 h-2 rounded-full ${item.paymentRisk === 'low' ? 'bg-accent' : item.paymentRisk === 'medium' ? 'bg-primary' : 'bg-destructive'}`} />
                      RISK: {item.paymentRisk}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisResult({ result, toast }: { result: any; toast: any }) {
  const full = result.fullAnalysis || result;

  return (
    <div className="space-y-6">
      {/* Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "SENTIMENT", value: result.sentiment, className: SENTIMENT_COLOR[result.sentiment] || "" },
          { label: "URGENCY", value: result.urgencyLevel, className: RISK_COLOR[result.urgencyLevel] ? `${RISK_COLOR[result.urgencyLevel]} border-${RISK_COLOR[result.urgencyLevel].split('-')[1]}/30 bg-${RISK_COLOR[result.urgencyLevel].split('-')[1]}/10` : "" },
          { label: "PAYMENT RISK", value: result.paymentRisk, className: RISK_COLOR[result.paymentRisk] ? `${RISK_COLOR[result.paymentRisk]} border-${RISK_COLOR[result.paymentRisk].split('-')[1]}/30 bg-${RISK_COLOR[result.paymentRisk].split('-')[1]}/10` : "" },
          { label: "SCOPE CREEP", value: result.scopeCreepRisk, className: RISK_COLOR[result.scopeCreepRisk] ? `${RISK_COLOR[result.scopeCreepRisk]} border-${RISK_COLOR[result.scopeCreepRisk].split('-')[1]}/30 bg-${RISK_COLOR[result.scopeCreepRisk].split('-')[1]}/10` : "" },
        ].map(s => (
          <div key={s.label} className={`glass-card p-4 text-center border ${s.className || 'border-white/[0.05]'}`}>
            <p className="text-xs font-mono text-muted-foreground mb-2">{s.label}</p>
            <p className={`font-mono text-lg font-semibold uppercase ${s.className.split(" ")[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div className="grid md:grid-cols-2 gap-6">
        {Array.isArray(full.warning_signals) && full.warning_signals.length > 0 && (
          <div className="glass-card p-6 border-destructive/20 bg-destructive/5">
            <h3 className="text-label text-destructive flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4" />WARNING SIGNALS
            </h3>
            <ul className="space-y-2">
              {full.warning_signals.map((s: string, i: number) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-3">
                  <span className="mt-1 shrink-0 text-destructive">•</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(full.positive_signals) && full.positive_signals.length > 0 && (
          <div className="glass-card p-6 border-accent/20 bg-accent/5">
            <h3 className="text-label text-accent flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4" />POSITIVE SIGNALS
            </h3>
            <ul className="space-y-2">
              {full.positive_signals.map((s: string, i: number) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-3">
                  <span className="mt-1 shrink-0 text-accent">•</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tone + Recommendation */}
      <div className="grid md:grid-cols-2 gap-6">
        {full.tone_assessment && (
          <div className="glass-card p-6">
            <h3 className="text-label mb-3">TONE ASSESSMENT</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{full.tone_assessment}</p>
          </div>
        )}
        {result.toneRecommendation && (
          <div className="glass-card p-6 border-primary/20 bg-primary/5">
            <h3 className="text-label text-primary mb-3">YOUR RECOMMENDED TONE</h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{result.toneRecommendation}</p>
          </div>
        )}
      </div>

      {/* Suggested Reply */}
      {result.suggestedReply && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
            <h3 className="text-label">SUGGESTED REPLY</h3>
            <button 
              className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              onClick={() => { navigator.clipboard.writeText(result.suggestedReply); toast({ title: "Copied!" }); }}
            >
              <Copy className="h-3 w-3" />COPY TEXT
            </button>
          </div>
          <div className="p-6">
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground">
              {result.suggestedReply}
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      {Array.isArray(full.action_items) && full.action_items.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-label text-primary flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4" />ACTION ITEMS
          </h3>
          <ul className="space-y-3">
            {full.action_items.map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs font-mono px-2 py-1 rounded bg-white/[0.05] text-muted-foreground shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground/90 leading-relaxed">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

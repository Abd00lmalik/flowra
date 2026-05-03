import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAnalyzeSentiment, useListSentimentAnalyses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, ChevronRight, TrendingUp, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "text-green-400 bg-green-500/10 border-green-500/20",
  neutral: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  negative: "text-red-400 bg-red-500/10 border-red-500/20",
  mixed: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};
const RISK_COLOR: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href={`/app/contracts/${id}`} className="hover:text-foreground">Contract</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Sentiment Analysis</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sentiment Analysis</h1>
        <p className="text-muted-foreground mt-1">Paste brand emails or messages to detect tone, payment risk, and scope creep signals.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Textarea
            placeholder="Paste a brand email, Slack message, or any communication here…"
            className="min-h-[160px] resize-none font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{input.length} characters</p>
            <Button onClick={handleAnalyze} disabled={!input.trim() || analyzeMutation.isPending}>
              {analyzeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current result */}
      {currentResult && (
        <AnalysisResult result={currentResult} toast={toast} />
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Analysis History</h2>
        {isHistoryLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : ((history as any[]) || []).length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>No analyses yet. Paste a message above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {((history as any[]) || []).map((item: any) => (
              <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setCurrentResult(item)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate font-mono">{item.rawInput?.slice(0, 100)}…</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="outline" className={`text-xs ${SENTIMENT_COLOR[item.sentiment] || ""}`}>{item.sentiment}</Badge>
                      <Badge variant="outline" className={`text-xs ${RISK_COLOR[item.paymentRisk] || ""}`}>💰 {item.paymentRisk}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    <div className="space-y-4">
      {/* Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sentiment", value: result.sentiment, className: SENTIMENT_COLOR[result.sentiment] || "" },
          { label: "Urgency", value: result.urgencyLevel, className: RISK_COLOR[result.urgencyLevel] || "" },
          { label: "Payment Risk", value: result.paymentRisk, className: RISK_COLOR[result.paymentRisk] || "" },
          { label: "Scope Creep", value: result.scopeCreepRisk, className: RISK_COLOR[result.scopeCreepRisk] || "" },
        ].map(s => (
          <Card key={s.label} className={`border ${s.className}`}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`font-bold capitalize mt-1 ${s.className.split(" ")[0]}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signals */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.isArray(full.warning_signals) && full.warning_signals.length > 0 && (
          <Card className="border-red-500/20">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" />Warning Signals</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {full.warning_signals.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-red-300 flex items-start gap-2"><span className="mt-1 shrink-0">•</span>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {Array.isArray(full.positive_signals) && full.positive_signals.length > 0 && (
          <Card className="border-green-500/20">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" />Positive Signals</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {full.positive_signals.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-green-300 flex items-start gap-2"><span className="mt-1 shrink-0">•</span>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tone + Recommendation */}
      <div className="grid md:grid-cols-2 gap-4">
        {full.tone_assessment && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Tone Assessment</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{full.tone_assessment}</p></CardContent>
          </Card>
        )}
        {result.toneRecommendation && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Your Recommended Tone</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{result.toneRecommendation}</p></CardContent>
          </Card>
        )}
      </div>

      {/* Suggested Reply */}
      {result.suggestedReply && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Suggested Reply</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result.suggestedReply); toast({ title: "Copied!" }); }}>
                <Copy className="h-4 w-4 mr-1" />Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">{result.suggestedReply}</div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {Array.isArray(full.action_items) && full.action_items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Action Items</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {full.action_items.map((a: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{i + 1}</Badge>
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

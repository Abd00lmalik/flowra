import { useGetTaxSummary, useGetTaxHistory } from "@workspace/api-client-react";
import { Loader2, PiggyBank, TrendingUp, DollarSign, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FlowraLogo } from "@/components/FlowraLogo";

export default function TaxDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetTaxSummary();
  const { data: history, isLoading: isHistoryLoading } = useGetTaxHistory();

  if (isSummaryLoading || isHistoryLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const s = (summary as any) || {};
  const hist = ((history as any[]) || []);

  // Aggregate history by month
  const monthlyMap: Record<string, { gross: number; reserve: number; available: number }> = {};
  for (const entry of hist) {
    const month = entry.period || new Date(entry.createdAt).toISOString().slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { gross: 0, reserve: 0, available: 0 };
    monthlyMap[month].gross += Number(entry.grossAmount || 0);
    monthlyMap[month].reserve += Number(entry.reserveAmount || 0);
    monthlyMap[month].available += Number(entry.availableBalance || 0);
  }
  const chartData = Object.entries(monthlyMap).sort().slice(-12).map(([month, vals]) => ({
    month, ...vals,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-label mb-2">FINANCIAL INTELLIGENCE</p>
        <h1 className="font-editorial text-4xl font-light">Tax Reserve</h1>
        <p className="text-sm text-muted-foreground mt-2">Automatic tax tracking based on invoiced income.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "GROSS INCOME", value: `$${Number(s.totalGrossIncome || 0).toLocaleString()}`, accent: "text-foreground", icon: TrendingUp },
          { label: "TAX RESERVE", value: `$${Number(s.totalTaxReserve || 0).toLocaleString()}`, accent: "text-primary", icon: Shield },
          { label: "NET INCOME", value: `$${Number(s.totalNetIncome || 0).toLocaleString()}`, accent: "text-accent", icon: DollarSign },
          { label: "AVAILABLE", value: `$${Number(s.totalAvailableBalance || 0).toLocaleString()}`, accent: "text-foreground", icon: PiggyBank },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5 group hover:glow-amber transition-all duration-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.accent} opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />
            </div>
            <p className={`font-mono text-2xl font-bold tracking-tight ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="glass-card border-primary/20 p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">How Tax Reserve Works</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each time you receive a payment, Flowra automatically calculates your configured tax reserve percentage
              (default 30%) and sets it aside. This ensures you're never caught short at tax time.
              Adjust this percentage in Settings → Profile.
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-label mb-1">MONTHLY BREAKDOWN</p>
              <p className="text-sm text-muted-foreground">Income vs. tax reserve vs. available</p>
            </div>
            <div className="flex gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />GROSS</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#FFB800' }} />RESERVE</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#D4FF00' }} />AVAILABLE</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                  formatter={(v: any, name: string) => [`$${Number(v).toLocaleString()}`, name.toUpperCase()]}
                />
                <Bar dataKey="gross" name="gross" fill="#FFB800" opacity={0.6} radius={[4, 4, 0, 0]} />
                <Bar dataKey="reserve" name="reserve" fill="#FFB800" opacity={0.3} radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="available" fill="#D4FF00" opacity={0.5} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {hist.length > 0 && (
        <div className="glass-card p-6">
          <p className="text-label mb-4">TRANSACTION HISTORY</p>
          <div className="space-y-1">
            {hist.slice(0, 20).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm font-mono">{entry.period || new Date(entry.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground font-mono">RESERVE: {entry.reservePercent}%</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">${Number(entry.grossAmount).toLocaleString()}</p>
                  <p className="text-xs text-primary font-mono">-${Number(entry.reserveAmount).toLocaleString()} TAX</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

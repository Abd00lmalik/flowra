import { useGetTaxSummary, useGetTaxHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PiggyBank, TrendingUp, DollarSign, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TaxDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetTaxSummary();
  const { data: history, isLoading: isHistoryLoading } = useGetTaxHistory();

  if (isSummaryLoading || isHistoryLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const s = (summary as any) || {};
  const hist = ((history as any[]) || []);

  // Aggregate history by month for chart
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

  const stats = [
    { label: "Total Gross Income", value: `$${Number(s.totalGrossIncome || 0).toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { label: "Tax Reserve Set Aside", value: `$${Number(s.totalTaxReserve || 0).toLocaleString()}`, icon: Shield, color: "text-yellow-400" },
    { label: "Net Income", value: `$${Number(s.totalNetIncome || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
    { label: "Available to Spend", value: `$${Number(s.totalAvailableBalance || 0).toLocaleString()}`, icon: PiggyBank, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Reserve</h1>
        <p className="text-muted-foreground mt-1">Your automatic tax tracking based on invoiced income.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 bg-primary/5 border-primary/20 border rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">How Tax Reserve Works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Each time you receive a payment, SponsorshipOS automatically calculates your configured tax reserve percentage (default 30%) and sets it aside. This ensures you're never caught short at tax time. You can adjust this percentage in Settings → Profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Monthly Income Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    formatter={(v: any, name: string) => [`$${Number(v).toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Bar dataKey="gross" name="gross" fill="hsl(var(--primary))" opacity={0.7} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reserve" name="reserve" fill="#EAB308" opacity={0.7} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" name="available" fill="#22C55E" opacity={0.7} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 justify-center mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary opacity-70 inline-block" />Gross</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 opacity-70 inline-block" />Tax Reserve</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 opacity-70 inline-block" />Available</span>
            </div>
          </CardContent>
        </Card>
      )}

      {hist.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hist.slice(0, 20).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{entry.period || new Date(entry.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Reserve: {entry.reservePercent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${Number(entry.grossAmount).toLocaleString()}</p>
                    <p className="text-xs text-yellow-400">-${Number(entry.reserveAmount).toLocaleString()} tax</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

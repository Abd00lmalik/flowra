import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, useGetIncomeTrend, useGetUpcomingMilestones, useGetRiskAlerts } from "@workspace/api-client-react";
import { Loader2, DollarSign, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: trend } = useGetIncomeTrend();
  const { data: upcoming } = useGetUpcomingMilestones();
  const { data: risks } = useGetRiskAlerts();

  const s = (summary as any) || {};
  const trendData = (trend as any[]) || [];
  const upcomingList = (upcoming as any[]) || [];
  const riskData = (risks as any) || {};

  if (isSummaryLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Contract Value", value: `$${Number(s.totalContractValue || 0).toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: "Revenue Collected", value: `$${Number(s.paidRevenue || 0).toLocaleString()}`, icon: CheckCircle, color: "text-green-400" },
          { label: "Active Contracts", value: String(s.activeContractsCount || 0), icon: FileText, color: "text-blue-400" },
          { label: "Overdue Milestones", value: String(s.overdueMilestonesCount || 0), icon: AlertTriangle, color: s.overdueMilestonesCount > 0 ? "text-red-400" : "text-muted-foreground" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Income Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No income data yet.</p>
                  <p className="text-xs mt-1">Create and pay invoices to see trends.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingList.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No upcoming deadlines!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingList.slice(0, 6).map((m: any) => {
                  const due = new Date(m.dueDate);
                  const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysLeft <= 3;
                  return (
                    <Link key={m.id} href={`/app/contracts/${m.contractId}/milestones`}>
                      <div className="flex items-start justify-between gap-2 hover:bg-muted/30 rounded-lg p-2 cursor-pointer transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.contractTitle}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs shrink-0 ${isUrgent ? "text-red-400 border-red-500/30" : "text-muted-foreground"}`}>
                          {daysLeft}d
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {Array.isArray(riskData.overdueMilestones) && riskData.overdueMilestones.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Overdue Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskData.overdueMilestones.slice(0, 5).map((m: any) => (
                <Link key={m.id} href={`/app/contracts/${m.contractId}/milestones`}>
                  <div className="flex items-center justify-between hover:bg-red-500/5 rounded-lg p-2 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                    </div>
                    {m.paymentAmount && <span className="text-sm font-semibold text-red-400">${m.paymentAmount}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invoices */}
      {Number(s.pendingInvoicesCount) > 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{s.pendingInvoicesCount} pending invoice{s.pendingInvoicesCount > 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground">${Number(s.pendingInvoicesTotal || 0).toLocaleString()} awaiting payment</p>
            </div>
            <Link href="/app/invoices">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted/30">View</Badge>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

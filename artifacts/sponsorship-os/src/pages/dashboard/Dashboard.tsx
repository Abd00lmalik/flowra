import { useGetDashboardSummary, useGetIncomeTrend, useGetUpcomingMilestones, useGetRiskAlerts } from "@workspace/api-client-react";
import { Loader2, TrendingUp, FileText, CheckCircle, AlertTriangle, Clock, DollarSign, ArrowUpRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Link } from "wouter";
import { FlowraLogo } from "@/components/FlowraLogo";

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
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: "TOTAL CONTRACT VALUE",
      value: `$${Number(s.totalContractValue || 0).toLocaleString()}`,
      icon: FileText,
      accent: "text-foreground",
    },
    {
      label: "REVENUE COLLECTED",
      value: `$${Number(s.paidRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      accent: "text-accent",
    },
    {
      label: "ACTIVE CONTRACTS",
      value: String(s.activeContractsCount || 0),
      icon: CheckCircle,
      accent: "text-primary",
    },
    {
      label: "OVERDUE MILESTONES",
      value: String(s.overdueMilestonesCount || 0),
      icon: AlertTriangle,
      accent: Number(s.overdueMilestonesCount) > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-label mb-2">COMMAND CENTER</p>
          <h1 className="font-editorial text-4xl font-light">Dashboard</h1>
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((stat) => (
          <div key={stat.label} className="glass-card p-5 group hover:glow-amber transition-all duration-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
            </div>
            <p className={`font-mono text-3xl font-bold tracking-tight ${stat.accent}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-label mb-1">REVENUE TREND</p>
              <p className="text-sm text-muted-foreground">Monthly income over time</p>
            </div>
            {trendData.length > 0 && (
              <span className="text-xs font-mono text-accent flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> TRACKING
              </span>
            )}
          </div>
          {trendData.length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFB800" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FFB800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#FFB800' }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#FFB800"
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                    dot={{ r: 3, fill: "#FFB800", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#FFB800", strokeWidth: 2, stroke: "#000" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">No income data yet</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">CREATE INVOICES TO SEE TRENDS</p>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-label mb-1">UPCOMING</p>
              <p className="text-sm text-muted-foreground">Next 14 days</p>
            </div>
            <Clock className="h-4 w-4 text-primary opacity-60" />
          </div>
          {upcomingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="h-8 w-8 text-accent opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">All clear</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">NO DEADLINES</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingList.slice(0, 6).map((m: any) => {
                const due = new Date(m.dueDate);
                const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 3;
                return (
                  <Link key={m.id} href={`/app/contracts/${m.contractId}/milestones`}>
                    <div className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-all duration-500 border border-transparent hover:border-white/[0.06]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">{m.contractTitle}</p>
                      </div>
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        isUrgent
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-white/[0.04] text-muted-foreground"
                      }`}>
                        {daysLeft}D
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Risk Alerts */}
      {Array.isArray(riskData.overdueMilestones) && riskData.overdueMilestones.length > 0 && (
        <div className="glass-card border-destructive/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="status-dot status-dot-danger" />
            <p className="text-label text-destructive">OVERDUE MILESTONES</p>
          </div>
          <div className="space-y-2">
            {riskData.overdueMilestones.slice(0, 5).map((m: any) => (
              <Link key={m.id} href={`/app/contracts/${m.contractId}/milestones`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-destructive/5 cursor-pointer transition-all duration-500">
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      DUE: {new Date(m.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  {m.paymentAmount && (
                    <span className="font-mono text-sm font-semibold text-destructive">
                      ${Number(m.paymentAmount).toLocaleString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invoices Alert */}
      {Number(s.pendingInvoicesCount) > 0 && (
        <div className="glass-card border-primary/20 p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{s.pendingInvoicesCount} pending invoice{Number(s.pendingInvoicesCount) > 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground font-mono">
                ${Number(s.pendingInvoicesTotal || 0).toLocaleString()} AWAITING PAYMENT
              </p>
            </div>
            <Link href="/app/invoices">
              <span className="text-xs font-mono text-primary hover:text-primary/80 transition-colors duration-500 cursor-pointer">
                VIEW →
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

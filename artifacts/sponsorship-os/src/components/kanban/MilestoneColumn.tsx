import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MilestoneCard } from "./MilestoneCard";

interface Milestone {
  id: string;
  title: string;
  contractId?: string;
  contractTitle?: string;
  dueDate?: string | Date;
  paymentAmount?: string | number;
  status: string;
  description?: string;
}

interface MilestoneColumnProps {
  status: string;
  label: string;
  milestones: Milestone[];
  color?: string;
}

const STATUS_COLORS: Record<string, { bg: string; badge: string; icon: string }> = {
  planning: { bg: "bg-blue-500/10", badge: "border-blue-500/30", icon: "📋" },
  content_due: { bg: "bg-yellow-500/10", badge: "border-yellow-500/30", icon: "⏰" },
  posted: { bg: "bg-purple-500/10", badge: "border-purple-500/30", icon: "📱" },
  paid: { bg: "bg-green-500/10", badge: "border-green-500/30", icon: "✅" },
};

export function MilestoneColumn({ status, label, milestones, color }: MilestoneColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = STATUS_COLORS[status] || { bg: "bg-muted/30", badge: "border-border", icon: "•" };

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-96 max-w-full"
    >
      <Card className={`h-full ${config.bg} border ${config.badge}`}>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <CardTitle className="text-sm font-semibold">{label}</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {milestones.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
          {milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p className="text-sm">No milestones</p>
              <p className="text-xs text-muted-foreground/60">Drag cards here to get started</p>
            </div>
          ) : (
            <SortableContext items={milestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {milestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  id={milestone.id}
                  title={milestone.title}
                  contractTitle={milestone.contractTitle}
                  dueDate={milestone.dueDate}
                  paymentAmount={milestone.paymentAmount}
                  status={milestone.status}
                  description={milestone.description}
                />
              ))}
            </SortableContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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

const STATUS_COLORS: Record<string, { bg: string; dot: string; icon: string }> = {
  planning: { bg: "bg-white/[0.02]", dot: "bg-muted-foreground", icon: "📋" },
  content_due: { bg: "bg-primary/5", dot: "bg-primary", icon: "⏰" },
  posted: { bg: "bg-white/[0.02]", dot: "bg-accent", icon: "📱" },
  paid: { bg: "bg-white/[0.02]", dot: "bg-green-400", icon: "✅" },
};

export function MilestoneColumn({ status, label, milestones, color }: MilestoneColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = STATUS_COLORS[status] || { bg: "bg-white/[0.02]", dot: "bg-muted-foreground", icon: "•" };

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 max-w-full flex flex-col h-full"
    >
      <div className={`glass-card flex-1 flex flex-col border-t-2 ${
        status === 'content_due' ? 'border-t-primary' : 
        status === 'posted' ? 'border-t-accent' : 
        status === 'paid' ? 'border-t-green-400' : 'border-t-white/[0.1]'
      } overflow-hidden`}>
        <div className={`p-4 border-b border-white/[0.04] ${config.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <h3 className="text-sm font-semibold tracking-wide uppercase">{label}</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-muted-foreground">
              {milestones.length}
            </span>
          </div>
        </div>
        
        <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px] bg-black/20">
          {milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
              <div className="text-2xl mb-2 grayscale">{config.icon}</div>
              <p className="text-xs font-mono text-muted-foreground">NO MILESTONES</p>
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
        </div>
      </div>
    </div>
  );
}

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface MilestoneCardProps {
  id: string;
  title: string;
  contractTitle?: string;
  dueDate?: string | Date;
  paymentAmount?: string | number;
  status: string;
  description?: string;
}

export function MilestoneCard({ id, title, contractTitle, dueDate, paymentAmount, status, description }: MilestoneCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const daysUntilDue = dueDate
    ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`glass-card p-4 transition-all duration-300 ${
          isDragging ? "ring-1 ring-primary/50 shadow-[0_0_20px_-5px_rgba(255,184,0,0.3)] bg-white/[0.04]" : "hover:bg-white/[0.03]"
        } ${isOverdue ? "border-destructive/30" : ""}`}
      >
        <div className="flex gap-3">
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-primary transition-colors duration-300 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 opacity-50" />
          </button>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h4 className="font-semibold text-sm truncate leading-tight">{title}</h4>
              {contractTitle && <p className="text-xs text-muted-foreground truncate font-mono mt-1">{contractTitle}</p>}
            </div>

            {description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>}

            <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
              {paymentAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-muted-foreground">PAYOUT</span>
                  <span className="text-sm font-mono font-semibold text-primary">${Number(paymentAmount).toLocaleString()}</span>
                </div>
              )}

              {dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-muted-foreground">DUE</span>
                  <span className={`text-xs font-mono font-medium ${isOverdue ? "text-destructive" : isUrgent ? "text-accent" : "text-muted-foreground"}`}>
                    {daysUntilDue !== null ? `${Math.abs(daysUntilDue)}D ${isOverdue ? "AGO" : "LEFT"}` : new Date(dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {isOverdue && (
              <span className="block w-full text-center text-xs font-mono py-1 rounded bg-destructive/10 text-destructive border border-destructive/20 mt-2">
                OVERDUE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

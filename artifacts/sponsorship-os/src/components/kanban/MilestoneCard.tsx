import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    opacity: isDragging ? 0.5 : 1,
  };

  const daysUntilDue = dueDate
    ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`cursor-grab active:cursor-grabbing transition-all ${isDragging ? "shadow-lg ring-2 ring-primary" : ""} ${isOverdue ? "border-red-500/30" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <button
              {...attributes}
              {...listeners}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{title}</h4>
              {contractTitle && <p className="text-xs text-muted-foreground truncate">{contractTitle}</p>}
            </div>
          </div>

          {description && <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>}

          <div className="space-y-2">
            {paymentAmount && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Payout</span>
                <span className="text-sm font-semibold text-primary">${Number(paymentAmount).toLocaleString()}</span>
              </div>
            )}

            {dueDate && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Due</span>
                <span className={`text-xs font-medium ${isOverdue ? "text-red-400" : isUrgent ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {daysUntilDue !== null ? `${Math.abs(daysUntilDue)}d ${isOverdue ? "ago" : "left"}` : new Date(dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {isOverdue && <Badge variant="outline" className="w-full text-center text-xs text-red-400 border-red-500/30">Overdue</Badge>}
        </CardContent>
      </Card>
    </div>
  );
}

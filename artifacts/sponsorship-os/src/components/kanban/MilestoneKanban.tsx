import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { MilestoneColumn } from "./MilestoneColumn";
import { Loader2 } from "lucide-react";

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

interface MilestoneKanbanProps {
  milestones: Milestone[] | undefined;
  isLoading?: boolean;
  onStatusChange?: (milestoneId: string, newStatus: string) => void | Promise<void>;
}

const COLUMNS = [
  { status: "planning", label: "Planning" },
  { status: "content_due", label: "Content Due" },
  { status: "posted", label: "Posted" },
  { status: "paid", label: "Paid" },
];

export function MilestoneKanban({ milestones = [], isLoading = false, onStatusChange }: MilestoneKanbanProps) {
  const [items, setItems] = useState<Milestone[]>(milestones);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setItems(milestones || []);
  }, [milestones]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const draggedId = active.id as string;
    const newStatus = over.id as string;

    const draggedItem = items.find(m => m.id === draggedId);
    if (!draggedItem || draggedItem.status === newStatus) return;

    // Optimistic update
    const updatedItems = items.map(item =>
      item.id === draggedId ? { ...item, status: newStatus } : item
    );
    setItems(updatedItems);

    // Persist to backend
    if (onStatusChange) {
      setIsUpdating(true);
      try {
        await onStatusChange(draggedId, newStatus);
      } catch (error) {
        // Revert on error
        console.error("Failed to update milestone status:", error);
        setItems(milestones || []);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-mono text-muted-foreground animate-pulse">LOADING MILESTONES...</p>
      </div>
    );
  }

  const groupedMilestones = COLUMNS.reduce((acc, col) => {
    acc[col.status] = items.filter(m => m.status === col.status);
    return acc;
  }, {} as Record<string, Milestone[]>);

  const totalMilestones = items.length;
  const completedMilestones = groupedMilestones.paid.length;

  return (
    <div className="space-y-8 animate-fade-in flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div>
        <p className="text-label mb-1">WORKFLOW</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-editorial text-4xl font-light">Milestones</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Manage your contract milestones across the workflow.
            </p>
          </div>
          {totalMilestones > 0 && (
            <div className="text-right">
              <p className="text-xs font-mono text-muted-foreground mb-1">COMPLETION</p>
              <p className="font-mono text-xl text-accent">
                {completedMilestones}<span className="text-muted-foreground">/{totalMilestones}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {totalMilestones === 0 && (
        <div className="glass-card flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-2">
            <span className="text-2xl grayscale opacity-50">📋</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">No milestones yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">Upload a contract to automatically extract deliverables into milestones, or add them manually.</p>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {totalMilestones > 0 && (
        <div className="flex-1 overflow-hidden flex">
          <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="flex gap-6 overflow-x-auto pb-4 h-full flex-1">
              {COLUMNS.map(col => (
                <MilestoneColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  milestones={groupedMilestones[col.status]}
                />
              ))}
            </div>
          </DndContext>
        </div>
      )}

      {isUpdating && (
        <div className="fixed bottom-6 right-6 glass-card bg-black/80 px-4 py-3 rounded-lg flex items-center gap-3 border-primary/30 z-50 animate-fade-in-up">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-mono text-primary">UPDATING STATUS...</span>
        </div>
      )}
    </div>
  );
}

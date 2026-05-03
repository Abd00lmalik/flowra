import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { MilestoneColumn } from "./MilestoneColumn";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Milestones</h1>
        <p className="text-muted-foreground mt-1">
          Manage your contract milestones across the workflow.
          {totalMilestones > 0 && ` ${completedMilestones}/${totalMilestones} completed.`}
        </p>
      </div>

      {/* Empty state */}
      {totalMilestones === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-4xl">📋</div>
            <div>
              <h3 className="font-semibold text-lg">No milestones yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a contract to automatically create milestones, or add them manually.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban board */}
      {totalMilestones > 0 && (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6">
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
      )}

      {isUpdating && (
        <div className="fixed bottom-6 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Updating...</span>
        </div>
      )}
    </div>
  );
}

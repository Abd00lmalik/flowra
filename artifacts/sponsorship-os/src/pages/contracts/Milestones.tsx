import { useListMilestones, useUpdateMilestone } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { MilestoneKanban } from "@/components/kanban/MilestoneKanban";

export default function Milestones() {
  const { id } = useParams();
  const { data: milestones, isLoading, refetch } = useListMilestones(id || "", {
    query: { enabled: !!id } as any,
  });
  const updateMutation = useUpdateMilestone();

  const handleStatusChange = async (milestoneId: string, newStatus: string) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { id: milestoneId, data: { status: newStatus as any } },
        {
          onSuccess: () => {
            refetch();
            resolve();
          },
          onError: (error) => {
            console.error("Failed to update milestone:", error);
            reject(error);
          },
        }
      );
    });
  };

  const milestonesWithContractTitle = (milestones as any[] || []).map(m => ({
    ...m,
    contractTitle: m.contractTitle || "Unknown Contract",
  }));

  return (
    <MilestoneKanban
      milestones={milestonesWithContractTitle}
      isLoading={isLoading}
      onStatusChange={handleStatusChange}
    />
  );
}

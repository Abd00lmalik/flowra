import { useListMilestones } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Milestones() {
  const { id } = useParams();
  const { data: milestones, isLoading } = useListMilestones(id || "", {
    query: { enabled: !!id } as any,
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Milestones</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['planning', 'content_due', 'posted', 'paid'].map(col => (
          <div key={col} className="bg-card rounded-xl border border-border p-4 h-[600px] overflow-y-auto">
            <h3 className="font-bold mb-4 capitalize text-muted-foreground">{col.replace('_', ' ')}</h3>
            <div className="space-y-3">
              {milestones?.filter(m => m.status === col).map(m => (
                <Card key={m.id} className="cursor-grab">
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{m.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No date'}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

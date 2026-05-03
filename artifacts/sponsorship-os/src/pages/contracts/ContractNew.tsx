import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useUploadContract, useGetContract } from "@workspace/api-client-react";
import { Loader2, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Phase = "upload" | "processing" | "done" | "error";

export default function ContractNew() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>("upload");
  const [contractId, setContractId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadContract();

  const { data: contractData } = useQuery({
    queryKey: ["contract-poll", contractId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      return res.json();
    },
    enabled: !!contractId && phase === "processing",
    refetchInterval: (query) => {
      const status = query.state.data?.contract?.aiProcessingStatus;
      if (status === "complete" || status === "failed") return false;
      return 2000;
    },
  });

  const processingStatus = contractData?.contract?.aiProcessingStatus;
  if (phase === "processing" && processingStatus === "complete") setPhase("done");
  if (phase === "processing" && processingStatus === "failed") {
    setPhase("error");
    setErrorMsg(contractData?.contract?.aiError || "AI extraction failed");
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(".pdf", ""));
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(".pdf", ""));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setPhase("processing");
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    uploadMutation.mutate(
      { data: formData as any },
      {
        onSuccess: (contract: any) => {
          setContractId(contract.id);
        },
        onError: (err: any) => {
          setPhase("error");
          setErrorMsg(err.message || "Upload failed");
        },
      }
    );
  };

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Analyzing Contract</h2>
          <p className="text-muted-foreground max-w-sm">Claude AI is extracting payment terms, deliverables, deadlines, and risk flags from your PDF.</p>
        </div>
        <div className="w-full max-w-sm bg-card border border-border rounded-lg p-4 space-y-2">
          {["Uploading file", "Extracting text", "Running AI analysis", "Generating milestones"].map((step, i) => {
            const statusVal = contractData?.contract?.aiProcessingStatus;
            const isDone = statusVal === "complete";
            const isActive = !isDone && i <= 2;
            return (
              <div key={step} className="flex items-center gap-3 text-sm">
                {isDone || (isActive && i < 2) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                )}
                <span className={isDone || (isActive && i < 2) ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "done" && contractId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Contract Ready</h2>
          <p className="text-muted-foreground">AI extraction complete. Milestones and risk flags are ready to review.</p>
        </div>
        <Button size="lg" onClick={() => setLocation(`/app/contracts/${contractId}`)}>
          View Contract
        </Button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Upload Failed</h2>
          <p className="text-muted-foreground max-w-sm">{errorMsg}</p>
        </div>
        <Button variant="outline" onClick={() => setPhase("upload")}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Contract</h1>
        <p className="text-muted-foreground mt-1">Upload a sponsorship contract PDF. Claude AI will extract all key terms automatically.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer
          ${drag ? "border-primary bg-primary/5" : file ? "border-green-500 bg-green-500/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        {file ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Drop PDF here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">Max 20MB · PDF only</p>
            </div>
          </>
        )}
      </div>

      {file && (
        <div className="space-y-2">
          <Label htmlFor="title">Contract Title (optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Nike Summer Campaign 2025"
          />
          <p className="text-xs text-muted-foreground">If left blank, AI will generate a title from the contract content.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setLocation("/app/contracts")}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!file} className="flex-1">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload & Analyze
        </Button>
      </div>
    </div>
  );
}

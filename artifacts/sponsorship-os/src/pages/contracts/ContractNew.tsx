import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadContract } from "@workspace/api-client-react";
import { Loader2, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FlowraLogo } from "@/components/FlowraLogo";

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center relative shadow-[0_0_50px_-12px_rgba(255,184,0,0.3)]">
            <FlowraLogo className="w-12 h-12 animate-float" />
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-label text-primary animate-pulse">CLAUDE AI IS WORKING</p>
          <h2 className="font-editorial text-3xl font-light">Analyzing Contract</h2>
          <p className="text-sm text-muted-foreground max-w-sm">Extracting payment terms, deliverables, deadlines, and risk flags from your PDF.</p>
        </div>
        <div className="w-full max-w-sm glass-card p-5 space-y-4">
          {["Uploading document", "Parsing legal text", "Extracting key terms", "Generating milestones"].map((step, i) => {
            const statusVal = contractData?.contract?.aiProcessingStatus;
            const isDone = statusVal === "complete";
            const isActive = !isDone && i <= 2; // Simulated steps
            return (
              <div key={step} className="flex items-center gap-4 text-sm font-mono transition-opacity duration-500" style={{ opacity: isDone || isActive || i < 2 ? 1 : 0.4 }}>
                {isDone || (isActive && i < 2) ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-white/[0.1] shrink-0" />
                )}
                <span className={isDone || (isActive && i < 2) ? "text-foreground" : isActive ? "text-primary animate-pulse" : "text-muted-foreground"}>
                  {step.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "done" && contractId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
        <div className="w-32 h-32 rounded-full border border-accent/20 bg-accent/10 flex items-center justify-center shadow-[0_0_50px_-12px_rgba(212,255,0,0.3)]">
          <CheckCircle2 className="h-16 w-16 text-accent" />
        </div>
        <div className="text-center space-y-3">
          <p className="text-label text-accent">EXTRACTION COMPLETE</p>
          <h2 className="font-editorial text-4xl font-light">Contract Ready</h2>
          <p className="text-sm text-muted-foreground max-w-md">The AI has generated your milestones and flagged potential risks. Review the extracted data now.</p>
        </div>
        <Button
          className="btn-glow bg-accent text-black hover:bg-accent/90 h-12 px-8 text-sm font-bold rounded-lg"
          onClick={() => setLocation(`/app/contracts/${contractId}`)}
        >
          VIEW CONTRACT
        </Button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
        <div className="w-32 h-32 rounded-full border border-destructive/20 bg-destructive/10 flex items-center justify-center shadow-[0_0_50px_-12px_rgba(255,0,0,0.3)]">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-3">
          <p className="text-label text-destructive">EXTRACTION FAILED</p>
          <h2 className="font-editorial text-4xl font-light">Upload Error</h2>
          <p className="text-sm text-muted-foreground max-w-md bg-destructive/10 text-destructive/80 p-3 rounded-lg border border-destructive/20 font-mono">
            {errorMsg}
          </p>
        </div>
        <Button
          variant="outline"
          className="h-12 px-8 text-sm font-semibold rounded-lg border-white/[0.1] hover:bg-white/[0.05]"
          onClick={() => setPhase("upload")}
        >
          TRY AGAIN
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in mt-10">
      <div className="text-center space-y-3">
        <p className="text-label text-primary">AI CONTRACT INTELLIGENCE</p>
        <h1 className="font-editorial text-4xl font-light">Upload Contract</h1>
        <p className="text-sm text-muted-foreground">Drop a PDF here. Claude AI will extract deliverables, payments, and risk flags.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center gap-5 transition-all duration-500 cursor-pointer group
          ${drag ? "border-primary bg-primary/10 glow-amber" : file ? "border-accent bg-accent/5" : "border-white/[0.15] hover:border-primary/50 hover:bg-white/[0.02]"}`}
      >
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        
        {file ? (
          <div className="text-center space-y-4 relative z-10 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
              <FileText className="h-10 w-10 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{file.name}</p>
              <p className="text-sm text-muted-foreground font-mono mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-mono text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
            >
              REMOVE FILE
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 relative z-10">
            <div className="w-20 h-20 mx-auto rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05] group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/10 group-hover:border-primary/20">
              <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
            </div>
            <div>
              <p className="font-semibold text-lg group-hover:text-primary transition-colors duration-500">Drop PDF here or click to browse</p>
              <p className="text-sm text-muted-foreground font-mono mt-2">MAX 20MB · PDF ONLY</p>
            </div>
          </div>
        )}
      </div>

      <div className={`transition-all duration-700 ${file ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="glass-card p-6 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-xs font-mono text-muted-foreground">CONTRACT TITLE (OPTIONAL)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nike Summer Campaign 2025"
              className="h-12 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 text-base"
            />
            <p className="text-xs text-muted-foreground font-mono">LEAVE BLANK FOR AI AUTO-GENERATION</p>
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              variant="outline"
              className="h-12 px-6 rounded-lg border-white/[0.1] hover:bg-white/[0.05]"
              onClick={() => setLocation("/app/contracts")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file}
              className="flex-1 btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-lg font-semibold text-base"
            >
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload & Analyze
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

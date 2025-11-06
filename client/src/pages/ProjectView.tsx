import React, { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Film,
  Loader2,
  Mic,
  XCircle,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function ProjectView() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const [shouldRedirect, setShouldRedirect] = React.useState<boolean>(false);

  // Navegação segura após deleção
  useEffect(() => {
    if (shouldRedirect) {
      setLocation("/dashboard");
    }
  }, [shouldRedirect, setLocation]);

  // TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN CONDICIONAL
  const { data: project, isLoading } = trpc.audiodescription.getProject.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  const { data: units } = trpc.audiodescription.getUnits.useQuery(
    { projectId },
    { enabled: projectId > 0 && project?.status === "completed" }
  );

  // Polling de progresso para projetos em processamento
  const { data: progressData } = trpc.audiodescription.getProgress.useQuery(
    { id: projectId },
    {
      enabled: projectId > 0 && project?.status === "processing",
      refetchInterval: 2000, // Atualiza a cada 2 segundos
    }
  );

  const downloadSRT = trpc.audiodescription.downloadSRT.useQuery(
    { id: projectId },
    { enabled: false }
  );

  const deleteProject = trpc.audiodescription.delete.useMutation({
    onSuccess: () => {
      toast.success("Projeto deletado com sucesso");
      setShouldRedirect(true);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar projeto: ${error.message}`);
    },
  });

  if (!user) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para visualizar projetos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Projeto Não Encontrado</CardTitle>
            <CardDescription>O projeto solicitado não existe ou você não tem permissão para acessá-lo</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadScript = () => {
    if (!project.scriptData) return;

    const blob = new Blob([project.scriptData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roteiro_${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSRT = async () => {
    try {
      const result = await downloadSRT.refetch();
      if (!result.data) {
        toast.error("Erro ao baixar roteiro SRT");
        return;
      }
      const blob = new Blob([result.data.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Roteiro SRT baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar roteiro SRT");
    }
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.")) {
      deleteProject.mutate({ id: projectId });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Projeto de Audiodescrição</h1>
          </div>

          <Button variant="destructive" onClick={handleDelete} disabled={deleteProject.isPending}>
            {deleteProject.isPending ? "Deletando..." : "Deletar Projeto"}
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Informações do Projeto */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <CardDescription className="mt-2">
                    Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(project.createdAt).toLocaleTimeString("pt-BR")}
                  </CardDescription>
                </div>

                {project.status === "processing" && (
                  <Badge variant="secondary" className="shrink-0">
                    <Clock className="mr-1 h-3 w-3" />
                    Processando
                  </Badge>
                )}
                {project.status === "completed" && (
                  <Badge variant="default" className="shrink-0 bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Concluído
                  </Badge>
                )}
                {project.status === "failed" && (
                  <Badge variant="destructive" className="shrink-0">
                    <XCircle className="mr-1 h-3 w-3" />
                    Erro
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fonte do Vídeo</p>
                  <p className="mt-1 flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    {project.videoSource === "youtube" ? "YouTube" : "Upload"}
                  </p>
                </div>

                {project.videoDuration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duração</p>
                    <p className="mt-1">{formatDuration(project.videoDuration)}</p>
                  </div>
                )}
              </div>

              {project.status === "failed" && project.errorMessage && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <p className="font-semibold text-destructive">Erro no Processamento</p>
                  <p className="mt-1 text-sm text-destructive/90">{project.errorMessage}</p>
                </div>
              )}

              {project.status === "processing" && (
                <div className="rounded-lg border bg-muted p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold">Processamento em Andamento</p>
                        <p className="text-sm text-muted-foreground">
                          {progressData?.message || 'A IA está analisando o vídeo e gerando a audiodescrição...'}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {progressData?.progress || 0}%
                      </span>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted-foreground/20">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressData?.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roteiro de Audiodescrição */}
          {project.status === "completed" && units && units.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roteiro de Audiodescrição</CardTitle>
                    <CardDescription>
                      {units.length} unidade{units.length !== 1 ? "s" : ""} descritiva{units.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleDownloadScript} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar JSON
                    </Button>
                    
                    <Button onClick={handleDownloadSRT} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar SRT
                    </Button>
                    
                    {project.completeAudioMp3Url && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => window.open(project.completeAudioMp3Url!, "_blank")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Áudio MP3
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => window.open(project.completeAudioWavUrl!, "_blank")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Áudio WAV
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {units.map((unit, index) => (
                    <div key={unit.id}>
                      {index > 0 && <Separator className="my-6" />}
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={unit.type === "nota_introdutoria" ? "secondary" : "default"}>
                            {unit.type === "nota_introdutoria" ? "Nota Introdutória" : "Descrição"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(unit.timestamp)}
                          </span>
                        </div>

                        <p className="leading-relaxed">{unit.text}</p>

                        {unit.audioUrl && (
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <audio controls src={unit.audioUrl} className="h-10 flex-1">
                              Seu navegador não suporta o elemento de áudio.
                            </audio>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações sobre Conformidade */}
          {project.status === "completed" && (
            <Card>
              <CardHeader>
                <CardTitle>Conformidade Legal</CardTitle>
                <CardDescription>
                  Esta audiodescrição foi gerada seguindo as normas brasileiras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">ABNT NBR 16452:2016</p>
                    <p className="text-sm text-muted-foreground">
                      Acessibilidade na Comunicação - Audiodescrição
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Lei 13.146/2015 (LBI)</p>
                    <p className="text-sm text-muted-foreground">
                      Lei Brasileira de Inclusão da Pessoa com Deficiência
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="rounded-lg bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    ⚠️ Recomendação Importante
                  </p>
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                    Para uso profissional, recomenda-se a revisão por audiodescritor roteirista e
                    validação por consultor com deficiência visual, conforme diretrizes da NBR 16452.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}min ${secs}s`;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

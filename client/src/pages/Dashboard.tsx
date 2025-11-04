import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Film, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: projects, isLoading } = trpc.audiodescription.list.useQuery();

  if (!user) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar o dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Início
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Meus Projetos</h1>
          </div>
          
          <Link href="/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Film className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="mb-2 text-lg font-semibold">Nenhum projeto ainda</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Crie seu primeiro projeto de audiodescrição
                </p>
              </div>
              <Link href="/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Projeto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                      {project.status === "processing" && (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Processando
                        </Badge>
                      )}
                      {project.status === "completed" && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Concluído
                        </Badge>
                      )}
                      {project.status === "failed" && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Erro
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {project.videoSource === "youtube" ? "YouTube" : "Upload"}
                      {project.videoDuration && ` • ${formatDuration(project.videoDuration)}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    {project.status === "failed" && project.errorMessage && (
                      <p className="mt-2 text-sm text-destructive">
                        Erro: {project.errorMessage}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Upload, Youtube, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function NewProject() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Navegação segura após mutation
  useEffect(() => {
    if (redirectTo) {
      setLocation(redirectTo);
      setRedirectTo(null);
    }
  }, [redirectTo, setLocation]);

  const createFromYouTube = trpc.audiodescription.createFromYouTube.useMutation({
    onSuccess: (data) => {
      toast.success("Projeto criado! Processamento iniciado.");
      setRedirectTo(`/project/${data.projectId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });

  const createFromUpload = trpc.audiodescription.createFromUpload.useMutation({
    onSuccess: (data) => {
      toast.success("Vídeo enviado! Processamento iniciado.");
      setRedirectTo(`/project/${data.projectId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });

  const handleYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Digite um título para o projeto");
      return;
    }
    
    if (!youtubeUrl.trim()) {
      toast.error("Digite a URL do YouTube");
      return;
    }

    createFromYouTube.mutate({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title.trim()) {
      toast.error("Digite um título para o projeto primeiro");
      return;
    }

    // Validar tipo de arquivo
    const validTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato de vídeo não suportado. Use MP4, WebM, OGG ou MOV.");
      return;
    }

    // Validar tamanho (máximo 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("Vídeo muito grande. Tamanho máximo: 500MB");
      return;
    }

    setUploading(true);
    toast.info("Iniciando upload do vídeo...");

    try {
      // Upload para S3
      console.log("[Upload] Iniciando upload do arquivo:", file.name, file.size, "bytes");
      const formData = new FormData();
      formData.append("file", file);

      // Usar a API de storage do Manus
      const uploadResponse = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      console.log("[Upload] Resposta do servidor:", uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("[Upload] Erro:", errorText);
        throw new Error("Falha no upload do vídeo");
      }

      const { url, key } = await uploadResponse.json();
      console.log("[Upload] Upload concluído! URL:", url);
      toast.success("✅ Vídeo enviado com sucesso!");

      // Obter duração do vídeo
      toast.info("Obtendo duração do vídeo...");
      const video = document.createElement("video");
      video.preload = "metadata";
      
      const duration = await new Promise<number>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const dur = Math.floor(video.duration);
          console.log("[Upload] Duração do vídeo:", dur, "segundos");
          resolve(dur);
        };
        video.onerror = () => {
          console.error("[Upload] Erro ao carregar metadados");
          reject(new Error("Erro ao carregar metadados do vídeo"));
        };
        video.src = URL.createObjectURL(file);
      });

      // Criar projeto
      console.log("[Upload] Criando projeto com dados:", { title: title.trim(), videoUrl: url, videoDuration: duration });
      toast.info("🎥 Criando projeto e iniciando processamento...");
      
      createFromUpload.mutate({
        title: title.trim(),
        videoUrl: url,
        videoKey: key,
        videoDuration: duration,
      });
    } catch (error) {
      console.error("[Upload] Erro no upload:", error);
      toast.error(`Erro ao fazer upload do vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para criar projetos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Novo Projeto de Audiodescrição</h1>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Criar Audiodescrição</CardTitle>
              <CardDescription>
                Escolha como você deseja enviar o vídeo para processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label htmlFor="title">Título do Projeto</Label>
                <Input
                  id="title"
                  placeholder="Ex: Curta-metragem - Cena de Abertura"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Tabs defaultValue="youtube" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="youtube">
                    <Youtube className="mr-2 h-4 w-4" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="youtube" className="space-y-4">
                  <form onSubmit={handleYouTubeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="youtube-url">URL do YouTube</Label>
                      <Input
                        id="youtube-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="mt-2"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cole a URL completa do vídeo do YouTube
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createFromYouTube.isPending}
                    >
                      {createFromYouTube.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Youtube className="mr-2 h-4 w-4" />
                          Criar Projeto do YouTube
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <Label htmlFor="video-file">Arquivo de Vídeo</Label>
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="mt-2"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Formatos aceitos: MP4, WebM, OGG, MOV (máximo 500MB)
                    </p>
                  </div>

                  {uploading && (
                    <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Fazendo upload do vídeo...</span>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">Como funciona o processamento:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. O vídeo é analisado frame por frame pela IA</li>
                  <li>2. Cenas importantes são identificadas automaticamente</li>
                  <li>3. Descrições são geradas seguindo a NBR 16452:2016</li>
                  <li>4. Áudio narrado é criado em português brasileiro</li>
                  <li>5. Você pode revisar e editar o roteiro final</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

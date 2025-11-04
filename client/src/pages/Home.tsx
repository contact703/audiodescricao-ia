import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Eye, Film, Mic, Sparkles, Upload, Youtube, CheckCircle2, Scale, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            )}
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Meus Projetos</Button>
                </Link>
                <Link href="/new">
                  <Button>Novo Projeto</Button>
                </Link>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Tecnologia Open Source + IA</span>
          </div>
          
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Audiodescrição Automática para{" "}
            <span className="text-primary">Cinema Acessível</span>
          </h2>
          
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Transforme filmes em experiências acessíveis para pessoas cegas e com baixa visão.
            Nossa plataforma usa inteligência artificial para gerar audiodescrição profissional
            em português brasileiro, seguindo as normas técnicas brasileiras.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Link href="/new">
                <Button size="lg" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-5 w-5" />
                  Criar Audiodescrição
                </Button>
              </Link>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>
                  Começar Gratuitamente
                </a>
              </Button>
            )}
            
            <Link href="#como-funciona">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Saiba Mais
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <h3 className="mb-12 text-center text-3xl font-bold">Como Funciona</h3>
        
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Envie seu Vídeo</CardTitle>
              <CardDescription>
                Faça upload de um arquivo de vídeo ou cole uma URL do YouTube
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>2. IA Analisa o Conteúdo</CardTitle>
              <CardDescription>
                Nossa IA identifica cenas, personagens, ações e elementos visuais importantes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>3. Gera Audiodescrição</CardTitle>
              <CardDescription>
                Cria roteiro estruturado e áudio narrado em português brasileiro
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="mb-6 text-3xl font-bold">Por que Escolher Nossa Plataforma?</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">100% Open Source</h4>
                  <p className="text-sm text-muted-foreground">
                    Sem custos de APIs externas. Toda a tecnologia é open source e pode ser comercializada.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Conformidade Legal</h4>
                  <p className="text-sm text-muted-foreground">
                    Segue a Lei Brasileira de Inclusão (LBI) e a norma ABNT NBR 16452:2016.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Inclusão Real</h4>
                  <p className="text-sm text-muted-foreground">
                    Desenvolvido com base em pesquisas sobre demandas da comunidade de pessoas cegas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Film className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Múltiplas Fontes</h4>
                  <p className="text-sm text-muted-foreground">
                    Suporta upload de vídeos e URLs do YouTube para máxima flexibilidade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Legislação e Normas</CardTitle>
                <CardDescription>Nossa plataforma está em conformidade com:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h5 className="mb-2 font-semibold">Lei 13.146/2015 (LBI)</h5>
                  <p className="text-sm text-muted-foreground">
                    Lei Brasileira de Inclusão da Pessoa com Deficiência
                  </p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h5 className="mb-2 font-semibold">ABNT NBR 16452:2016</h5>
                  <p className="text-sm text-muted-foreground">
                    Acessibilidade na Comunicação - Audiodescrição
                  </p>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h5 className="mb-2 font-semibold">Instrução Normativa nº 165/2022</h5>
                  <p className="text-sm text-muted-foreground">
                    ANCINE - Acessibilidade em obras audiovisuais
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
            <h3 className="text-3xl font-bold">Pronto para Começar?</h3>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Crie sua primeira audiodescrição agora e torne o cinema mais acessível para todos.
            </p>
            
            {isAuthenticated ? (
              <Link href="/new">
                <Button size="lg">
                  <Upload className="mr-2 h-5 w-5" />
                  Criar Primeiro Projeto
                </Button>
              </Link>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>
                  Criar Conta Gratuita
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            {APP_TITLE} - Tecnologia Open Source para Cinema Acessível
          </p>
          <p className="mt-2">
            Desenvolvido com base na legislação brasileira e nas necessidades da comunidade
          </p>
        </div>
      </footer>
    </div>
  );
}

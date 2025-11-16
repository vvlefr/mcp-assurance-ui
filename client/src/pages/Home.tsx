import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Settings, LogOut } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold">{APP_TITLE}</h1>
          <p className="text-lg text-muted-foreground">
            Automatisez votre cabinet d'assurance avec le serveur MCP
          </p>
          <Button asChild size="lg">
            <a href={getLoginUrl()}>Se connecter</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Bienvenue, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Deconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Bienvenue dans MCP Assurance UI</h2>
            <p className="text-muted-foreground">
              Choisissez l'interface qui correspond a vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Test Chat Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <div>
                    <CardTitle>Chat de Test</CardTitle>
                    <CardDescription>Interagir avec les outils MCP</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Testez les fonctionnalites du serveur MCP en posant des questions sur
                  l'assurance automobile, habitation, souscription, et gestion de contrats.
                </p>
                <Button asChild className="w-full">
                  <Link href="/test-chat">Ouvrir le Chat</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Admin Config Card */}
            {user?.role === "admin" && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    <div>
                      <CardTitle>Configuration Admin</CardTitle>
                      <CardDescription>Gerer les API partenaires</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configurez les cles API de vos partenaires assureurs et gerez les
                    integrations avec vos systemes externes.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/admin/config">Acceder a la Configuration</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Box */}
          <Card className="bg-muted/50 border-muted">
            <CardHeader>
              <CardTitle className="text-lg">A propos du serveur MCP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Le serveur MCP (Model Context Protocol) est connecte a vos API partenaires
                pour automatiser la tarification, la souscription, la gestion de contrats et
                la synchronisation CRM.
              </p>
              <p className="text-muted-foreground">
                Consultez la documentation du serveur MCP pour plus de details sur les
                fonctionnalites disponibles.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

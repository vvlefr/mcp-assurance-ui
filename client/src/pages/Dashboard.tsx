import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Settings,
  LogOut,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Bot,
  BarChart3,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

// Quick stat card component
function StatCard({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${
          trend === "up" ? "text-green-600" :
          trend === "down" ? "text-red-600" :
          "text-muted-foreground"
        }`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    // Redirect to landing page
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                  <Bot className="size-6 text-white" />
                </div>
                <span className="text-xl font-bold">{APP_TITLE}</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name}
            </span>
            {user?.role === "admin" && (
              <Badge variant="secondary">Admin</Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Deconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bonjour, {user?.name?.split(" ")[0]} !
            </h1>
            <p className="text-muted-foreground">
              Voici un apercu de votre activite
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Devis ce mois"
              value="127"
              change="+12% vs mois dernier"
              icon={FileText}
              trend="up"
            />
            <StatCard
              title="Clients actifs"
              value="1,234"
              change="+8 nouveaux cette semaine"
              icon={Users}
              trend="up"
            />
            <StatCard
              title="Taux de conversion"
              value="34%"
              change="+5% vs moyenne"
              icon={TrendingUp}
              trend="up"
            />
            <StatCard
              title="Temps moyen devis"
              value="2m 30s"
              change="-45s avec l'IA"
              icon={Clock}
              trend="up"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Chat Assistant Card */}
            <Card className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Assistant IA</CardTitle>
                    <CardDescription>Chatbot de tarification</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generez des devis d'assurance emprunteur en conversant avec l'assistant IA.
                  Connexion en temps reel aux APIs Digital Insure.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="size-4 text-green-500" />
                  <span>En ligne - Pret a repondre</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/test-chat">
                    Ouvrir le Chat
                    <ArrowUpRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* CRM Card */}
            <Card className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>CRM Clients</CardTitle>
                    <CardDescription>Gestion des contacts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gerez vos clients, consultez l'historique des echanges et suivez vos contrats en cours.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>1,234 clients enregistres</span>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Bientot disponible
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>Rapports et statistiques</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Analysez vos performances, suivez vos KPIs et optimisez votre activite.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="size-4 text-green-500" />
                  <span>+15% ce trimestre</span>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Bientot disponible
                </Button>
              </CardContent>
            </Card>

            {/* Admin Config Card - Only for admins */}
            {user?.role === "admin" && (
              <Card className="hover:shadow-lg transition-shadow group border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Configuration</CardTitle>
                      <CardDescription>Parametres admin</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configurez les cles API des assureurs partenaires et gerez les integrations.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">Admin uniquement</Badge>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/config">
                      Acceder aux parametres
                      <ArrowUpRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activite recente</CardTitle>
              <CardDescription>Vos dernieres actions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Devis genere", client: "Jean Martin", time: "Il y a 2 heures", status: "success" },
                  { action: "Client ajoute", client: "Sophie Bernard", time: "Il y a 5 heures", status: "success" },
                  { action: "Devis envoye", client: "Pierre Durand", time: "Hier", status: "pending" },
                  { action: "Contrat signe", client: "Marie Leroy", time: "Il y a 2 jours", status: "success" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`size-2 rounded-full ${
                        item.status === "success" ? "bg-green-500" : "bg-yellow-500"
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.client}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>2025 MCP Assurance - Propulse par Model Context Protocol</p>
        </div>
      </footer>
    </div>
  );
}

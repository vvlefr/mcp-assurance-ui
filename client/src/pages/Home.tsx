import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Settings,
  LogOut,
  Server,
  History,
  Shield,
  TrendingUp,
  Zap,
  Users,
  FileText,
  ArrowRight,
} from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <div className="text-center space-y-8 max-w-2xl px-6">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-indigo-600 text-white">
                <Shield className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-slate-900">
              Titan Assurances
            </h1>
            <p className="text-xl text-slate-600">
              Plateforme de devis d'assurance de prêt immobilier
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border">
              <Zap className="h-6 w-6 text-amber-500 mb-2" />
              <h3 className="font-semibold text-slate-900">Rapide</h3>
              <p className="text-sm text-slate-600">Devis en quelques minutes</p>
            </div>
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border">
              <TrendingUp className="h-6 w-6 text-emerald-500 mb-2" />
              <h3 className="font-semibold text-slate-900">Compétitif</h3>
              <p className="text-sm text-slate-600">Meilleurs tarifs du marché</p>
            </div>
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border">
              <Users className="h-6 w-6 text-indigo-500 mb-2" />
              <h3 className="font-semibold text-slate-900">Accompagné</h3>
              <p className="text-sm text-slate-600">Conseiller dédié</p>
            </div>
          </div>

          {/* CTA */}
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg">
            <a href={getLoginUrl()}>
              Commencer
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Titan Assurances</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Bienvenue, <span className="font-medium">{user?.name}</span>
            </span>
            <Badge variant="secondary" className="capitalize">
              {user?.role}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => logout()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="space-y-10">
          {/* Welcome Section */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Votre espace assurance
            </h2>
            <p className="text-lg text-slate-600">
              Générez des devis, consultez l'historique et gérez vos intégrations
            </p>
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Nouveau Devis */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-indigo-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Nouveau Devis</CardTitle>
                    <CardDescription>Assurance de prêt immobilier</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Obtenez votre devis personnalisé en répondant à quelques questions
                  sur votre projet immobilier.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Réponse en quelques minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    Comparaison multi-assureurs
                  </li>
                </ul>
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 group-hover:shadow-lg">
                  <Link href="/test-chat">
                    Démarrer un devis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Historique */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Historique</CardTitle>
                    <CardDescription>Vos demandes de devis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Retrouvez toutes vos demandes de devis passées et leur statut.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-slate-400" />
                    Conversations sauvegardées
                  </li>
                  <li className="flex items-center gap-2">
                    <History className="h-3 w-3 text-slate-400" />
                    Accès aux offres précédentes
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full group-hover:border-emerald-300">
                  <Link href="/quotes-history">
                    Voir l'historique
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Serveur MCP */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Server className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Serveur MCP</CardTitle>
                    <CardDescription>Intégration LLM</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Visualisez et testez le serveur MCP pour l'intégration avec les LLM.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-purple-400" />
                    6 tools disponibles
                  </li>
                  <li className="flex items-center gap-2">
                    <Server className="h-3 w-3 text-purple-400" />
                    Transport SSE
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full group-hover:border-purple-300">
                  <Link href="/admin/mcp">
                    Accéder au serveur
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Admin Section */}
          {user?.role === "admin" && (
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Administration
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-slate-600" />
                      <div>
                        <CardTitle>Configuration API</CardTitle>
                        <CardDescription>Gérer les partenaires assureurs</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Configurez les clés API et les intégrations avec vos partenaires assureurs.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admin/config">Accéder à la configuration</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Info Box */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                À propos de Titan Assurances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                Titan Assurances est votre partenaire pour l'assurance de prêt immobilier.
                Notre plateforme utilise l'intelligence artificielle pour vous proposer
                les meilleures offres du marché en quelques minutes.
              </p>
              <p>
                <strong>Partenaires assureurs :</strong> Maestro, Avenir Nao Assur, Iriade, MNCAP
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>Titan Assurances - Plateforme MCP Assurance</p>
        </div>
      </footer>
    </div>
  );
}

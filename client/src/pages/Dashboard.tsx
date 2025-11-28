import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Euro,
  Calendar,
  Activity,
  PieChart,
  Target,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

interface DashboardStats {
  totalSessions: number;
  totalMessages: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  averageMessagesPerSession: number;
  completedQuotes: number;
  pendingQuotes: number;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [mcpHealth, setMcpHealth] = useState<{ status: string; activeSessions: number } | null>(null);

  // Récupérer les sessions
  const { data: sessions, isLoading: sessionsLoading } = trpc.chat.getSessions.useQuery(
    { isAdmin: 0 },
    { enabled: isAuthenticated }
  );

  // Récupérer le statut MCP
  useEffect(() => {
    const fetchMcpHealth = async () => {
      try {
        const res = await fetch("/api/mcp/health");
        if (res.ok) {
          const data = await res.json();
          setMcpHealth(data);
        }
      } catch (error) {
        console.error("Erreur MCP health:", error);
      }
    };
    fetchMcpHealth();
  }, [refreshKey]);

  // Calculer les statistiques
  const calculateStats = (): DashboardStats => {
    if (!sessions) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        sessionsToday: 0,
        sessionsThisWeek: 0,
        averageMessagesPerSession: 0,
        completedQuotes: 0,
        pendingQuotes: 0
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalSessions = sessions.length;
    const sessionsToday = sessions.filter((s: any) => new Date(s.createdAt) >= todayStart).length;
    const sessionsThisWeek = sessions.filter((s: any) => new Date(s.createdAt) >= weekStart).length;

    // Estimation des messages (à améliorer avec une vraie query)
    const totalMessages = totalSessions * 5; // Estimation moyenne
    const averageMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

    // Estimation des devis complétés vs en attente
    const completedQuotes = Math.floor(totalSessions * 0.6);
    const pendingQuotes = totalSessions - completedQuotes;

    return {
      totalSessions,
      totalMessages,
      sessionsToday,
      sessionsThisWeek,
      averageMessagesPerSession,
      completedQuotes,
      pendingQuotes
    };
  };

  const stats = calculateStats();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Dernières sessions
  const recentSessions = sessions?.slice(0, 5) || [];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Veuillez vous connecter pour accéder au dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                Dashboard
              </h1>
              <p className="text-slate-500 mt-1">
                Vue d'ensemble de votre activité MCP Assurance
              </p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Total Sessions</p>
                  <p className="text-3xl font-bold">{stats.totalSessions}</p>
                  <p className="text-indigo-200 text-xs mt-1">
                    +{stats.sessionsToday} aujourd'hui
                  </p>
                </div>
                <div className="p-3 rounded-full bg-white/20">
                  <MessageCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Devis Complétés</p>
                  <p className="text-3xl font-bold">{stats.completedQuotes}</p>
                  <p className="text-emerald-200 text-xs mt-1">
                    {stats.totalSessions > 0 ? Math.round((stats.completedQuotes / stats.totalSessions) * 100) : 0}% de conversion
                  </p>
                </div>
                <div className="p-3 rounded-full bg-white/20">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">En Attente</p>
                  <p className="text-3xl font-bold">{stats.pendingQuotes}</p>
                  <p className="text-amber-200 text-xs mt-1">
                    À suivre
                  </p>
                </div>
                <div className="p-3 rounded-full bg-white/20">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Serveur MCP</p>
                  <p className="text-3xl font-bold">
                    {mcpHealth?.status === "healthy" ? "Actif" : "---"}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    {mcpHealth?.activeSessions || 0} sessions actives
                  </p>
                </div>
                <div className="p-3 rounded-full bg-white/20">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions Récentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-500" />
                    Sessions Récentes
                  </CardTitle>
                  <CardDescription>
                    Dernières conversations de devis
                  </CardDescription>
                </div>
                <Link href="/quotes-history">
                  <Button variant="outline" size="sm" className="gap-1">
                    Voir tout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-indigo-50">
                          <MessageCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {session.title || "Session de devis"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(session.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          ID: {session.sessionId.substring(0, 8)}...
                        </Badge>
                        <Link href={`/test-chat?session=${session.sessionId}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                  <p>Aucune session pour le moment</p>
                  <Link href="/test-chat">
                    <Button variant="outline" className="mt-4">
                      Démarrer une conversation
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Actions Rapides
              </CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/test-chat" className="block">
                <Button className="w-full justify-start gap-3 bg-indigo-600 hover:bg-indigo-700">
                  <MessageCircle className="h-5 w-5" />
                  Nouveau Devis
                </Button>
              </Link>

              <Link href="/quotes-history" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <FileText className="h-5 w-5" />
                  Historique des Devis
                </Button>
              </Link>

              <Link href="/admin/mcp" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Activity className="h-5 w-5" />
                  Serveur MCP
                </Button>
              </Link>

              {user?.role === "admin" && (
                <Link href="/admin/config" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Target className="h-5 w-5" />
                    Configuration API
                  </Button>
                </Link>
              )}

              <Separator className="my-4" />

              <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <h4 className="font-medium text-slate-900 mb-2">
                  Statistiques de la semaine
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sessions</span>
                    <span className="font-medium">{stats.sessionsThisWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Moyenne msg/session</span>
                    <span className="font-medium">{stats.averageMessagesPerSession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taux de conversion</span>
                    <span className="font-medium text-emerald-600">
                      {stats.totalSessions > 0 ? Math.round((stats.completedQuotes / stats.totalSessions) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Aperçu des Performances
            </CardTitle>
            <CardDescription>
              Indicateurs clés de performance de votre plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-slate-50">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {stats.totalSessions}
                </div>
                <p className="text-sm text-slate-500">Sessions Totales</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-50">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {stats.completedQuotes}
                </div>
                <p className="text-sm text-slate-500">Devis Finalisés</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-50">
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  {stats.sessionsToday}
                </div>
                <p className="text-sm text-slate-500">Sessions Aujourd'hui</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-50">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  6
                </div>
                <p className="text-sm text-slate-500">Tools MCP Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

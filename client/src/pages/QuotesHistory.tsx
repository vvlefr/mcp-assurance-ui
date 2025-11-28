import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  History,
  Calendar,
  Euro,
  User,
  Clock,
  FileText,
  ChevronRight,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface SessionWithContext {
  id: number;
  sessionId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  context?: {
    nomComplet: string | null;
    montantPret: number | null;
    dureePret: number | null;
    typeBien: string | null;
    dateNaissance: string | null;
  } | null;
  messagesCount?: number;
}

export default function QuotesHistory() {
  const { user, isAuthenticated } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Récupérer les sessions
  const { data: sessions, isLoading, refetch } = trpc.chat.getSessions.useQuery(
    { isAdmin: 0 },
    { enabled: isAuthenticated }
  );

  // Récupérer les messages de la session sélectionnée
  const { data: messages } = trpc.chat.getMessages.useQuery(
    { sessionId: selectedSession || "" },
    { enabled: !!selectedSession }
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Veuillez vous connecter pour accéder à l'historique.</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date inconnue";
    }
  };

  const formatRelativeDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    } catch {
      return "";
    }
  };

  // Extraire les informations du contexte depuis les messages
  const extractContextFromMessages = (messagesList: any[]) => {
    const context: any = {};
    messagesList?.forEach((msg: any) => {
      const content = msg.content || "";
      // Chercher le montant du prêt
      const montantMatch = content.match(/(\d[\d\s]*)\s*(?:€|euros?)/i);
      if (montantMatch) {
        const montant = parseInt(montantMatch[1].replace(/\s/g, ""));
        if (montant > 10000) context.montantPret = montant;
      }
      // Chercher la durée
      const dureeMatch = content.match(/(\d+)\s*(?:ans?|mois)/i);
      if (dureeMatch) {
        const duree = parseInt(dureeMatch[1]);
        context.dureePret = duree > 100 ? duree : duree * 12; // Convertir en mois si < 100
      }
    });
    return context;
  };

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
                <History className="h-8 w-8 text-indigo-600" />
                Historique des Devis
              </h1>
              <p className="text-slate-500 mt-1">
                Retrouvez toutes vos demandes de devis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Link href="/test-chat">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <MessageCircle className="h-4 w-4" />
                Nouveau Devis
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des sessions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vos demandes</CardTitle>
                <CardDescription>
                  {sessions?.length || 0} session{(sessions?.length || 0) > 1 ? "s" : ""} de devis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : sessions?.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>Aucun devis pour le moment</p>
                      <Link href="/test-chat">
                        <Button variant="link" className="mt-2">
                          Créer votre premier devis
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {sessions?.map((session: any) => {
                        const isSelected = selectedSession === session.sessionId;
                        return (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSession(session.sessionId)}
                            className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${
                              isSelected ? "bg-indigo-50 border-l-4 border-indigo-500" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                  {session.title || "Session de devis"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatRelativeDate(session.createdAt)}</span>
                                </div>
                              </div>
                              <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${
                                isSelected ? "rotate-90" : ""
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Détails de la session sélectionnée */}
          <div className="lg:col-span-2">
            {selectedSession && messages ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Détails de la conversation</CardTitle>
                      <CardDescription>
                        {messages.length} message{messages.length > 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {sessions?.find((s: any) => s.sessionId === selectedSession)?.createdAt &&
                        formatDate(sessions.find((s: any) => s.sessionId === selectedSession)!.createdAt)
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Résumé du contexte */}
                  {(() => {
                    const ctx = extractContextFromMessages(messages);
                    if (ctx.montantPret || ctx.dureePret) {
                      return (
                        <div className="mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                          <h4 className="font-medium text-indigo-900 mb-3">Résumé du devis</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {ctx.montantPret && (
                              <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4 text-indigo-600" />
                                <span className="text-slate-600">Montant :</span>
                                <span className="font-medium">{ctx.montantPret.toLocaleString('fr-FR')} euros</span>
                              </div>
                            )}
                            {ctx.dureePret && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                <span className="text-slate-600">Durée :</span>
                                <span className="font-medium">{Math.round(ctx.dureePret / 12)} ans</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Messages */}
                  <ScrollArea className="h-[450px] pr-4">
                    <div className="space-y-4">
                      {messages.map((msg: any, index: number) => (
                        <div
                          key={msg.id || index}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.role === "user" ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <MessageCircle className="h-3 w-3" />
                              )}
                              <span className="text-xs opacity-75">
                                {msg.role === "user" ? "Vous" : "Assistant"}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link href="/test-chat" className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Continuer cette conversation
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Sélectionnez une session
                  </h3>
                  <p className="text-slate-500">
                    Cliquez sur une session dans la liste pour voir les détails
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

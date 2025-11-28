import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AIChatBox } from "@/components/AIChatBox";
import { QuoteComparison, type InsuranceOffer } from "@/components/QuoteCard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Server, ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Message {
  id?: number;
  userId?: number;
  chatSessionId?: string;
  role: string;
  content: string;
  toolName?: string | null;
  toolParams?: string | null;
  toolResult?: string | null;
  isAdmin?: number;
  createdAt?: Date;
  // Pour les offres d'assurance
  offers?: InsuranceOffer[];
  loanAmount?: number;
  loanDurationMonths?: number;
}

export default function TestChat() {
  const { user, isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOffers, setCurrentOffers] = useState<InsuranceOffer[] | null>(null);
  const [currentLoanInfo, setCurrentLoanInfo] = useState<{ amount?: number; duration?: number } | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Récupérer les sessions existantes
  const { data: sessions, isLoading: sessionsLoading } = trpc.chat.getSessions.useQuery(
    { isAdmin: 0 },
    { enabled: isAuthenticated }
  );

  // Créer une nouvelle session
  const createSessionMutation = trpc.chat.createSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages([]);
      setCurrentOffers(null);
      setCurrentLoanInfo(null);
    },
  });

  // Récupérer les messages d'une session
  const { data: sessionMessages } = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Ajouter un message
  const addMessageMutation = trpc.chat.addMessage.useMutation();

  // Mutation pour la souscription
  const subscriptionMutation = trpc.mcpChat.initiateSubscription.useMutation();

  // Mutation pour le PDF
  const pdfMutation = trpc.mcpChat.generateQuotePdf.useMutation();

  useEffect(() => {
    if (sessionMessages) {
      setMessages(sessionMessages as unknown as Message[]);
    }
  }, [sessionMessages]);

  const handleNewSession = () => {
    createSessionMutation.mutate({
      title: `Devis Assurance ${new Date().toLocaleString()}`,
      isAdmin: 0,
    });
  };

  // Appeler le workflow intelligent MCP
  const processMCPMessageMutation = trpc.mcpChat.processMessage.useMutation();

  // Extraire les offres du message de réponse
  const extractOffersFromResponse = (response: any): { offers: InsuranceOffer[] | null; loanInfo: any } => {
    let offers: InsuranceOffer[] | null = null;
    let loanInfo = null;

    const messageContent = response.message || "";

    // Pattern pour extraire les offres du texte formaté
    // Format: **Produit** avec prix et TAEA
    const extractedOffers: InsuranceOffer[] = [];

    // Essayer différents patterns
    // Pattern 1: Format avec "Option X" ou produit direct
    const patterns = [
      /\*\*([^*]+)\*\*[^€]*?(\d+[\.,]\d+)\s*€\/mois[^€]*?(\d+[\s\d]*[\.,]?\d*)\s*€[^%]*?([\d,\.]+)\s*%/g,
      /\*\*(?:Option \d+[^:]*:\s*)?([^*]+)\*\*[^-]*-\s*Cotisation mensuelle[^:]*:\s*([\d,\.]+)\s*€[^-]*-\s*Coût total[^:]*:\s*([\d\s,\.]+)\s*€[^-]*-\s*TAEA\s*:\s*([\d,\.]+)\s*%/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(messageContent)) !== null) {
        const productName = match[1].trim();
        const monthlyPremium = parseFloat(match[2].replace(",", ".").replace(/\s/g, ""));
        const totalCost = parseFloat(match[3].replace(/\s/g, "").replace(",", "."));
        const taea = parseFloat(match[4].replace(",", "."));

        if (!isNaN(monthlyPremium) && !isNaN(totalCost) && !isNaN(taea)) {
          // Déterminer le type de cotisation
          const premiumType = messageContent.includes("Dégressive") ||
                             messageContent.includes("CRD") ||
                             messageContent.toLowerCase().includes("décroissante")
            ? "CRD" as const
            : "FIXE" as const;

          extractedOffers.push({
            product_code: productName.toUpperCase().replace(/\s+/g, "_").substring(0, 20),
            product_name: productName,
            premium_type: premiumType,
            monthly_premium: monthlyPremium,
            total_cost: totalCost,
            taea_percent: taea,
            coverages_included: ["DCPTIA", "IPT", "IPP", "ITT"],
          });
        }
      }
    }

    // Supprimer les doublons
    const uniqueOffers = extractedOffers.filter((offer, index, self) =>
      index === self.findIndex((o) =>
        o.product_name === offer.product_name && o.premium_type === offer.premium_type
      )
    );

    if (uniqueOffers.length > 0) {
      offers = uniqueOffers;
    }

    // Extraire les infos du prêt du contexte si disponible
    if (response.context) {
      loanInfo = {
        amount: parseInt(response.context.montantPret) || undefined,
        duration: parseInt(response.context.dureePret) || undefined,
      };
    }

    return { offers, loanInfo };
  };

  const handleSendMessage = async (message: string) => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      // Ajouter le message utilisateur immédiatement
      setMessages((prev) => [...prev, { role: "user", content: message }]);

      // Sauvegarder en base de données
      await addMessageMutation.mutateAsync({
        sessionId,
        role: "user",
        content: message,
        isAdmin: 0,
      });

      // Appeler le workflow intelligent MCP
      const mcpResponse = await processMCPMessageMutation.mutateAsync({
        message,
        sessionId: sessionId,
      });

      const assistantResponse = mcpResponse.success
        ? mcpResponse.message
        : `Désolé, une erreur s'est produite: ${mcpResponse.message}`;

      // Extraire les offres de la réponse
      const { offers, loanInfo } = extractOffersFromResponse(mcpResponse);

      if (offers && offers.length > 0) {
        setCurrentOffers(offers);
        setCurrentLoanInfo(loanInfo);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantResponse,
          offers: offers || undefined,
          loanAmount: loanInfo?.amount,
          loanDurationMonths: loanInfo?.duration,
        },
      ]);

      // Sauvegarder la réponse en base de données
      await addMessageMutation.mutateAsync({
        sessionId,
        role: "assistant",
        content: assistantResponse,
        isAdmin: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (offer: InsuranceOffer) => {
    if (!sessionId) return;

    setIsSubscribing(true);
    try {
      const result = await subscriptionMutation.mutateAsync({
        productCode: offer.product_code,
        premiumType: offer.premium_type,
        sessionId,
      });

      if (result.success && result.ssoUrl) {
        toast.success("Redirection vers le portail de souscription...");
        // Ouvrir dans un nouvel onglet
        window.open(result.ssoUrl, "_blank");
      } else {
        toast.error(result.error || "Erreur lors de l'initiation de la souscription");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la souscription");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDownloadPdf = async (offer: InsuranceOffer) => {
    if (!sessionId) return;

    try {
      const result = await pdfMutation.mutateAsync({
        productCode: offer.product_code,
        productName: offer.product_name,
        premiumType: offer.premium_type,
        monthlyPremium: offer.monthly_premium,
        totalCost: offer.total_cost,
        taeaPercent: offer.taea_percent,
        sessionId,
      });

      if (result.success && result.pdfData) {
        // Créer un blob avec les données JSON formatées
        const pdfContent = JSON.stringify(result.pdfData, null, 2);
        const blob = new Blob([pdfContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Télécharger le fichier
        const a = document.createElement("a");
        a.href = url;
        a.download = `devis_${offer.product_code}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Devis téléchargé avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la génération du PDF");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du téléchargement");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Veuillez vous connecter pour accéder au chat de test.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="border-b p-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-indigo-600" />
                  Devis Assurance de Prêt
                </h1>
                <p className="text-sm text-slate-500">
                  Obtenez votre devis en quelques minutes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/mcp">
                <Button variant="outline" size="sm" className="gap-2">
                  <Server className="h-4 w-4" />
                  Serveur MCP
                </Button>
              </Link>
              <Button
                onClick={handleNewSession}
                disabled={createSessionMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Nouveau Devis"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex gap-6 p-6">
          {/* Chat Area */}
          <div className="flex-1 min-w-0">
            {sessionId ? (
              <AIChatBox
                messages={messages.map((m) => ({
                  role: m.role as "user" | "assistant" | "system",
                  content: m.content,
                }))}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ex: Je souhaite assurer un prêt de 250 000 euros sur 20 ans pour ma résidence principale"
                height="100%"
                emptyStateMessage="Bienvenue ! Je suis votre assistant pour l'assurance de prêt immobilier."
                suggestedPrompts={[
                  "Je veux un devis pour un prêt de 300 000 euros sur 25 ans",
                  "Quelle assurance pour un investissement locatif ?",
                  "Je suis Guillaume Bidoux et je souhaite un devis",
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-lg border shadow-sm">
                <div className="text-center p-8">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-indigo-200" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Commencez votre devis
                  </h2>
                  <p className="text-slate-500 mb-6 max-w-md">
                    Cliquez sur "Nouveau Devis" pour démarrer une conversation et obtenir
                    votre devis d'assurance de prêt immobilier personnalisé.
                  </p>
                  <Button
                    onClick={handleNewSession}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Démarrer un Nouveau Devis
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Offers Panel */}
          {currentOffers && currentOffers.length > 0 && (
            <div className="w-[450px] shrink-0 overflow-auto">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <QuoteComparison
                  offers={currentOffers}
                  loanAmount={currentLoanInfo?.amount}
                  loanDurationMonths={currentLoanInfo?.duration}
                  onSubscribe={handleSubscribe}
                  onDownloadPdf={handleDownloadPdf}
                  isSubscribing={isSubscribing}
                  title="Vos offres personnalisées"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

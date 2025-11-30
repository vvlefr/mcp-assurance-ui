import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
  Shield,
  Database,
  Zap,
  Users,
  FileCheck,
  Brain,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  BarChart3,
  Layers,
  Cpu,
  Network,
  Bot,
  ChevronRight,
  Play,
  Star
} from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { AIChatBox, Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";

// Animation component for fade-in effect
function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

// MCP Architecture Diagram
function MCPArchitectureDiagram() {
  return (
    <div className="relative w-full max-w-4xl mx-auto p-8">
      {/* Central Hub */}
      <div className="flex flex-col items-center">
        {/* Top Layer - LLM */}
        <div className="relative mb-8">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center gap-3 text-white">
              <Brain className="size-8" />
              <div>
                <p className="font-bold text-lg">Claude AI / LLM</p>
                <p className="text-sm text-white/80">Intelligence Artificielle</p>
              </div>
            </div>
          </div>
          <div className="absolute left-1/2 -bottom-8 w-px h-8 bg-gradient-to-b from-purple-500 to-blue-500" />
        </div>

        {/* MCP Protocol Layer */}
        <div className="relative mb-8 w-full max-w-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl shadow-blue-500/20">
            <div className="flex items-center justify-center gap-3 text-white">
              <Network className="size-8" />
              <div className="text-center">
                <p className="font-bold text-xl">Model Context Protocol</p>
                <p className="text-sm text-white/80">Protocole standardise de communication IA</p>
              </div>
            </div>
          </div>
          {/* Connection lines */}
          <div className="absolute left-1/4 -bottom-8 w-px h-8 bg-gradient-to-b from-cyan-500 to-emerald-500" />
          <div className="absolute left-1/2 -bottom-8 w-px h-8 bg-gradient-to-b from-cyan-500 to-orange-500" />
          <div className="absolute left-3/4 -bottom-8 w-px h-8 bg-gradient-to-b from-cyan-500 to-pink-500" />
        </div>

        {/* Tools Layer */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 shadow-lg shadow-emerald-500/20">
            <div className="flex flex-col items-center text-white text-center">
              <Database className="size-6 mb-2" />
              <p className="font-semibold text-sm">CRM API</p>
              <p className="text-xs text-white/70">Gestion clients</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 shadow-lg shadow-orange-500/20">
            <div className="flex flex-col items-center text-white text-center">
              <Shield className="size-6 mb-2" />
              <p className="font-semibold text-sm">Assureurs API</p>
              <p className="text-xs text-white/70">Digital Insure</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-4 shadow-lg shadow-pink-500/20">
            <div className="flex flex-col items-center text-white text-center">
              <FileCheck className="size-6 mb-2" />
              <p className="font-semibold text-sm">Compliance</p>
              <p className="text-xs text-white/70">Reglementation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, gradient }: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur overflow-hidden">
      <div className={`h-1 ${gradient}`} />
      <CardHeader>
        <div className={`size-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="size-6 text-white" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Stats Counter
function StatCounter({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
        {value}{suffix}
      </p>
      <p className="text-muted-foreground mt-2">{label}</p>
    </div>
  );
}

export default function Landing() {
  const { user, isAuthenticated, logout } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  const processMessage = trpc.mcpChat.processMessage.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response },
      ]);
    },
  });

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
    processMessage.mutate({ sessionId, message: content });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <Bot className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold">MCP Assurance</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</a>
            <a href="#mcp" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Technologie MCP</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalites</a>
            <a href="#solutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solutions</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.name}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <a href={getLoginUrl()}>Connexion</a>
                </Button>
                <Button size="sm" asChild>
                  <a href={getLoginUrl()}>Demarrer</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <FadeInSection>
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Sparkles className="size-4 mr-2" />
                Propulse par Model Context Protocol
              </Badge>
            </FadeInSection>

            <FadeInSection delay={100}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                L'IA qui{" "}
                <span className="bg-gradient-to-r from-primary via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  revolutionne
                </span>
                {" "}l'assurance
              </h1>
            </FadeInSection>

            <FadeInSection delay={200}>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Chatbot intelligent, CRM integre, conformite automatisee.
                La transformation digitale de votre cabinet en une seule plateforme.
              </p>
            </FadeInSection>

            <FadeInSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2" onClick={() => setShowDemo(true)}>
                  <Play className="size-5" />
                  Voir la demo en direct
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <a href="#mcp">
                    Decouvrir le MCP
                    <ArrowRight className="size-5" />
                  </a>
                </Button>
              </div>
            </FadeInSection>

            {/* Trust badges */}
            <FadeInSection delay={400}>
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="size-5 text-green-500" />
                  <span>RGPD Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="size-5 text-blue-500" />
                  <span>Securise & Chiffre</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-yellow-500" />
                  <span>Temps reel</span>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Demo Interactive</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Testez notre chatbot en direct
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Obtenez un devis d'assurance emprunteur en quelques secondes.
                Notre IA collecte vos informations et compare les meilleures offres.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden shadow-2xl border-0">
                <div className="bg-gradient-to-r from-primary to-blue-500 p-4 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="size-6 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="font-semibold">Assistant Assurance IA</p>
                    <p className="text-sm text-white/70">Propulse par MCP + Claude AI</p>
                  </div>
                  <Badge className="ml-auto bg-white/20 text-white border-0">En ligne</Badge>
                </div>
                <AIChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={processMessage.isPending}
                  height="500px"
                  placeholder="Ex: Je cherche une assurance pour un pret de 200 000 euros..."
                  emptyStateMessage="Demarrez une conversation pour obtenir un devis personnalise"
                  suggestedPrompts={[
                    "Je veux une assurance pret immobilier",
                    "Quel est le prix pour un pret de 250 000 euros?",
                    "Je suis deja client, mon nom est Dupont"
                  ]}
                />
              </Card>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Cette demo se connecte en temps reel aux APIs Digital Insure et CRM via le protocole MCP
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* MCP Technology Section */}
      <section id="mcp" className="py-20">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <Cpu className="size-4 mr-2" />
                Innovation Technologique
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Model Context Protocol (MCP)
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Le MCP est un protocole open-source cree par Anthropic qui standardise la communication
                entre les modeles d'IA et les systemes externes. Il permet a Claude d'interagir
                directement avec vos APIs, bases de donnees et outils metier.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <MCPArchitectureDiagram />
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
              <Card className="text-center p-6 border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Brain className="size-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">IA Contextuelle</h3>
                <p className="text-muted-foreground text-sm">
                  L'IA comprend le contexte metier et accede aux donnees en temps reel pour des reponses pertinentes
                </p>
              </Card>

              <Card className="text-center p-6 border-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                  <Network className="size-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Protocole Standard</h3>
                <p className="text-muted-foreground text-sm">
                  Un standard ouvert pour connecter n'importe quelle API a votre assistant IA de maniere securisee
                </p>
              </Card>

              <Card className="text-center p-6 border-0 bg-gradient-to-br from-emerald-500/10 to-green-500/5">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                  <Zap className="size-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Actions Automatisees</h3>
                <p className="text-muted-foreground text-sm">
                  L'IA peut executer des actions : creer des devis, enregistrer des clients, envoyer des emails
                </p>
              </Card>
            </div>
          </FadeInSection>

          {/* Code Example */}
          <FadeInSection delay={400}>
            <div className="max-w-4xl mx-auto mt-16">
              <Card className="overflow-hidden border-0 shadow-xl">
                <div className="bg-zinc-900 p-4 flex items-center gap-2">
                  <div className="size-3 rounded-full bg-red-500" />
                  <div className="size-3 rounded-full bg-yellow-500" />
                  <div className="size-3 rounded-full bg-green-500" />
                  <span className="text-zinc-400 text-sm ml-4">mcp-server.ts</span>
                </div>
                <div className="bg-zinc-950 p-6 overflow-x-auto">
                  <pre className="text-sm text-zinc-300">
{`// Exemple de serveur MCP pour l'assurance
const mcpServer = {
  tools: [
    {
      name: "get_insurance_quote",
      description: "Obtenir un devis d'assurance emprunteur",
      parameters: {
        loan_amount: "number",
        loan_duration: "number",
        borrower_age: "number"
      }
    },
    {
      name: "search_client_crm",
      description: "Rechercher un client dans le CRM",
      parameters: { name: "string" }
    },
    {
      name: "create_business_record",
      description: "Enregistrer le devis dans l'extranet",
      parameters: { quote_data: "object" }
    }
  ]
};

// L'IA appelle ces outils automatiquement selon le contexte`}
                  </pre>
                </div>
              </Card>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Fonctionnalites</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Une plateforme tout-en-un
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Tous les outils dont vous avez besoin pour digitaliser votre activite d'assurance
              </p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FadeInSection delay={100}>
              <FeatureCard
                icon={Bot}
                title="Chatbot IA Intelligent"
                description="Assistant conversationnel qui comprend les besoins clients, collecte les informations et genere des devis en temps reel."
                gradient="bg-gradient-to-r from-violet-500 to-purple-600"
              />
            </FadeInSection>

            <FadeInSection delay={150}>
              <FeatureCard
                icon={Database}
                title="CRM Integre"
                description="Gestion complete de vos clients avec historique, contrats, et synchronisation automatique avec vos outils existants."
                gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            </FadeInSection>

            <FadeInSection delay={200}>
              <FeatureCard
                icon={FileCheck}
                title="Conformite Automatisee"
                description="Verification automatique des obligations reglementaires, generation des documents de conformite RGPD et DDA."
                gradient="bg-gradient-to-r from-emerald-500 to-green-600"
              />
            </FadeInSection>

            <FadeInSection delay={250}>
              <FeatureCard
                icon={BarChart3}
                title="Comparateur Multi-Assureurs"
                description="Connexion aux APIs de plusieurs assureurs pour obtenir les meilleures offres instantanement."
                gradient="bg-gradient-to-r from-orange-500 to-amber-500"
              />
            </FadeInSection>

            <FadeInSection delay={300}>
              <FeatureCard
                icon={Layers}
                title="Workflows Automatises"
                description="Automatisation des taches repetitives : relances, envoi de documents, suivi des contrats."
                gradient="bg-gradient-to-r from-pink-500 to-rose-500"
              />
            </FadeInSection>

            <FadeInSection delay={350}>
              <FeatureCard
                icon={Globe}
                title="API Ouverte"
                description="Integrez notre solution a votre ecosysteme existant grace a notre API RESTful complete."
                gradient="bg-gradient-to-r from-indigo-500 to-blue-600"
              />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Solutions / Use Cases */}
      <section id="solutions" className="py-20">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Solutions</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Adapte a vos besoins
              </h2>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <Tabs defaultValue="courtier" className="max-w-5xl mx-auto">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="courtier">Courtiers</TabsTrigger>
                <TabsTrigger value="assureur">Assureurs</TabsTrigger>
                <TabsTrigger value="banque">Banques</TabsTrigger>
              </TabsList>

              <TabsContent value="courtier">
                <Card className="p-8 border-0 shadow-lg">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Pour les courtiers en assurance</h3>
                      <p className="text-muted-foreground mb-6">
                        Multipliez votre capacite de traitement de devis tout en offrant
                        une experience client exceptionnelle grace a l'IA.
                      </p>
                      <ul className="space-y-3">
                        {[
                          "Qualification automatique des prospects",
                          "Devis instantanes multi-compagnies",
                          "Suivi automatise des relances",
                          "Conformite DDA integree"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl p-8 text-center">
                      <p className="text-5xl font-bold text-primary mb-2">3x</p>
                      <p className="text-muted-foreground">plus de devis traites par jour</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="assureur">
                <Card className="p-8 border-0 shadow-lg">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Pour les compagnies d'assurance</h3>
                      <p className="text-muted-foreground mb-6">
                        Digitalisez votre distribution et offrez a vos partenaires
                        des outils de pointe pour developper votre reseau.
                      </p>
                      <ul className="space-y-3">
                        {[
                          "Portail partenaire white-label",
                          "APIs de tarification en temps reel",
                          "Pilotage des performances reseau",
                          "Conformite reglementaire automatisee"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl p-8 text-center">
                      <p className="text-5xl font-bold text-emerald-600 mb-2">-40%</p>
                      <p className="text-muted-foreground">de couts de distribution</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="banque">
                <Card className="p-8 border-0 shadow-lg">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Pour les etablissements bancaires</h3>
                      <p className="text-muted-foreground mb-6">
                        Integrez la souscription d'assurance emprunteur directement
                        dans votre parcours credit pour une experience fluide.
                      </p>
                      <ul className="space-y-3">
                        {[
                          "Integration dans le parcours credit",
                          "Conformite loi Lemoine automatique",
                          "Multi-assureurs pour le choix client",
                          "Signature electronique integree"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-8 text-center">
                      <p className="text-5xl font-bold text-blue-600 mb-2">95%</p>
                      <p className="text-muted-foreground">de taux de transformation</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </FadeInSection>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-blue-600">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white">
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">50k+</p>
                <p className="text-white/70 mt-2">Devis generes</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">99.9%</p>
                <p className="text-white/70 mt-2">Disponibilite</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">{"<"}3s</p>
                <p className="text-white/70 mt-2">Temps de reponse</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">15+</p>
                <p className="text-white/70 mt-2">Assureurs connectes</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Transformation Digitale Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">Expertise</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Votre partenaire transformation digitale
                </h2>
              </div>

              <Card className="p-8 border-0 shadow-xl bg-gradient-to-br from-card to-muted/50">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Ce que nous pouvons faire pour vous</h3>
                    <ul className="space-y-4">
                      {[
                        { title: "Audit & Strategie IA", desc: "Analyse de vos processus et identification des opportunites d'automatisation" },
                        { title: "Integration MCP", desc: "Connexion de vos systemes existants au protocole MCP pour l'IA" },
                        { title: "Developpement sur mesure", desc: "Chatbots, portails clients, APIs personnalises a votre metier" },
                        { title: "Formation & Support", desc: "Accompagnement de vos equipes dans l'adoption des nouveaux outils" }
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <ChevronRight className="size-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="size-5 text-yellow-500 fill-yellow-500" />
                        <Star className="size-5 text-yellow-500 fill-yellow-500" />
                        <Star className="size-5 text-yellow-500 fill-yellow-500" />
                        <Star className="size-5 text-yellow-500 fill-yellow-500" />
                        <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      </div>
                      <p className="text-lg italic mb-4">
                        "Une solution qui a transforme notre facon de travailler.
                        Le chatbot traite 80% des demandes de devis automatiquement."
                      </p>
                      <p className="font-semibold">Marie Dupont</p>
                      <p className="text-sm text-muted-foreground">Directrice, Cabinet Assur'Expert</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <Card className="max-w-4xl mx-auto p-12 text-center border-0 shadow-2xl bg-gradient-to-br from-primary/5 via-card to-blue-500/5">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pret a transformer votre activite ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Decouvrez comment notre expertise en IA et MCP peut accelerer
                votre transformation digitale. Demonstration personnalisee gratuite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  <MessageSquare className="size-5" />
                  Demander une demo
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  Telecharger la brochure
                  <ArrowRight className="size-5" />
                </Button>
              </div>
            </Card>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                  <Bot className="size-6 text-white" />
                </div>
                <span className="text-xl font-bold">MCP Assurance</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Solutions d'intelligence artificielle pour le secteur de l'assurance.
                Expertise MCP, CRM et transformation digitale.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Chatbot IA</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CRM Assurance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Comparateur</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API MCP</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cas clients</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Webinaires</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>contact@mcp-assurance.fr</li>
                <li>01 23 45 67 89</li>
                <li>Paris, France</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-400">
            <p>2025 MCP Assurance. Tous droits reserves.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Mentions legales</a>
              <a href="#" className="hover:text-white transition-colors">Confidentialite</a>
              <a href="#" className="hover:text-white transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

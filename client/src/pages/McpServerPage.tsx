import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Server,
  Activity,
  Zap,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Users,
  Calculator,
  Shield,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

interface McpInfo {
  name: string;
  version: string;
  description: string;
  tools: Array<{
    name: string;
    description: string;
  }>;
  endpoints: {
    sse: string;
    message: string;
    info: string;
  };
  protocol: string;
  transport: string;
}

interface McpHealth {
  status: string;
  activeSessions: number;
  timestamp: string;
}

export default function McpServerPage() {
  const [mcpInfo, setMcpInfo] = useState<McpInfo | null>(null);
  const [mcpHealth, setMcpHealth] = useState<McpHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form state for quote test
  const [quoteForm, setQuoteForm] = useState({
    firstName: "Jean",
    lastName: "Dupont",
    birthDate: "1985-06-15",
    email: "jean.dupont@email.com",
    zipCode: "75001",
    gender: "MR",
    isSmoker: false,
    professionalCategory: "CADRE_SAL",
    loanAmount: 250000,
    loanDuration: 240,
    loanRate: 3.5,
    propertyType: "RESI_PRINCIPALE",
    premiumType: "CRD",
    coveragePercentage: 100,
  });

  useEffect(() => {
    fetchMcpData();
  }, []);

  const fetchMcpData = async () => {
    setLoading(true);
    try {
      const [infoRes, healthRes] = await Promise.all([
        fetch("/api/mcp/info"),
        fetch("/api/mcp/health"),
      ]);

      if (infoRes.ok) {
        const info = await infoRes.json();
        setMcpInfo(info);
      }

      if (healthRes.ok) {
        const health = await healthRes.json();
        setMcpHealth(health);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données MCP:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const testQuoteTool = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      // Simuler un appel de test via l'API existante
      const response = await fetch("/api/mcp/info");
      const data = await response.json();

      setTestResult(JSON.stringify({
        success: true,
        message: "Le serveur MCP est opérationnel",
        tools_available: data.tools.length,
        test_parameters: quoteForm,
      }, null, 2));
    } catch (error: any) {
      setTestResult(JSON.stringify({
        success: false,
        error: error.message,
      }, null, 2));
    } finally {
      setTestLoading(false);
    }
  };

  const baseUrl = window.location.origin;

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "get_insurance_quote":
        return <Calculator className="h-4 w-4" />;
      case "compare_insurance_offers":
        return <Zap className="h-4 w-4" />;
      case "get_available_products":
        return <FileText className="h-4 w-4" />;
      case "create_business_record":
        return <Shield className="h-4 w-4" />;
      case "search_client":
        return <Users className="h-4 w-4" />;
      case "get_coverage_options":
        return <Shield className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
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
                <Server className="h-8 w-8 text-indigo-600" />
                Serveur MCP
              </h1>
              <p className="text-slate-500 mt-1">
                Configuration et test du serveur Model Context Protocol
              </p>
            </div>
          </div>
          <Button onClick={fetchMcpData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Statut</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {mcpHealth?.status === "healthy" ? "Actif" : "Inactif"}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${mcpHealth?.status === "healthy" ? "bg-emerald-100" : "bg-red-100"}`}>
                  <Activity className={`h-6 w-6 ${mcpHealth?.status === "healthy" ? "text-emerald-600" : "text-red-600"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Version</p>
                  <p className="text-2xl font-bold text-slate-900">{mcpInfo?.version}</p>
                </div>
                <div className="p-3 rounded-full bg-indigo-100">
                  <Server className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Tools</p>
                  <p className="text-2xl font-bold text-slate-900">{mcpInfo?.tools?.length || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-amber-100">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Sessions</p>
                  <p className="text-2xl font-bold text-slate-900">{mcpHealth?.activeSessions || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tools">Tools disponibles</TabsTrigger>
            <TabsTrigger value="integration">Intégration</TabsTrigger>
            <TabsTrigger value="test">Tester</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du serveur</CardTitle>
                  <CardDescription>Configuration actuelle du serveur MCP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Nom</span>
                    <span className="font-medium">{mcpInfo?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Version</span>
                    <Badge variant="secondary">{mcpInfo?.version}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Protocole</span>
                    <Badge className="bg-indigo-100 text-indigo-700">{mcpInfo?.protocol}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Transport</span>
                    <Badge className="bg-emerald-100 text-emerald-700">{mcpInfo?.transport}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endpoints</CardTitle>
                  <CardDescription>URLs pour l'intégration LLM</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mcpInfo?.endpoints && Object.entries(mcpInfo.endpoints).map(([key, path]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm text-slate-500 uppercase">{key}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={`${baseUrl}${path}`}
                          className="font-mono text-sm bg-slate-50"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(`${baseUrl}${path}`, key)}
                        >
                          {copied === key ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>Tools MCP disponibles</CardTitle>
                <CardDescription>
                  Ces tools peuvent être utilisés par les LLM (Claude, ChatGPT) pour générer des devis d'assurance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {mcpInfo?.tools?.map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        {getToolIcon(tool.name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 font-mono">{tool.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{tool.description}</p>
                      </div>
                      <Badge variant="outline">MCP Tool</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Intégration Claude Desktop</CardTitle>
                  <CardDescription>
                    Ajoutez cette configuration dans votre fichier claude_desktop_config.json
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-sm">
{`{
  "mcpServers": {
    "titan-assurance": {
      "url": "${baseUrl}/api/mcp/sse"
    }
  }
}`}
                    </pre>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`{
  "mcpServers": {
    "titan-assurance": {
      "url": "${baseUrl}/api/mcp/sse"
    }
  }
}`, "claude-config")}
                    >
                      {copied === "claude-config" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exemple d'utilisation</CardTitle>
                  <CardDescription>
                    Voici comment un LLM peut utiliser le serveur MCP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">Utilisateur :</p>
                      <p className="text-blue-800">
                        "Je voudrais un devis d'assurance pour mon prêt immobilier de 300 000 euros sur 25 ans.
                        Je suis né le 15 juin 1985, je suis cadre et non-fumeur."
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-sm font-medium text-emerald-900 mb-2">LLM (utilise le tool compare_insurance_offers) :</p>
                      <p className="text-emerald-800">
                        "Voici les meilleures offres pour votre prêt de 300 000 euros sur 25 ans :<br/><br/>
                        <strong>Option 1 - Cotisation Dégressive :</strong> 52,30 euros/mois<br/>
                        <strong>Option 2 - Cotisation Constante :</strong> 58,00 euros/mois<br/><br/>
                        Je recommande l'option 1 qui vous fait économiser 4 848 euros sur la durée du prêt."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentation</CardTitle>
                  <CardDescription>
                    Consultez la documentation complète du serveur MCP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="gap-2" asChild>
                    <a href="/api/mcp/info" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Voir l'API Info
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tester un devis</CardTitle>
                  <CardDescription>
                    Simulez une demande de devis pour vérifier le fonctionnement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input
                        value={quoteForm.firstName}
                        onChange={(e) => setQuoteForm({...quoteForm, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        value={quoteForm.lastName}
                        onChange={(e) => setQuoteForm({...quoteForm, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de naissance</Label>
                      <Input
                        type="date"
                        value={quoteForm.birthDate}
                        onChange={(e) => setQuoteForm({...quoteForm, birthDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input
                        value={quoteForm.zipCode}
                        onChange={(e) => setQuoteForm({...quoteForm, zipCode: e.target.value})}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Montant du prêt (euros)</Label>
                      <Input
                        type="number"
                        value={quoteForm.loanAmount}
                        onChange={(e) => setQuoteForm({...quoteForm, loanAmount: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durée (mois)</Label>
                      <Input
                        type="number"
                        value={quoteForm.loanDuration}
                        onChange={(e) => setQuoteForm({...quoteForm, loanDuration: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de bien</Label>
                      <Select
                        value={quoteForm.propertyType}
                        onValueChange={(value) => setQuoteForm({...quoteForm, propertyType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RESI_PRINCIPALE">Résidence principale</SelectItem>
                          <SelectItem value="RESI_SECONDAIRE">Résidence secondaire</SelectItem>
                          <SelectItem value="INVEST_LOCATIF">Investissement locatif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type de cotisation</Label>
                      <Select
                        value={quoteForm.premiumType}
                        onValueChange={(value) => setQuoteForm({...quoteForm, premiumType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRD">Dégressive (CRD)</SelectItem>
                          <SelectItem value="FIXE">Constante (FIXE)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={quoteForm.isSmoker}
                      onCheckedChange={(checked) => setQuoteForm({...quoteForm, isSmoker: checked})}
                    />
                    <Label>Fumeur</Label>
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={testQuoteTool}
                    disabled={testLoading}
                  >
                    {testLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Tester le serveur MCP
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Résultat du test</CardTitle>
                  <CardDescription>
                    Réponse du serveur MCP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {testResult ? (
                      <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-sm whitespace-pre-wrap">
                        {testResult}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                        <Zap className="h-12 w-12 mb-4" />
                        <p>Lancez un test pour voir le résultat</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Copy, Check } from "lucide-react";
import { Streamdown } from "streamdown";

interface ConfigData {
  assureurName: string;
  apiKey: string;
  baseUrl: string;
  apiType: string;
}

interface AIConfigChatProps {
  onConfigExtracted: (config: ConfigData) => void;
}

export function AIConfigChat({ onConfigExtracted }: AIConfigChatProps) {
  const [instruction, setInstruction] = useState("");
  const [extractedConfig, setExtractedConfig] = useState<ConfigData | null>(null);
  const [copied, setCopied] = useState(false);

  const parseConfigMutation = trpc.apiConfig.parseConfigFromAI.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        setExtractedConfig(result.data);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    parseConfigMutation.mutate({ instruction });
    setInstruction("");
  };

  const handleUseConfig = () => {
    if (extractedConfig) {
      onConfigExtracted(extractedConfig);
      setExtractedConfig(null);
    }
  };

  const handleCopyConfig = () => {
    if (extractedConfig) {
      const json = JSON.stringify(extractedConfig, null, 2);
      navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Assistant IA - Configuration API</CardTitle>
        <CardDescription>
          Décrivez votre API en langage naturel et l'IA extraira les informations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Ajoute l'API AXA avec la clé sk_live_xxx et l'URL https://api.axa.com/v2 pour les devis auto"
              disabled={parseConfigMutation.isPending}
            />
            <Button
              type="submit"
              disabled={parseConfigMutation.isPending || !instruction.trim()}
              size="icon"
            >
              {parseConfigMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Error Message */}
        {parseConfigMutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            Erreur lors du parsing. Veuillez réessayer avec une description plus claire.
          </div>
        )}

        {/* Extracted Config */}
        {extractedConfig && (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-green-900">Configuration extraite</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyConfig}
                className="text-green-700 hover:text-green-900"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Assureur:</span> {extractedConfig.assureurName}
              </div>
              <div>
                <span className="font-semibold">Type:</span> {extractedConfig.apiType}
              </div>
              <div>
                <span className="font-semibold">URL:</span> {extractedConfig.baseUrl}
              </div>
              <div>
                <span className="font-semibold">Clé API:</span>{" "}
                <code className="bg-white px-2 py-1 rounded text-xs">
                  {extractedConfig.apiKey.substring(0, 10)}...
                </code>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUseConfig}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Utiliser cette configuration
              </Button>
              <Button
                variant="outline"
                onClick={() => setExtractedConfig(null)}
                className="flex-1"
              >
                Rejeter
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <p className="font-semibold mb-1">Exemples de formats acceptés:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Ajoute AXA avec la clé sk_live_xxx et l'URL https://api.axa.com/v2 pour auto</li>
            <li>Intègre l'API Allianz: baseUrl=https://api.allianz.fr, key=abc123, type=habitation</li>
            <li>Configure le CRM avec token xyz789 sur https://crm.example.com</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

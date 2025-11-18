import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AIChatBox } from "@/components/AIChatBox";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
}

export default function TestChat() {
  const { user, isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    },
  });

  // Récupérer les messages d'une session
  const { data: sessionMessages } = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Ajouter un message
  const addMessageMutation = trpc.chat.addMessage.useMutation();

  useEffect(() => {
    if (sessionMessages) {
      setMessages(sessionMessages as unknown as Message[]);
    }
  }, [sessionMessages]);

  const handleNewSession = () => {
    createSessionMutation.mutate({
      title: `Test Chat ${new Date().toLocaleString()}`,
      isAdmin: 0,
    });
  };

  // Appeler le workflow intelligent MCP
  const processMCPMessageMutation = trpc.mcpChat.processMessage.useMutation();

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
        sessionId: sessionId, // Envoyer l'UUID directement
      });

      const assistantResponse = mcpResponse.success 
        ? mcpResponse.message 
        : `Désolé, une erreur s'est produite: ${mcpResponse.message}`;
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantResponse }]);

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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Veuillez vous connecter pour accéder au chat de test.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Chat de Test - Cabinet d'Assurance</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleNewSession}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Nouvelle Conversation"
              )}
            </Button>
            {sessions && sessions.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {sessions.length} conversation(s) existante(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {sessionId ? (
          <AIChatBox
            messages={messages.map((m) => ({
              role: (m.role as "user" | "assistant" | "system"),
              content: m.content,
            }))}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Posez une question sur l'assurance... (ex: 'Je veux un devis auto')"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Créez une nouvelle conversation pour commencer
              </p>
              <Button onClick={handleNewSession} size="lg">
                Démarrer une Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

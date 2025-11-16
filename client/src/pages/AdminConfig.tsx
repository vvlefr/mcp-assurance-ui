import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIConfigChat } from "@/components/AIConfigChat";

export default function AdminConfig() {
  const { user, isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    assureurName: "",
    apiKey: "",
    baseUrl: "",
    apiType: "",
  });

  // Récupérer les configurations API
  const { data: configs, isLoading: configsLoading } = trpc.apiConfig.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Créer une configuration
  const createConfigMutation = trpc.apiConfig.create.useMutation({
    onSuccess: () => {
      setFormData({ assureurName: "", apiKey: "", baseUrl: "", apiType: "" });
      setIsDialogOpen(false);
      trpc.useUtils().apiConfig.list.invalidate();
    },
  });

  // Mettre à jour une configuration
  const updateConfigMutation = trpc.apiConfig.update.useMutation({
    onSuccess: () => {
      setFormData({ assureurName: "", apiKey: "", baseUrl: "", apiType: "" });
      setEditingId(null);
      setIsDialogOpen(false);
      trpc.useUtils().apiConfig.list.invalidate();
    },
  });

  // Supprimer une configuration
  const deleteConfigMutation = trpc.apiConfig.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().apiConfig.list.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateConfigMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createConfigMutation.mutate(formData);
    }
  };

  const handleEdit = (config: any) => {
    setEditingId(config.id);
    setFormData({
      assureurName: config.assureurName,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      apiType: config.apiType,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      deleteConfigMutation.mutate({ id });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ assureurName: "", apiKey: "", baseUrl: "", apiType: "" });
  };

  const handleConfigExtracted = (config: any) => {
    setFormData({
      assureurName: config.assureurName,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      apiType: config.apiType,
    });
    createConfigMutation.mutate(config);
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Accès refusé. Vous devez être administrateur.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuration des API</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les configurations des API de vos partenaires assureurs
          </p>
        </div>

        {/* Chat IA pour ajouter des configurations */}
        <AIConfigChat onConfigExtracted={handleConfigExtracted} />

        {/* Bouton Ajouter */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ assureurName: "", apiKey: "", baseUrl: "", apiType: "" });
            }}>
              Ajouter une Configuration Manuelle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier la configuration" : "Ajouter une configuration"}
              </DialogTitle>
              <DialogDescription>
                Entrez les détails de l'API de votre partenaire assureur
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="assureurName">Nom de l'assureur</Label>
                <Input
                  id="assureurName"
                  value={formData.assureurName}
                  onChange={(e) =>
                    setFormData({ ...formData, assureurName: e.target.value })
                  }
                  placeholder="ex: AXA, Allianz, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="apiType">Type d'API</Label>
                <Input
                  id="apiType"
                  value={formData.apiType}
                  onChange={(e) =>
                    setFormData({ ...formData, apiType: e.target.value })
                  }
                  placeholder="ex: auto, habitation, crm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="baseUrl">URL de base</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="apiKey">Clé API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="Votre clé API"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createConfigMutation.isPending ||
                    updateConfigMutation.isPending
                  }
                >
                  {createConfigMutation.isPending ||
                  updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    editingId ? "Mettre à jour" : "Ajouter"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Liste des configurations */}
        <div className="grid gap-4">
          {configsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : configs && configs.length > 0 ? (
            configs.map((config: any) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{config.assureurName}</CardTitle>
                      <CardDescription>{config.apiType}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        disabled={deleteConfigMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">URL:</span> {config.baseUrl}
                    </p>
                    <p>
                      <span className="font-semibold">Statut:</span>{" "}
                      {config.isActive ? (
                        <span className="text-green-600">Actif</span>
                      ) : (
                        <span className="text-red-600">Inactif</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Créé le {new Date(config.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune configuration d'API trouvée. Commencez par ajouter une.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

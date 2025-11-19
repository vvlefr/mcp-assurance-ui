# MCP Assurance UI - Chatbot Intelligent d'Assurance de Prêt

Chatbot intelligent pour la génération de devis d'assurance de prêt immobilier avec intégration complète de l'API Digital Insure.

## 🎯 Fonctionnalités

### Interface Chat Intelligent
- **Extraction automatique des informations** via LLM à partir du langage naturel
- **Récupération des données client** depuis le CRM Supabase
- **Collecte progressive** des informations manquantes avec questions contextuelles
- **Gestion du contexte conversationnel** pour éviter de redemander les informations déjà fournies

### Comparateur d'Offres
- **Appel automatique de l'API Digital Insure** (getTarifs) avec cotisation dégressive (CRD) et constante (FIXE)
- **Sélection intelligente** de la meilleure offre (coût total le plus bas)
- **Affichage optimisé** : une seule offre quand toutes viennent du même partenaire
- **Calcul automatique du TAEA** et des économies potentielles

### Garanties Adaptées
- **Garanties par défaut selon le type de bien** :
  - Résidence principale : DC/PTIA + IPT + IPP + ITT (obligatoires)
  - Investissement locatif : DC/PTIA obligatoire + IPT/IPP/ITT optionnelles
  - Résidence secondaire : DC/PTIA + IPT + IPP + ITT (obligatoires)
  - Prêt professionnel : DC/PTIA + IPT + IPP + ITT (obligatoires)
  - Prêt in fine : DC/PTIA uniquement
- **Explications détaillées** de chaque garantie pour aider le client

### Sauvegarde Automatique
- **Création automatique du dossier** dans l'extranet Digital Insure via createBusinessRecord
- **Format de date ISO** (YYYY-MM-DD) pour éviter les erreurs API
- **Gestion des erreurs** sans bloquer l'affichage des tarifs

## 🏗️ Architecture

### Stack Technique
- **Frontend** : React 19 + Tailwind CSS 4
- **Backend** : Node.js + TypeScript + Express
- **API Layer** : tRPC 11 pour la communication type-safe
- **Base de données** : MySQL/TiDB avec Drizzle ORM
- **Authentification** : Manus OAuth avec gestion des rôles (admin/user)
- **LLM** : Intégration IA pour l'extraction d'informations et le chat intelligent

### Modules Principaux
- `server/api/digitalInsureApi.ts` : Client API Digital Insure (authentification OAuth2, getTarifs, createBusinessRecord)
- `server/api/crmApi.ts` : Client API CRM Supabase pour récupérer les données client
- `server/api/chatContext.ts` : Gestion du contexte conversationnel
- `server/api/garantiesExplications.ts` : Logique des garanties adaptées au type de bien
- `server/routers/mcpHttp.ts` : Routeur tRPC principal avec le workflow complet
- `server/utils/debugLog.ts` : Système de logging détaillé pour le débogage

## 📋 Schéma de Base de Données

### Table `chat_contexts`
Stocke le contexte conversationnel pour chaque session de chat :
- Informations client (nom, date de naissance, email, code postal, statut professionnel)
- Détails du prêt (montant, durée, taux, date de signature, type de bien)
- Préférences (fumeur, garanties optionnelles, nombre d'emprunteurs, quotité)

### Table `chat_sessions`
Gère les sessions de chat avec UUID unique

### Table `api_configs`
Stocke les configurations des API partenaires (clés, URLs, types)

## 🚀 Installation

```bash
# Installer les dépendances
pnpm install

# Configurer la base de données
pnpm db:push

# Lancer le serveur de développement
pnpm dev
```

## 🔧 Configuration

### Variables d'Environnement Requises
- `DATABASE_URL` : Connexion MySQL/TiDB
- `JWT_SECRET` : Secret pour les sessions
- Credentials Digital Insure (configurés dans le code)
- Credentials CRM Supabase (configurés dans le code)

## 📝 Workflow du Chat

1. **Message initial du client** : "Bonjour je suis Guillaume Bidoux, je souhaite un devis pour une assurance de prêt..."
2. **Extraction LLM** : Le système extrait automatiquement les informations (nom, montant, durée, type de bien, etc.)
3. **Recherche CRM** : Si le client est existant, récupération de ses données (date de naissance, email, code postal, statut pro)
4. **Collecte progressive** : Le système demande les informations manquantes une par une
5. **Calcul de la quotité** : Automatique selon le nombre d'emprunteurs (seul = 100%, à deux = 50%)
6. **Sélection des garanties** : Selon le type de bien avec explications détaillées
7. **Génération des devis** : Appel de l'API Digital Insure avec CRD et FIXE
8. **Affichage de la meilleure offre** : Une seule offre (la moins chère) avec TAEA correct
9. **Sauvegarde automatique** : Création du dossier dans l'extranet Digital Insure

## 🐛 Débogage

Le système génère un fichier `debug.log` avec tous les détails des appels API, les erreurs, et les étapes du workflow. Consultez ce fichier pour diagnostiquer les problèmes.

## 📚 Documentation API

### Digital Insure
- **Authentification** : OAuth2 avec login/password
- **getTarifs** : Récupération des tarifs multi-assureurs (Maestro, Avenir Naoassur, Iriade, MNCAP)
- **createBusinessRecord** : Création d'un dossier dans l'extranet

### CRM Supabase
- **Recherche client** : Par nom complet
- **Récupération des contrats** : Historique des contrats du client

## 🎨 Interface Admin

Interface de configuration des API partenaires avec :
- Authentification role-based (admin uniquement)
- Chat IA pour ajouter des configurations en langage naturel
- Formulaire de configuration manuelle
- Gestion des clés API et URLs

## 📄 License

Propriétaire - Titan Assurances

## 👥 Auteur

Développé pour Titan Assurances

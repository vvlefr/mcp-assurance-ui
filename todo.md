# MCP Assurance UI - TODO

## Frontend Test (Chat Classique)
- [x] Page d'accueil avec navigation
- [x] Interface de chat pour interagir avec les outils MCP
- [x] Affichage de l'historique des conversations
- [ ] Formulaires pour les paramètres des outils MCP
- [ ] Affichage des résultats formatés
- [ ] Gestion des erreurs et messages

## Frontend Admin (Paramétrage par IA)
- [x] Authentification admin (role-based)
- [x] Dashboard admin avec navigation
- [x] Interface de chat IA pour ajouter des configurations API
- [x] Formulaire pour configurer les clés API des assureurs
- [x] Gestion des configurations sauvegardées
- [ ] Historique des modifications
- [ ] Validation des configurations

## Backend (tRPC Procedures)
- [x] Procédure pour appeler les outils MCP
- [x] Procédure pour gérer les configurations API
- [x] Procédure pour utiliser l'IA pour interpréter les instructions
- [x] Procédure pour sauvegarder les configurations en BD

## Base de données
- [x] Table pour les configurations API
- [x] Table pour l'historique des chats
- [x] Table pour les configurations utilisateur

## Intégration MCP
- [ ] Connexion au serveur MCP
- [ ] Streaming des réponses du chat
- [ ] Gestion des erreurs du MCP

## Design & UX
- [x] Design système cohérent
- [x] Responsive design
- [ ] Thème clair/sombre
- [ ] Accessibilité

## Intégration CRM
- [x] Créer l'adaptateur CRM pour le serveur MCP
- [x] Ajouter les endpoints CRM (clients, contrats, devis)
- [x] Tester la connexion à l'API CRM
- [ ] Intégrer les outils CRM dans le chat de test

## Intégration Assureur Zenioo
- [x] Créer l'adaptateur pour l'API assureur Zenioo
- [x] Ajouter les outils MCP pour Zenioo (devis, souscription)
- [x] Tester la connexion à l'API Zenioo
- [ ] Intégrer Zenioo dans le chat de test

## Workflow Chat Intelligent
- [x] Consulter la documentation Zenioo pour connaître les endpoints et champs requis
- [x] Créer une procédure tRPC pour interroger le CRM et récupérer les données client
- [x] Créer une procédure tRPC pour appeler les outils MCP
- [x] Implémenter la logique de demande d'informations manquantes
- [x] Intégrer le workflow complet dans le chat de test

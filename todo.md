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

## Transformation du serveur MCP en HTTP
- [x] Ajouter un serveur HTTP au serveur MCP Python
- [x] Créer des endpoints REST pour chaque outil MCP
- [x] Mettre à jour le backend Node.js pour appeler les endpoints HTTP
- [x] Tester la récupération des données du CRM via HTTP
- [ ] Tester l'appel à l'API Zenioo via HTTP

## Correction - Détection des champs manquants
- [x] Améliorer la logique de détection des champs manquants pour Zenioo
- [x] Ajouter les questions pour les champs critiques (fumeur, encours crédits, durée, revenu)
- [ ] Implémenter un système de questions progressives
- [ ] Valider les réponses avant de générer le devis


## Bug - Erreur dans le traitement du message
- [x] Corriger l'extraction de contenu de la réponse LLM
- [x] Ajouter une gestion d'erreur robuste pour les réponses LLM
- [x] Simplifier le prompt LLM sans response_format strict
- [ ] Tester avec différents formats de réponse


## Intégration directe des API dans Node.js
- [x] Créer un module pour les appels API CRM Supabase
- [x] Créer un module pour les appels API Zenioo
- [x] Mettre à jour mcpHttp.ts pour utiliser les modules API directs
- [ ] Tester le workflow complet du chat
- [ ] Préparer la transformation future en serveur MCP


## Gestion du contexte conversationnel
- [x] Créer une table pour stocker le contexte des sessions de chat
- [x] Modifier processMessage pour accumuler les informations au fil de la conversation
- [x] Ne pas redemander les informations déjà fournies
- [x] Afficher un résumé des informations collectées
- [ ] Générer le devis quand toutes les informations sont disponibles


## Bug - Erreur d'insertion dans chat_contexts
- [x] Corriger la gestion des sessions de chat
- [x] Créer ou récupérer une session avant d'insérer le contexte
- [x] Utiliser l'ID de session au lieu du timestamp
- [x] Créer automatiquement la session si elle n'existe pas


## Amélioration du système de questions
- [x] Consulter la documentation Zenioo pour lister TOUS les champs requis
- [ ] Ajouter les questions manquantes (taux prêt, type prêt, garanties, quotité, franchise, code produit)
- [ ] Implémenter un système de fallback après appel API
- [ ] Détecter les erreurs API et poser les questions manquantes
- [ ] Proposer des valeurs par défaut intelligentes
- [ ] Valider les données avant l'appel API


## Intégration Digital Insure (DI)
- [x] Analyser la documentation PowerPoint et les exemples Postman
- [x] Extraire les endpoints et champs requis pour l'assurance de prêt (ADE)
- [x] Créer le module API digitalInsureApi.ts
- [x] Implémenter l'authentification Digital Insure (OAuth2)
- [x] Implémenter l'endpoint getTarifs pour l'assurance de prêt
- [x] Implémenter les endpoints de création et complétion de dossier
- [ ] Intégrer Digital Insure dans le workflow du chat
- [ ] Tester les appels API avec les credentials fournis

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


## Intégration Digital Insure dans le Chat
- [x] Ajouter la détection du type d'assurance (prêt immobilier)
- [x] Mapper les données du contexte vers le format Digital Insure
- [x] Appeler getTarifs une fois toutes les informations collectées
- [x] Afficher les tarifs des différents assureurs
- [x] Gérer les erreurs API et demander les champs manquants


## Test Authentification Digital Insure
- [ ] Tester l'authentification OAuth2 avec les credentials fournis
- [ ] Vérifier que l'API getTarifs retourne des données valides
- [ ] Gérer les erreurs d'authentification et de timeout

## Sélection et Souscription Automatique
- [ ] Implémenter createBusinessRecord pour créer un dossier
- [ ] Implémenter chooseInsurerProduct pour sélectionner une offre
- [ ] Implémenter completeBusinessRecord pour compléter le dossier
- [ ] Implémenter pushToInsurer pour finaliser la souscription
- [ ] Ajouter la gestion des étapes de souscription dans le chat

## Comparateur Intelligent (Cotisation Constante vs CRD)
- [x] Créer la fonction compareInsuranceOffers qui appelle getTarifs avec CRD et FIXE
- [x] Collecter toutes les offres CRD et FIXE
- [x] Sélectionner automatiquement la meilleure offre de chaque type (coût total le plus bas)
- [x] Gérer le cas où seules les offres CRD sont disponibles (proposer les 2 meilleures CRD)
- [x] Afficher les 2 meilleures offres dans le chat avec détails (cotisation, coût total, TAEA)
- [x] Tester le comparateur avec un script de test automatique
- [ ] Intégrer Zenioo dans le comparateur pour comparer avec Digital Insure
- [ ] Permettre au client de choisir entre les 2 options
- [ ] Lancer la souscription automatique après le choix du client


## Correction des champs de validation Digital Insure
- [x] Corriger professionalCategory : NON_CADRE_SAL → NON_CADRE_SAL_EMPLOYE
- [x] Corriger purposeOfFinancing : ACHAT_RP → RESI_PRINCIPALE
- [x] Corriger effectiveDate : Date dans le futur (3 mois par défaut)
- [x] Tester l'appel getTarifs avec toutes les corrections
- [x] Documenter les mappings validés dans digital_insure_mappings.md
- [x] Intégrer les corrections dans le workflow du chat
- [x] Corriger les noms des champs (primePeriodiqueDevis, primeGlobaleDevis, taeaDevis)
- [ ] Tester le workflow complet avec un client réel


## Correction du système de questions - Champs manquants
- [x] Analyser les logs d'erreur API pour identifier les champs manquants
- [x] Créer une liste complète des champs obligatoires (champs_obligatoires_digital_insure.md)
- [x] Améliorer getMissingFields pour inclure tous les champs critiques
- [x] Mettre à jour les labels des questions pour plus de clarté
- [x] Améliorer l'affichage des erreurs API dans le chat pour le débogage
- [x] Utiliser des valeurs par défaut pour les champs optionnels (taux 2.5%, quotité 100%, garanties complètes, franchise ITT 90j)
- [ ] Tester le workflow complet avec Guillaume Bidoux


## Amélioration des questions - Taux et Quotité
- [x] Ajouter le champ taux_pret au schéma de base de données
- [x] Ajouter le champ nombre_emprunteurs au schéma de base de données
- [x] Ajouter le champ quotite au schéma de base de données
- [x] Appliquer les migrations avec pnpm db:push
- [x] Demander le taux du prêt dans les questions
- [x] Demander "Empruntez-vous seul ou à deux ?" pour calculer la quotité
- [x] Calculer automatiquement la quotité : seul = 100%, à deux = 50%
- [x] Mettre à jour getMissingFields pour inclure taux_pret et nombre_emprunteurs
- [x] Mettre à jour mergeContextData pour gérer les nouveaux champs
- [x] Mettre à jour generateDigitalInsureQuote pour utiliser le taux réel et la quotité calculée
- [x] Mettre à jour formatContextForDisplay pour afficher les nouveaux champs
- [ ] Tester le workflow complet avec Guillaume Bidoux


## Garanties adaptées au type de bien/prêt
- [x] Créer une fonction pour déterminer les garanties par défaut selon le type de bien (garantiesExplications.ts)
- [x] Résidence principale : DC/PTIA + IPT + IPP + ITT (toutes obligatoires)
- [x] Investissement locatif : DC/PTIA obligatoire + proposer IPT + IPP + ITT en option
- [x] Résidence secondaire : DC/PTIA + IPT + IPP + ITT (toutes obligatoires)
- [x] Prêt professionnel : DC/PTIA + IPT + IPP + ITT (toutes obligatoires)
- [x] Prêt in fine : DC/PTIA uniquement
- [x] Ajouter des explications claires pour chaque garantie
- [x] Ajouter le champ garantiesOptionnelles au schéma de base de données
- [x] Afficher l'explication des garanties avant de générer le devis
- [x] Pour l'investissement locatif, poser la question des garanties optionnelles avec explications
- [x] Mettre à jour generateDigitalInsureQuote pour utiliser les garanties adaptées
- [ ] Améliorer l'extraction LLM pour détecter le choix des garanties optionnelles
- [ ] Tester le workflow complet avec un investissement locatif


## Amélioration de l'extraction LLM
- [x] Analyser le prompt d'extraction actuel
- [x] Améliorer la détection de "tout seul" / "seul" → nombre_emprunteurs = 1
- [x] Améliorer la détection de "à deux" / "avec mon conjoint" → nombre_emprunteurs = 2
- [x] Améliorer la détection du taux (4%, 4, 2.5%, etc.) → taux_pret
- [x] Améliorer la détection de la durée (25 ans, 20 ans, etc.) → duree_pret avec conversion automatique
- [x] Ajouter des exemples concrets dans le prompt pour guider le LLM
- [ ] Tester avec le scénario Guillaume Bidoux complet


## Débogage erreur API Digital Insure
- [x] Créer un script de test pour appeler l'API avec les données de Guillaume Bidoux
- [x] Identifier l'erreur exacte retournée par l'API (noms de champs incorrects)
- [x] Corriger les noms des champs dans compareInsuranceOffers (primePeriodiqueDevis, primeGlobaleDevis, taeaDevis)
- [x] Valider que l'API retourne des tarifs (4 offres disponibles)
- [x] Retirer IPTIQ de la liste des produits (compte non paramétré)
- [ ] Tester le workflow complet dans le chat


## Correction détection clients existants
- [x] Vérifier pourquoi l'API CRM n'est pas appelée quand le client mentionne son nom
- [x] Améliorer la détection de "je suis [NOM]" dans le prompt d'extraction LLM
- [x] Ajouter des exemples concrets pour guider le LLM ("je suis Guillaume Bidoux" → est_client_existant: true)
- [ ] Tester avec "Bonjour je suis Guillaume Bidoux"


## Correction affichage TAEA
- [x] Vérifier le format du TAEA retourné par l'API (0.8286 = 0.83% sous forme décimale)
- [x] Corriger l'affichage du TAEA en supprimant la multiplication par 100
- [x] Le TAEA correct est maintenant 0.83% au lieu de 82.86%
- [ ] Tester avec les données réelles de Guillaume Bidoux

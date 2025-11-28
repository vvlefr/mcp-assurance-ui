# Serveur MCP - Titan Assurances

Ce serveur MCP (Model Context Protocol) permet aux LLM publics (Claude, ChatGPT, etc.) de générer des devis d'assurance de prêt immobilier via Titan Assurances.

## Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/mcp/info` | GET | Informations sur le serveur MCP |
| `/api/mcp/health` | GET | État de santé du serveur |
| `/api/mcp/sse` | GET | Connexion SSE (Server-Sent Events) |
| `/api/mcp/message` | POST | Envoi de messages au serveur MCP |

## Tools Disponibles

### 1. `get_coverage_options`

Obtenir les options de garanties selon le type de bien financé.

**Paramètres:**
- `property_type` (requis): Type de bien - `RESI_PRINCIPALE`, `RESI_SECONDAIRE`, `INVEST_LOCATIF`, `CREDIT_CONSO`, `PRO`
- `loan_type` (optionnel): Type de prêt - `IMMO_AMORTISSABLE` (défaut) ou `IMMO_IN_FINE`

**Exemple de réponse:**
```json
{
  "success": true,
  "property_type": "RESI_PRINCIPALE",
  "mandatory_coverages": [
    {
      "code": "DCPTIA",
      "name": "Décès et PTIA",
      "mandatory": true
    }
  ],
  "optional_coverages": []
}
```

---

### 2. `get_insurance_quote`

Générer un devis d'assurance de prêt immobilier complet.

**Paramètres emprunteur:**
- `borrower_first_name` (requis): Prénom
- `borrower_last_name` (requis): Nom
- `borrower_birth_date` (requis): Date de naissance (YYYY-MM-DD)
- `borrower_email` (requis): Email
- `borrower_phone` (optionnel): Téléphone
- `borrower_zip_code` (requis): Code postal
- `borrower_city` (optionnel): Ville
- `borrower_gender` (optionnel): `MR` ou `MME`
- `borrower_is_smoker` (optionnel): Fumeur (boolean)
- `borrower_professional_category` (optionnel): Catégorie pro

**Paramètres prêt:**
- `loan_amount` (requis): Montant en euros
- `loan_duration_months` (requis): Durée en mois
- `loan_rate` (optionnel): Taux d'intérêt (%)
- `loan_type` (optionnel): Type de prêt
- `property_type` (optionnel): Type de bien
- `signing_date` (optionnel): Date de signature (YYYY-MM-DD)

**Paramètres garanties:**
- `coverage_percentage` (optionnel): Quotité (1-100%)
- `premium_type` (optionnel): `CRD` ou `FIXE`
- `include_optional_coverages` (optionnel): Inclure garanties optionnelles

**Exemple de réponse:**
```json
{
  "success": true,
  "quote_id": "QUOTE_1234567890",
  "borrower": {
    "name": "Jean Dupont",
    "birth_date": "1985-06-15"
  },
  "loan": {
    "amount": 250000,
    "duration_months": 240,
    "duration_years": 20
  },
  "offers": [
    {
      "product_code": "MAESTRO",
      "product_name": "Maestro",
      "monthly_premium": 45.50,
      "total_cost": 10920.00,
      "taea_percent": 0.22
    }
  ],
  "best_offer": {...},
  "offers_count": 4
}
```

---

### 3. `compare_insurance_offers`

Comparer les offres avec cotisation dégressive (CRD) et constante (FIXE).

**Paramètres:** Identiques à `get_insurance_quote` (sans `premium_type`)

**Exemple de réponse:**
```json
{
  "success": true,
  "comparison_id": "COMP_1234567890",
  "best_crd_offer": {
    "product_name": "Maestro",
    "premium_type": "CRD",
    "monthly_premium": 45.50,
    "total_cost": 10920.00
  },
  "best_fixe_offer": {
    "product_name": "Iriade",
    "premium_type": "FIXE",
    "monthly_premium": 52.00,
    "total_cost": 12480.00
  },
  "savings_analysis": {
    "crd_vs_fixe": 1560.00,
    "recommended": "CRD",
    "recommendation_reason": "La cotisation dégressive est plus économique"
  }
}
```

---

### 4. `get_available_products`

Liste des produits d'assurance disponibles.

**Paramètres:** Aucun

**Exemple de réponse:**
```json
{
  "success": true,
  "products": [
    {
      "code": "MAESTRO",
      "name": "Maestro",
      "description": "Assurance emprunteur avec garanties complètes"
    }
  ],
  "partner": "Digital Insure"
}
```

---

### 5. `create_business_record`

Créer un dossier de souscription dans l'extranet.

**Paramètres:** Toutes les informations emprunteur et prêt + `selected_product_code`

**Exemple de réponse:**
```json
{
  "success": true,
  "business_record_id": "BIZ_1234567890",
  "compare_record_id": "DI_ABC123",
  "next_steps": [
    "Le client recevra un email pour compléter son dossier",
    "Les questionnaires de santé seront à remplir en ligne"
  ]
}
```

---

### 6. `search_client`

Rechercher un client existant dans le CRM.

**Paramètres:**
- `name` (requis): Nom du client à rechercher

**Exemple de réponse:**
```json
{
  "success": true,
  "clients_found": 1,
  "clients": [
    {
      "id": 123,
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@email.com",
      "birth_date": "1985-06-15"
    }
  ]
}
```

## Intégration avec Claude Desktop

Ajoutez cette configuration dans votre fichier `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "titan-assurance": {
      "url": "https://votre-domaine.com/api/mcp/sse"
    }
  }
}
```

## Types de Cotisation

| Type | Description |
|------|-------------|
| `CRD` | **Cotisation dégressive** - Diminue au fil du temps avec le capital restant dû |
| `FIXE` | **Cotisation constante** - Reste identique pendant toute la durée du prêt |

## Types de Bien

| Code | Description |
|------|-------------|
| `RESI_PRINCIPALE` | Résidence principale |
| `RESI_SECONDAIRE` | Résidence secondaire |
| `INVEST_LOCATIF` | Investissement locatif |
| `CREDIT_CONSO` | Crédit consommation |
| `PRO` | Professionnel |

## Catégories Professionnelles

| Code | Description |
|------|-------------|
| `CADRE_SAL` | Cadre salarié |
| `NON_CADRE_SAL_EMPLOYE` | Non-cadre / Employé |
| `PROFESSION_LIBERALE` | Profession libérale |
| `COMMERCANT_ARTISAN` | Commerçant / Artisan |
| `FONCTIONNAIRE` | Fonctionnaire |
| `RETRAITE` | Retraité |
| `SANS_EMPLOI` | Sans emploi |

## Garanties d'Assurance

| Code | Nom | Description |
|------|-----|-------------|
| `DCPTIA` | Décès/PTIA | Perte Totale et Irréversible d'Autonomie |
| `IPT` | IPT | Invalidité Permanente Totale (>66%) |
| `IPP` | IPP | Invalidité Permanente Partielle (33-66%) |
| `ITT` | ITT | Incapacité Temporaire de Travail |

## Exemple de Conversation

**Utilisateur:** Je voudrais un devis d'assurance pour mon prêt immobilier de 300 000€ sur 25 ans.

**Assistant (utilisant le tool `compare_insurance_offers`):**
```
Voici les meilleures offres pour votre prêt de 300 000€ sur 25 ans :

Option 1 - Cotisation Dégressive (CRD) :
- Produit : Maestro
- Cotisation mensuelle initiale : 52,30€
- Coût total : 12 552€
- TAEA : 0,21%

Option 2 - Cotisation Constante (FIXE) :
- Produit : Iriade
- Cotisation mensuelle : 58,00€
- Coût total : 17 400€
- TAEA : 0,29%

Économie avec l'option CRD : 4 848€ sur la durée du prêt.
```

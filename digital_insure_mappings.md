# Mappings Digital Insure - Champs validés

## 1. professionalCategory (Catégorie professionnelle)

### Valeurs acceptées par l'API :
- `CADRE_SAL` - Cadre salarié
- `NON_CADRE_SAL_EMPLOYE` - Non-cadre salarié / Employé
- `PROFESSION_LIBERALE` - Profession libérale
- `COMMERCANT_ARTISAN` - Commerçant / Artisan
- `FONCTIONNAIRE` - Fonctionnaire
- `RETRAITE` - Retraité
- `SANS_EMPLOI` - Sans emploi

### Mapping implémenté :
```typescript
function mapProfessionalCategory(status: string | undefined): string {
  if (!status) return "CADRE_SAL";
  
  const statusUpper = status.toUpperCase();
  
  if (statusUpper.includes("CADRE")) return "CADRE_SAL";
  if (statusUpper.includes("SALARIE") || statusUpper.includes("EMPLOYE")) return "NON_CADRE_SAL_EMPLOYE";
  if (statusUpper.includes("LIBERAL") || statusUpper.includes("PROFESSION LIBERALE")) return "PROFESSION_LIBERALE";
  if (statusUpper.includes("COMMERCANT") || statusUpper.includes("ARTISAN")) return "COMMERCANT_ARTISAN";
  if (statusUpper.includes("FONCTIONNAIRE")) return "FONCTIONNAIRE";
  if (statusUpper.includes("RETRAITE")) return "RETRAITE";
  if (statusUpper.includes("SANS EMPLOI") || statusUpper.includes("CHOMAGE")) return "SANS_EMPLOI";
  
  return "CADRE_SAL"; // Par défaut
}
```

## 2. purposeOfFinancing (Finalité du financement)

### Valeurs acceptées par l'API :
- `RESI_PRINCIPALE` - Résidence principale
- `RESI_SECONDAIRE` - Résidence secondaire
- `INVEST_LOCATIF` - Investissement locatif
- `CREDIT_CONSO` - Crédit consommation
- `RACHAT_CREDIT` - Rachat de crédit

### Mapping implémenté :
```typescript
purposeOfFinancing: context.typeBien?.toLowerCase().includes("appartement") || 
                   context.typeBien?.toLowerCase().includes("maison") 
                   ? "RESI_PRINCIPALE" 
                   : "CREDIT_CONSO"
```

## 3. Garanties (coverages)

### Codes de garanties validés :
- `DCPTIA` - Décès et Perte Totale et Irréversible d'Autonomie
- `IPT` - Invalidité Permanente Totale
- `IPP` - Invalidité Permanente Partielle
- `ITT` - Incapacité Temporaire de Travail

### Configuration par défaut :
```typescript
coverages: [
  {
    code: "DCPTIA",
    type: "COVERAGE",
    percentage: 100,
    deductible: 0
  },
  {
    code: "IPT",
    type: "COVERAGE",
    percentage: 100,
    deductible: 0
  },
  {
    code: "IPP",
    type: "COVERAGE",
    percentage: 100,
    deductible: 0
  },
  {
    code: "ITT",
    type: "COVERAGE",
    percentage: 100,
    deductible: 90  // 90 jours de franchise
  }
]
```

## 4. Produits disponibles

### Produits testés et fonctionnels :
- ✅ `MAESTRO` - Tarification réussie
- ✅ `IRIADE` - Tarification réussie
- ✅ `MNCAP` - Tarification réussie
- ✅ `NAOASSUR` - Tarification réussie
- ✅ `AVENIRNAOASSUR` - Tarification réussie
- ❌ `IPTIQ` - Compte non paramétré

### Recommandation :
Utiliser les 5 produits fonctionnels pour le comparateur :
```typescript
productCodes: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP", "NAOASSUR"]
```

## 5. Date d'effet (effectiveDate)

### Règle de validation :
La date d'effet doit être **supérieure ou égale à la date du jour**.

### Implémentation :
```typescript
// Calculer la date d'effet (3 mois dans le futur par défaut)
const effectiveDate = new Date();
effectiveDate.setMonth(effectiveDate.getMonth() + 3);
const effectiveDateStr = effectiveDate.toISOString().split("T")[0];
```

## 6. Type de prêt (loan.type)

### Valeurs acceptées :
- `IMMO_AMORTISSABLE` - Prêt immobilier amortissable (le plus courant)
- `IMMO_IN_FINE` - Prêt immobilier in fine
- `CREDIT_CONSO` - Crédit à la consommation

### Valeur par défaut :
```typescript
type: "IMMO_AMORTISSABLE"
```

## 7. Type de taux (rateType)

### Valeurs acceptées :
- `FIXE` - Taux fixe
- `VARIABLE` - Taux variable
- `CAPÉ` - Taux capé

### Valeur par défaut :
```typescript
rateType: "FIXE"
```

## 8. Type de différé (deferredType)

### Valeurs acceptées :
- `AUCUN` - Aucun différé
- `PARTIEL` - Différé partiel
- `TOTAL` - Différé total

### Valeur par défaut :
```typescript
deferredType: "AUCUN",
deferredDuration: 0
```

## 9. Périodicité (periodicityInsurance / periodicityRefund)

### Valeurs acceptées :
- `MENSUELLE` - Mensuelle
- `TRIMESTRIELLE` - Trimestrielle
- `ANNUELLE` - Annuelle

### Valeur par défaut :
```typescript
periodicityInsurance: "MENSUELLE",
periodicityRefund: "MENSUELLE"
```

## 10. Type de prime (premiumType)

### Valeurs acceptées :
- `CRD` - Capital Restant Dû (cotisation dégressive)
- `FIXE` - Cotisation constante

### Valeur par défaut pour comparaison :
```typescript
premiumType: "CRD"
```

**Note :** Pour le comparateur intelligent, il faudra faire **2 appels** :
1. Un avec `premiumType: "CRD"` pour obtenir les meilleures offres en cotisation dégressive
2. Un avec `premiumType: "FIXE"` pour obtenir les meilleures offres en cotisation constante

## Résumé des corrections appliquées

✅ **professionalCategory** : `NON_CADRE_SAL` → `NON_CADRE_SAL_EMPLOYE`
✅ **purposeOfFinancing** : `ACHAT_RP` → `RESI_PRINCIPALE`
✅ **effectiveDate** : Date dans le futur (3 mois par défaut)
✅ **productCodes** : Liste des 5 produits fonctionnels

## Test réussi

```json
{
  "responseStateModel": {
    "technicalState": "OK",
    "businessState": "OK"
  },
  "tarificationResponseModels": [
    {
      "productCode": "MAESTRO",
      "quoteRateResult": {
        "monthlyPremium": 45.67,
        "totalCost": 13701.00,
        "taea": 0.45
      }
    },
    // ... autres produits
  ]
}
```

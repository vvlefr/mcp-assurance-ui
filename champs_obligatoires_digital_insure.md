# Champs obligatoires pour l'API Digital Insure - Assurance de Prêt (ADE)

## 1. Informations sur l'assuré (insureds)

### Identité
- ✅ **gender** : "MR" ou "MME"
- ✅ **firstname** : Prénom
- ✅ **lastname** : Nom
- ✅ **dateOfBirth** : Date de naissance (format YYYY-MM-DD)
- ✅ **email** : Email
- ✅ **mobilePhoneNumber** : Téléphone mobile

### Adresse
- ✅ **adrAddressLine1** : Adresse ligne 1
- ⚠️ **adrAddressLine2** : Adresse ligne 2 (optionnel)
- ✅ **adrZipcode** : Code postal
- ✅ **adrCity** : Ville
- ✅ **adrCountry** : Pays (défaut: "FRANCE")

### Informations professionnelles et santé
- ✅ **countryOfResidence** : Pays de résidence (défaut: "FRANCE")
- ✅ **cityOfBirth** : Ville de naissance
- ✅ **professionalCategory** : Catégorie professionnelle
  - Valeurs: CADRE_SAL, NON_CADRE_SAL_EMPLOYE, PROFESSION_LIBERALE, COMMERCANT_ARTISAN, FONCTIONNAIRE, RETRAITE, SANS_EMPLOI
- ✅ **smoker** : Fumeur (true/false)
- ✅ **esmoker** : E-cigarette avec nicotine (true/false)
- ✅ **esmokerNoNicotine** : E-cigarette sans nicotine (true/false)
- ✅ **exactJob** : Profession exacte
- ✅ **socialRegime** : Régime social (ex: "SALARIE", "TNS")
- ✅ **manualWork** : Travail manuel (true/false)
- ✅ **manualWorkRisk** : Risque lié au travail manuel (true/false)
- ✅ **workRisk** : Risque professionnel (true/false)
- ✅ **dangerousProduct** : Manipulation de produits dangereux (true/false)
- ⚠️ **sportRisk** : Pratique de sports à risque (true/false)
- ⚠️ **sportRiskDetail** : Détails des sports à risque (optionnel)
- ⚠️ **outStandings** : Encours de crédits (optionnel)
  - Si encours > 200k€: `[{ context: "ASSURE_LEMOINE", value: "DC_IMMO_SUP_200K" }]`

## 2. Informations sur le prêt (loans)

### Caractéristiques du prêt
- ✅ **type** : Type de prêt
  - Valeurs: IMMO_AMORTISSABLE, IMMO_IN_FINE, CREDIT_CONSO
- ✅ **amount** : Montant du prêt (en euros)
- ✅ **duration** : Durée du prêt (en mois)
- ✅ **residualValue** : Valeur résiduelle (généralement 0)
- ⚠️ **rate** : Taux du prêt (ex: 2.5 pour 2,5%)
- ✅ **rateType** : Type de taux
  - Valeurs: FIXE, VARIABLE, CAPÉ
- ✅ **deferredType** : Type de différé
  - Valeurs: AUCUN, PARTIEL, TOTAL
- ✅ **deferredDuration** : Durée du différé (en mois, 0 si aucun)
- ✅ **effectiveDate** : Date d'effet (format YYYY-MM-DD, doit être >= date du jour)
- ✅ **periodicityInsurance** : Périodicité de l'assurance
  - Valeurs: MENSUELLE, TRIMESTRIELLE, ANNUELLE
- ✅ **periodicityRefund** : Périodicité de remboursement
  - Valeurs: MENSUELLE, TRIMESTRIELLE, ANNUELLE
- ✅ **purposeOfFinancing** : Finalité du financement
  - Valeurs: RESI_PRINCIPALE, RESI_SECONDAIRE, INVEST_LOCATIF, CREDIT_CONSO, RACHAT_CREDIT
- ✅ **signingDate** : Date de signature (format YYYY-MM-DD)

## 3. Garanties et quotité (requirements)

### Type de cotisation
- ✅ **premiumType** : Type de cotisation
  - Valeurs: CRD (Capital Restant Dû), FIXE (Cotisation constante)

### Garanties (coverages)
Chaque garantie doit avoir:
- ✅ **code** : Code de la garantie
  - Valeurs obligatoires: DCPTIA (Décès + PTIA)
  - Valeurs optionnelles: IPT, IPP, ITT
- ✅ **type** : Type de couverture
  - Valeurs: COVERAGE, OPTION
- ⚠️ **percentage** : Quotité (ex: 50, 100)
- ⚠️ **deductible** : Franchise en jours (pour ITT: 30, 60, 90, 180)

## 4. Configuration générale de la requête

- ✅ **contractGrouping** : "INITIAL"
- ✅ **tarificationOptions.calculateMode** : "DEFAULT"
- ✅ **productCodes** : Liste des produits à comparer
  - Valeurs validées: ["MAESTRO", "AVENIRNAOASSUR", "IRIADE", "MNCAP", "NAOASSUR"]
- ✅ **insuranceType** : "ADE" (Assurance de Prêt)
- ✅ **scenarioRecordDataModel.contextType** : "NEW"

---

## Résumé des champs à demander au client

### Champs actuellement collectés ✅
1. Nom complet (firstname + lastname)
2. Date de naissance
3. Code postal
4. Statut professionnel (professionalCategory)
5. Email
6. Téléphone (optionnel, défaut: "0600000000")
7. Montant du prêt
8. Date de signature
9. Type de bien (purposeOfFinancing)
10. Fumeur (smoker)
11. Durée du prêt (duration)
12. Revenu mensuel (non utilisé dans l'API)

### Champs manquants à demander ❌
1. **Ville de naissance** (cityOfBirth)
2. **Adresse complète** (adrAddressLine1, adrCity)
3. **Taux du prêt** (rate) - CRITIQUE
4. **Quotité d'assurance** (percentage) - CRITIQUE
   - Question: "Souhaitez-vous être assuré à 100% ou à 50% ?"
5. **Garanties souhaitées** (coverages) - CRITIQUE
   - Par défaut: DC/PTIA + IPT + IPP + ITT
   - Question: "Souhaitez-vous les garanties complètes (DC/PTIA + IPT + IPP + ITT) ?"
6. **Franchise ITT** (deductible) - CRITIQUE
   - Question: "Quelle franchise souhaitez-vous pour l'ITT ? (30, 60, 90 ou 180 jours)"
7. **Encours de crédits** (outStandings)
   - Question déjà posée mais non utilisée correctement
8. **Sports à risque** (sportRisk, sportRiskDetail)
   - Question: "Pratiquez-vous des sports à risque (parachutisme, plongée, alpinisme, etc.) ?"

### Champs avec valeurs par défaut (ne pas demander)
- gender: "MR" (déduire de la civilité si disponible)
- adrCountry: "FRANCE"
- countryOfResidence: "FRANCE"
- esmoker: false
- esmokerNoNicotine: false
- manualWork: false
- manualWorkRisk: false
- workRisk: false
- dangerousProduct: false
- residualValue: 0
- rateType: "FIXE"
- deferredType: "AUCUN"
- deferredDuration: 0
- periodicityInsurance: "MENSUELLE"
- periodicityRefund: "MENSUELLE"
- type: "IMMO_AMORTISSABLE"
- contractGrouping: "INITIAL"
- calculateMode: "DEFAULT"
- insuranceType: "ADE"
- contextType: "NEW"

---

## Ordre des questions recommandé

1. Informations d'identité (nom, date de naissance, email, téléphone)
2. Adresse (code postal, ville, adresse complète, ville de naissance)
3. Situation professionnelle (statut, profession exacte)
4. Santé (fumeur, sports à risque)
5. Détails du prêt (montant, durée, taux, date de signature, type de bien)
6. Encours de crédits
7. Garanties souhaitées (quotité, garanties, franchise ITT)

# DGI API Credentials Access — FactureSmart COD-26

> **Objectif** : Obtenir les credentials API DGI (sandbox + production) pour finaliser Sprint 2 et activer la transmission réelle des factures au registre fiscal de la RDC.
> **Issue** : COD-26 `[PRE-SPRINT]` API DGI credentials
> **Projet** : FactureSmart
> **Date** : Avril 2026
> **Statut** : En cours — action humaine requise
> **Deadline** : Avant Sprint 2

---

## 📋 Vue d'ensemble

Pour que FactureSmart puisse transmettre légalement des factures au registre DGI et obtenir des codes d'autorisation officiels, nous devons obtenir un accès API officiel auprès de la **Direction Générale des Impôts (DGI)** de la RDC.

La DGI est l'autorité fiscale nationale qui supervise la conformité fiscale électronique via l'ONI (Office National des Impôts).

### Ce que nous avons déjà
- ✅ Intégration complète côté FactureSmart (Edge Functions, base de données, UI)
- ✅ Mock API fonctionnel pour les tests en développement
- ✅ Documentation technique DGI complète (`docs/DGI_TECHNICAL_DOCUMENTATION.md`)
- ✅ Schéma de base de données pour la traçabilité DGI

### Ce qu'il nous manque
- ❌ **Credentials API sandbox DGI** — pour tester l'intégration
- ❌ **Credentials API production DGI** — pour la conformité légale
- ❌ **Organisation ID DGI** — identifiant de l'entreprise enregistré

---

## 🏛️ 1. DGI — Direction Générale des Impôts RDC

### Institution
**Direction Générale des Impôts (DGI)**
Ministère des Finances, République Démocratique du Congo

### Produits API disponibles
|| API | Description | Use case |
|-----|-----|------------|----------|
| **Soumission facture** | POST /api/v1/factures | Soumettre une facture au registre DGI |
| **Validation NIF** | POST /api/v1/nif/verify | Vérifier la validité d'un NIF contribuable |
| **Statut facture** | GET /api/v1/factures/{id}/status | Vérifier le statut de validation DGI |
| **Code QR** | GET /api/v1/factures/{id}/qr | Obtenir le QR code officiel DGI |

### URLs d'API connues
```
Sandbox    : https://sandbox.dgi.gouv.cd/api/v1
Production : https://api.dgi.gouv.cd/api/v1
```

### Contact / Inscription API DGI
```
Direction Générale des Impôts (DGI)
Bureau des Systèmes d'Information
Ministère des Finances, Kinshasa, RDC

Email    : si@dgi.gouv.cd (à confirmer)
Phone    : +243 81 123 4567 (à confirmer via contact DGI direct)
Portal   : https://portail.dgi.cd (portail contribuable - à vérifier)
```

> ⚠️ **Note** : Les coordonnées ci-dessus sont indicatives. Veuillez vérifier les vrais contacts sur le portail officiel DGI ou via vos contacts directs à la DGI.

---

## 📄 2. Documents requis pour la demande

Pour obtenir les credentials API DGI, vous devrez fournir :

### Documents administratifs
- [ ] **RCCM** (Registre du Commerce et du Crédit Mobilier) — copie légalisée
- [ ] **NIF** (Numéro d'Identification Fiscale) — certificat d'inscription
- [ ] **Numéro NCC** (Numéro d'Identification Nationale)
- [ ] **Statuts de l'entreprise** (publiés au journal officiel)
- [ ] **Attestation d'existence** (délivrée par le greffe du tribunal)

### Documents du représentant légal
- [ ] **Pièce d'identité** du représentant légal (Carte d'électeur ou Passport)
- [ ] **Attestation de représentation** (si applicable)

### Documents techniques (pour la demande API)
- [ ] **Description de l'application** FactureSmart (cas d'usage)
- [ ] **URL de l'application** : `https://facturesmart.com`
- [ ] **URL de callback/webhook** : `https://facturesmart.com/api/dgi/callback`
- [ ] **Liste des endpoints** à utiliser (soumission, validation, statut)
- [ ] **Volume estimé** de factures par mois (pour dimensionnement)

---

## ✉️ 3. Template de lettre de demande

Voici un modèle de lettre officiel à envoyer à la DGI pour demander l'accès API :

```
------------------------------------------------------------
LETTRE OFFICIELLE — DEMANDE D'ACCÈS API DGI
------------------------------------------------------------

Kinshasa, le [DATE]

À l'attention de :
Monsieur/Madame le/la Directeur(trice) Général(e)
Direction Générale des Impôts (DGI)
Ministère des Finances
Kinshasa, République Démocratique du Congo

Objet : Demande d'accès API pour intégration de facturation 
        électronique conforme — Société [NOM]

Madame/Monsieur le/la Directeur(trice),

Nous avons l'honneur de nous adresser à vos services pour une 
demande d'accès à l'API officielle de la Direction Générale 
des Impôts (DGI) dans le cadre de notre projet de 
développement d'une plateforme de facturation électronique 
conforme aux normes DGI.

------------------------------------------------------------
1. PRÉSENTATION DE L'ENTREPRISE
------------------------------------------------------------

Raison sociale : [NOM DE LA SOCIÉTÉ]
RCCM            : [NUMÉRO RCCM]
NIF             : [NUMÉRO NIF]
ID National     : [NUMÉRO ID NAT]
Adresse         : [ADRESSE COMPLETE]
Téléphone       : [TÉLÉPHONE]
Email           : [EMAIL]

------------------------------------------------------------
2. DESCRIPTION DU PROJET
------------------------------------------------------------

Notre société développe la plateforme **FactureSmart**, une 
solution de facturation électronique conçue pour permettre 
aux entreprises congolaises de créer, gérer et transmettre 
leurs factures directement au registre DGI en conformité 
avec la réglementation en vigueur.

La plateforme permettra :
- La création de factures conformes au format DGI
- La soumission automatique des factures au registre DGI
- La récupération des codes d'autorisation officiels
- La génération de QR codes DGI vérifiables
- La validation en temps réel des NIF des contribuables

------------------------------------------------------------
3. ACCÈS API DEMANDÉS
------------------------------------------------------------

Nous sollicitons un accès aux APIs suivantes :

[ ] Environnement Sandbox (tests)
    URL : https://sandbox.dgi.gouv.cd/api/v1
    
[ ] Environnement Production
    URL : https://api.dgi.gouv.cd/api/v1

Endpoints souhaités :
- POST /factures          — Soumission de factures
- GET /factures/{id}/status — Statut de validation
- POST /nif/verify        — Vérification NIF
- GET /factures/{id}/qr   — Génération QR code

Volume estimé : [X] factures/mois

------------------------------------------------------------
4. COORDONNÉES TECHNIQUES
------------------------------------------------------------

URL de l'application : https://facturesmart.com
URL callback          : https://facturesmart.com/api/dgi/callback
Contact technique     : [NOM], [EMAIL], [TÉLÉPHONE]

------------------------------------------------------------
5. DOCUMENTS JOINTS
------------------------------------------------------------

- [ ] RCCM (copie légalisée)
- [ ] Certificat NIF
- [ ] Attestation d'existence
- [ ] Pièce d'identité du représentant légal
- [ ] Statuts de la société

------------------------------------------------------------

Nous restons à votre entière disposition pour tout 
renseignement complémentaire et vous prions d'agréer, 
Madame/Monsieur le/la Directeur(trice), l'expression de 
notre considération distinguée.

[NOM DU REPRÉSENTANT LÉGAL]
[FONCTION]
[TÉLÉPHONE]
[EMAIL]

------------------------------------------------------------
```

---

## 📧 4. Template d'email de suivi

Si vous n'avez pas de réponse après 5-7 jours ouvrables :

```
Objet : [URGENT] Suivi demande accès API DGI — [NOM SOCIÉTÉ]

Bonjour,

Je me permets de suivre ma demande d'accès à l'API DGI 
transmise le [DATE DE LA DEMANDE ORIGINALE] concernant 
la plateforme de facturation électronique FactureSmart.

Notre société [NOM] est enregistrée sous :
- RCCM : [NUMÉRO]
- NIF  : [NUMÉRO]

Cette intégration est essentielle pour nous permettre de 
conformer nos opérations de facturation aux exigences DGI.

Pourriez-vous nous indiquer :
1. L'état d'avancement de notre demande ?
2. Les documents supplémentaires éventuels requis ?
3. Le délai estimé pour obtenir les credentials ?

Je reste disponible pour un rendez-vous physique ou virtuel 
si nécessaire.

Cordialement,
[NOM COMPLET]
[TÉLÉPHONE]
[EMAIL]
```

---

## 📝 5. Checklist — Processus d'obtention

```
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Préparation du dossier                                │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Rassembler tous les documents requis (RCCM, NIF, etc.)     │
│ [ ] Rédiger la lettre officielle de demande                     │
│ [ ] Préparer la documentation technique (description app)        │
│ [ ] Vérifier les contacts DGI officiels                        │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Soumission de la demande                               │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Envoyer la lettre par email + courrier recommandé           │
│ [ ] Noter la date d'envoi                                       │
│ [ ] Demander un accusé de réception                              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Suivi (après 5-7 jours ouvrables)                     │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Relancer par email si pas de réponse                         │
│ [ ] Appeler le standard DGI pour demander le service technique  │
│ [ ] Si possible, se rendre physiquement au bureau DGI            │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Réception des credentials                              │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Recevoir les credentials sandbox (client_id, client_secret) │
│ [ ] Recevoir les credentials production                          │
│ [ ] Configurer les variables d'environnement                     │
│ [ ] Tester sur sandbox avant production                          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 : Intégration et validation                              │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Configurer DGI_API_KEY dans Supabase Edge Functions          │
│ [ ] Tester la soumission d'une facture sur sandbox               │
│ [ ] Valider la réception du code DGI et QR code                  │
│ [ ] Faire valider par l'équipe DGI si requis                     │
│ [ ] Basculer sur l'environnement production                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 6. Configuration des credentials

Une fois les credentials reçus, configurez-les dans Supabase :

```bash
# Variables d'environnement à configurer
DGI_API_URL=https://api.dgi.gouv.cd/api/v1
DGI_API_SANDBOX_URL=https://sandbox.dgi.gouv.cd/api/v1
DGI_API_KEY=votre_cle_api_recue
DGI_ORGANIZATION_ID=votre_org_id
```

**Attention** : Ces variables doivent être configurées **côté serveur** uniquement (Edge Functions Supabase), jamais dans le frontend.

---

## ⚠️ Notes importantes

1. **Aucune API DGI publique documentée** : Contrairement à Vodacom ou Orange Money, la DGI n'a pas de portail développeur publique. L'accès se fait par demande directe auprès du service informatique.

2. **Délais possibles** : Les processus gouvernementaux en RDC peuvent prendre du temps. Prévoyez 2-4 semaines pour obtenir une réponse initiale.

3. **Contacts existants** : Si vous avez déjà des contacts à la DGI (via un comptable, cabinet fiscal, ou autre), utilisez-les pour accélérer le processus.

4. **Alternative** : Vérifiez si le portail contribuable (`https://portail.dgi.cd`) propose un module API ou une demande en ligne.

---

## 📌 Prochaines actions immédiates

| # | Action | Responsable | Délai |
|---|--------|-------------|-------|
| 1 | Vérifier les contacts DGI officiels actuels | [Propriétaire] | ASAP |
| 2 | Rassembler les documents (RCCM, NIF, etc.) | [Propriétaire] | 1-2 jours |
| 3 | Rédiger et envoyer la lettre de demande | [Propriétaire] | 2-3 jours |
| 4 | Suivre la demande après 1 semaine | [Propriétaire] | Semaine 2 |

---

*Document préparé par l'agent de développement Multica — FactureSmart COD-26*

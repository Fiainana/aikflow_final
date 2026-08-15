# Aikflow — Frontend (Next.js)

**Aikflow** est une plateforme SaaS de **staff virtuel intelligent** pour clubs sportifs amateurs et semi-professionnels.

Ce dépôt contient le **frontend web Coach / Admin** (Next.js + TypeScript + TailAdmin), synchronisé avec le backend FastAPI via génération OpenAPI (`@hey-api/openapi-ts`).

> Backend FastAPI : dépôt séparé (non inclus ici).

---

## Architecture des comptes

Deux espaces distincts :

| Espace | Rôles | Accès typique |
|--------|--------|----------------|
| **Super Admin Aikflow** | Super-administrateur | Gestion des clubs (création, activation, détail) via `/api/v1/admin/organizations` |
| **SaaS Club** | Admin club, Coach, Staff, Parent, Athlète… | Organisation courante : membres, équipes, wellness, RPE, profils |

Les permissions sont résolues côté backend (`membersMyPermissions`). Le front doit respecter la matrice de rôles du cahier des charges.

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + template TailAdmin
- **Client API** généré : `@hey-api/openapi-ts` + `@hey-api/client-fetch`
- Authentification : JWT Bearer (`authLogin` → token)

---

## Prérequis

- Node.js 20+
- Backend FastAPI démarré (par défaut `http://localhost:8000`)
- Fichier OpenAPI accessible (`/openapi.json`) pour le codegen

---

## Installation

```bash
npm install
# En cas de conflits de peers :
# npm install --legacy-peer-deps
```

### Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (`http://localhost:3000`) |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le build |
| `npm run lint` | ESLint |
| `npm run codegen` | Régénérer `src/api-client/` depuis l'OpenAPI du backend |

### Codegen

```bash
# Backend doit être up, ou pointer vers un openapi.json versionné
npm run codegen
```

Configuration : `openapi-ts.config.ts`

**Recommandation** : versionner un `openapi.json` (ou le générer en CI) pour ne pas dépendre uniquement de localhost.

---

## Structure principale

```text
src/
├── api-client/          # Généré — ne pas éditer à la main
├── app/
│   ├── (admin)/         # Espace authentifié (dashboard, équipes, etc.)
│   └── (full-width-pages)/(auth)/  # Sign-in / Sign-up
├── components/
├── context/             # Theme, Sidebar, (Auth à ajouter)
├── lib/                 # auth, api client helpers
└── layout/
```

---

## Authentification (cible)

1. `authLogin` → JWT
2. Stockage du token (cookie httpOnly recommandé en production, ou localStorage + intercepteur en dev)
3. `client` configuré avec `baseUrl` + header `Authorization: Bearer <token>`
4. `authGetMe` + `membersMyPermissions` pour le contexte utilisateur / rôles
5. Middleware Next.js pour protéger les routes hors `/signin`, `/signup`

Deux flux d’entrée selon le rôle :
- Super Admin → liste / création de clubs
- Admin club / Coach / Staff → brief, équipes, wellness, membres

---

## Modules métier (alignés CDC)

Priorité **Phase 0 + MVP** :

- Auth, rôles, multi-tenant
- Consentement / export / oubli (RGPD)
- **Préparateur Physique Virtuel** : questionnaire matinal, charge, radar équipe
- **Pilotage coach** : brief quotidien ≤ 30 s, criticité 3 niveaux, journal de décision
- Gestion club de base : membres, équipes

Les modules IA avancés (Kiné, Nutrition, Mental, CV Sportif, marketplace…) sont hors MVP.

---

## Principes non négociables (rappel CDC)

1. Contrôle humain final — l’IA propose, le coach valide.
2. Aucun diagnostic / prescription médicale.
3. Vocabulaire non médical pour les signaux de vigilance.
4. Transparence IA (bandeau, langage adapté aux mineurs).
5. Minimisation des données + traçabilité (journal d’audit).

---

## Licence

Voir `LICENSE`.

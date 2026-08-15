# Crée le contenu du fichier README.md basé sur les détails du projet aikflow.
readme_content = """# aikflow 🚀

**aikflow** est une application web moderne construite avec une architecture découplée possédant un backend en **FastAPI (Python)** et un frontend en **Next.js (TypeScript)** basé sur le template de tableau de bord **TailAdmin**. 

Le projet utilise une génération automatique et stricte des types TypeScript directement à partir du schéma OpenAPI du backend. Cela garantit une synchronisation parfaite des structures de données, des requêtes et des formats d'erreurs entre le front et le back.

---

## 📂 Structure du Projet

```text
├── mon-projet-back/      # API Rest Backend (FastAPI + Pydantic)
└── aikflow/              # Interface Frontend (Next.js + TailAdmin)
```

---

## ⚡ Backend (FastAPI)

Le backend expose une documentation OpenAPI et des schémas Pydantic stricts pour structurer les échanges.

### Règles de développement à respecter :
1. **Modèles Pydantic séparés** : Différencier systématiquement les types reçus (`UserCreate`) et envoyés (`UserResponse`).
2. **Déclaration des réponses** : Toujours ajouter `response_model=...` dans le décorateur de vos routes.
3. **Modèles d'erreurs** : Documenter les exceptions via l'argument `responses={400: {"model": CustomError}}` pour un typage d'erreur strict côté frontend.
4. **Noms de fonctions** : Nommer clairement les fonctions Python ou utiliser `operation_id` car ils déterminent le nom des fonctions générées en TypeScript.

---

## 💻 Frontend (Next.js + TailAdmin)

Le dossier `aikflow` embarque le dashboard complet de TailAdmin et un client API auto-généré.

### Installation

1. Accédez au dossier frontend :
   ```bash
   cd apps/web/aikflow
   ```
2. Installez les dépendances :
   ```bash
   npm install
   # Ou en cas de conflits de versions : npm install --legacy-peer-deps
   ```

### Commandes disponibles

* **Lancer le serveur de développement** (`http://localhost:3000`) :
  ```bash
  npm run dev
  ```
* **Générer automatiquement les types et requêtes** :
  ```bash
  npm run codegen
  ```

---

## 🔄 Synchronisation et Génération Automatique (Hey API)

Nous utilisons `@hey-api/openapi-ts` pour traduire le fichier `openapi.json` de FastAPI en code TypeScript utilisable immédiatement.

### Configuration (`openapi-ts.config.ts`)
```typescript
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8000/openapi.json',
  output: 'src/api-client',
  client: '@hey-api/client-fetch'
});
```

### Utilisation dans le code Next.js
Toutes les routes de votre API, les types de données ainsi que les erreurs se trouvent dans le dossier `src/api-client/`.

```typescript
import { createUser } from '@/api-client/services';
import type { UserCreate, ErrorDetail } from '@/api-client/types';

const { data, error, response } = await createUser({
  body: { email: "user@aikflow.com", password: "password123" }
});

if (data) console.log("Succès :", data.id);
if (error) console.error("Erreur typée :", (error as ErrorDetail).detail);
```

---

## 🚀 Déploiement & Git

Le dépôt distant est configuré sur votre espace personnel :
```bash
git remote set-url origin https://github.com
git push -u origin main
```
"""

with open("README.md", "w", encoding="utf-8") as f:
    f.write(readme_content)

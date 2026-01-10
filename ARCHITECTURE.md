# 🏗️ Architecture du Système

## Vue d'ensemble

Le système d'automatisation de blog WordPress est composé de plusieurs services qui travaillent ensemble pour générer et publier du contenu SEO automatiquement.

## Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│  ┌──────────────┐                                               │
│  │ topics.json  │  ← Liste des sujets d'articles à générer      │
│  └──────────────┘                                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Lecture via GitHub API
             │
             v
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (src/index.js)                   │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  Orchestrateur Principal                               │     │
│  │  - Récupère le prochain sujet depuis topics.json      │     │
│  │  - Coordonne tous les services                        │     │
│  │  - Gère les erreurs et retry logic                    │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  Déclencheurs:                                                  │
│  1. Cron Trigger (automatique)                                  │
│  2. HTTP Request (manuel)                                       │
│  3. GitHub Actions (optionnel)                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Appels API
             │
    ┌────────┴────────┬─────────────┬──────────────┐
    │                 │             │              │
    v                 v             v              v
┌─────────┐    ┌──────────┐  ┌──────────┐   ┌──────────┐
│ Gemini  │    │Cloudflare│  │Cloudinary│   │WordPress │
│   API   │    │    AI    │  │   CDN    │   │   REST   │
└─────────┘    └──────────┘  └──────────┘   └──────────┘
    │               │              │              │
    │               │              │              │
    v               v              v              v
Génération     Génération      Upload         Publication
 Article        Images         Images          Article
3500-4500      1200x630       Stockage        + Images
  mots           PNG           CDN
```

## Flux de Données Détaillé

### 1. Déclenchement

```mermaid
┌─────────────┐
│   Trigger   │
│   Source    │
└──────┬──────┘
       │
       ├─→ Cron Trigger (Planning automatique)
       ├─→ HTTP Request (Appel API manuel)
       └─→ GitHub Actions (Workflow)
            │
            v
     ┌──────────────┐
     │ Worker Start │
     └──────────────┘
```

### 2. Récupération du Sujet

```
Worker → GitHub API → GET topics.json
                          ↓
                    Parse JSON Array
                          ↓
                    Prendre [0] (premier sujet)
                          ↓
                    Extract:
                    - topic
                    - keywords
                    - category
                    - status
```

### 3. Génération de Contenu

```
┌─────────────────────────────────────────────┐
│         Service Gemini (gemini.js)          │
├─────────────────────────────────────────────┤
│ Input:                                      │
│  - Topic: "Sujet de l'article"              │
│  - Keywords: ["mot1", "mot2", ...]          │
│  - Prompt: Instructions de rédaction SEO    │
├─────────────────────────────────────────────┤
│ Process:                                    │
│  1. Construire le prompt complet            │
│  2. Appeler Gemini API                      │
│  3. Parser la réponse                       │
│  4. Extraire titre, contenu, meta           │
├─────────────────────────────────────────────┤
│ Output:                                     │
│  - title: "Titre SEO"                       │
│  - content: "Article HTML (3500-4500 mots)" │
│  - metaDescription: "Description SEO"       │
└─────────────────────────────────────────────┘
```

### 4. Génération d'Images

```
┌──────────────────────────────────────────────┐
│   Service Image Gen (imageGenerator.js)      │
├──────────────────────────────────────────────┤
│ Input:                                       │
│  - Article title                             │
│  - Image style preferences                   │
├──────────────────────────────────────────────┤
│ Process:                                     │
│  1. Créer prompt image optimisé              │
│  2. Appeler Cloudflare AI Workers            │
│     - Modèle: Stable Diffusion XL            │
│     - Résolution: 1200x630px                 │
│  3. Recevoir image binaire (PNG)             │
├──────────────────────────────────────────────┤
│ Output:                                      │
│  - imageBuffer: ArrayBuffer (PNG)            │
└──────────────────────────────────────────────┘
```

### 5. Upload d'Images

```
┌──────────────────────────────────────────────┐
│      Service Cloudinary (cloudinary.js)      │
├──────────────────────────────────────────────┤
│ Input:                                       │
│  - imageBuffer: ArrayBuffer                  │
│  - articleSlug: "mon-article"                │
│  - altText: "Description image"              │
├──────────────────────────────────────────────┤
│ Process:                                     │
│  1. Convertir buffer en base64               │
│  2. Uploader vers Cloudinary API             │
│  3. Organiser dans dossiers                  │
│     /blog-articles/mon-article/              │
│  4. Ajouter métadonnées et tags              │
├──────────────────────────────────────────────┤
│ Output:                                      │
│  - url: "https://res.cloudinary.com/..."     │
│  - secureUrl: "https://... (HTTPS)"          │
│  - publicId: "blog-articles/..."             │
└──────────────────────────────────────────────┘
```

### 6. Publication WordPress

```
┌──────────────────────────────────────────────┐
│     Service WordPress (wordpress.js)          │
├──────────────────────────────────────────────┤
│ Input:                                       │
│  - title: "Titre article"                    │
│  - content: "Contenu HTML"                   │
│  - metaDescription: "Meta desc"              │
│  - keywords: ["mot1", "mot2"]                │
│  - featuredImageUrl: "https://..."           │
│  - category: "Blog"                          │
│  - status: "publish" | "draft"               │
├──────────────────────────────────────────────┤
│ Process:                                     │
│  1. Créer/récupérer catégorie                │
│  2. Créer/récupérer tags depuis keywords     │
│  3. Upload image featured sur WP             │
│  4. Créer post via WP REST API               │
│  5. Associer métadonnées SEO                 │
├──────────────────────────────────────────────┤
│ Output:                                      │
│  - id: Post ID WordPress                     │
│  - url: "https://votresite.com/article"      │
│  - status: "publish" | "draft"               │
│  - date: "2024-01-10T12:00:00"               │
└──────────────────────────────────────────────┘
```

### 7. Nettoyage

```
Worker → GitHub API → UPDATE topics.json
                         ↓
                   Remove processed topic
                         ↓
                   Commit changes
                         ↓
                   Push to GitHub
```

## Services et Responsabilités

### 1. `src/index.js` - Orchestrateur Principal

**Rôle**: Coordonner tous les services

**Responsabilités**:
- Gérer les triggers (Cron, HTTP, GitHub Actions)
- Récupérer les sujets depuis GitHub
- Appeler les services dans le bon ordre
- Gérer les erreurs et retry logic
- Mettre à jour topics.json après traitement

**Endpoints HTTP**:
```
GET  /test              → Test de santé du worker
POST /generate-article  → Génération manuelle d'article
GET  /articles          → Liste des articles WordPress
```

**Cron Trigger**:
```javascript
scheduled(event, env, ctx) {
  // Exécuté selon le planning (wrangler.toml)
}
```

### 2. `src/services/gemini.js` - Génération de Contenu

**Rôle**: Créer des articles SEO avec Gemini AI

**Méthodes principales**:
- `generateArticle(topic, keywords)` → Génère un article complet
- `generateTitle(topic, keywords)` → Génère un titre SEO
- `parseArticle(text)` → Parse la réponse de Gemini

**Configuration**:
- Modèle: `gemini-2.0-flash-exp`
- Temperature: 0.9 (créativité élevée)
- Max tokens: 8192 (articles longs)

### 3. `src/services/imageGenerator.js` - Génération d'Images

**Rôle**: Créer des images avec Cloudflare AI

**Méthodes principales**:
- `generateImage(prompt, options)` → Génère une image
- `generateArticleImages()` → Génère plusieurs images
- `createImagePrompts()` → Crée des prompts optimisés

**Modèle**:
- `@cf/stabilityai/stable-diffusion-xl-base-1.0`
- Résolution: 1200x630px (format WordPress optimal)
- Format: PNG haute qualité

### 4. `src/services/cloudinary.js` - Gestion d'Images

**Rôle**: Upload et optimisation d'images

**Méthodes principales**:
- `uploadImage(imageData, options)` → Upload une image
- `uploadArticleImages()` → Upload plusieurs images
- `getOptimizedUrl()` → Génère URLs optimisées
- `deleteImage()` → Supprime une image

**Organisation**:
```
cloudinary/
└── blog-articles/
    └── mon-article/
        ├── mon-article-featured.png
        ├── mon-article-1.png
        └── mon-article-2.png
```

### 5. `src/services/wordpress.js` - Publication WordPress

**Rôle**: Publier sur WordPress via REST API

**Méthodes principales**:
- `publishPost(article)` → Publie un article
- `uploadMedia()` → Upload une image
- `getOrCreateCategory()` → Gère les catégories
- `getOrCreateTag()` → Gère les tags
- `publishCompleteArticle()` → Publication complète

**Authentification**:
- Basic Auth avec Application Password
- Pas besoin de plugin JWT

## Technologies Utilisées

### Backend
- **Cloudflare Workers** - Runtime serverless
- **Cloudflare AI** - Génération d'images (Stable Diffusion XL)
- **Gemini API** - Génération de texte
- **Cloudinary** - CDN et stockage d'images

### APIs
- **GitHub API** - Gestion de topics.json
- **WordPress REST API** - Publication d'articles
- **Cloudflare Workers API** - Déploiement

### CI/CD
- **GitHub Actions** - Workflows automatiques
- **Wrangler CLI** - Déploiement Cloudflare

## Sécurité

### Secrets Management
```
Cloudflare Workers Secrets:
- GEMINI_API_KEY          → Chiffré, non accessible
- GITHUB_TOKEN            → Chiffré, non accessible
- CLOUDINARY_API_SECRET   → Chiffré, non accessible
- WORDPRESS_APP_PASSWORD  → Chiffré, non accessible
```

### Variables Publiques (non sensibles)
```
wrangler.toml [vars]:
- GITHUB_REPO
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY (clé publique)
- CLOUDINARY_UPLOAD_PRESET
- WORDPRESS_URL
- WORDPRESS_USERNAME
```

### Bonnes Pratiques
- ✅ Tous les secrets dans Workers Secrets
- ✅ Pas de secrets dans le code source
- ✅ `.env` dans `.gitignore`
- ✅ HTTPS uniquement pour toutes les API
- ✅ Application Passwords pour WordPress (pas de mot de passe principal)

## Performance

### Temps d'Exécution Typique
```
Récupération sujet:      ~500ms
Génération article:      ~30-45s
Génération image:        ~10-20s
Upload Cloudinary:       ~2-5s
Publication WordPress:   ~3-5s
─────────────────────────────────
TOTAL:                   ~50-75s
```

### Optimisations
- Images en parallèle si plusieurs
- Retry logic pour les API instables
- Cache Cloudinary pour les images
- CDN global Cloudflare

## Limites et Quotas

### Gratuit
- **Cloudflare Workers**: 100,000 requêtes/jour
- **Cloudflare AI**: Illimité (actuellement gratuit)
- **Cloudinary**: 25 GB stockage, 25 GB bande passante/mois
- **GitHub API**: 5,000 requêtes/heure (authentifié)

### Gemini API
- Quota gratuit mensuel
- Puis tarification au token
- ~0.0001$ par 1000 tokens

## Scalabilité

Le système peut facilement gérer:
- ✅ 100+ articles/mois
- ✅ Plusieurs sites WordPress
- ✅ Génération en masse via API
- ✅ Multi-langues (modifier le prompt)

## Monitoring et Logs

### Cloudflare Dashboard
- Métriques d'exécution
- Taux de succès/erreur
- Durée d'exécution
- Logs en temps réel

### GitHub Actions
- Historique des workflows
- Logs détaillés
- Notifications d'erreur
- Résumés d'exécution

---

Pour plus de détails sur l'implémentation, consultez le code source dans `src/`.

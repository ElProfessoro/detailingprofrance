# 🚀 Système d'Automatisation de Blog WordPress

Génération automatique d'articles de blog SEO-optimisés avec Gemini AI, images générées par Cloudflare AI Workers, hébergement sur Cloudinary et publication sur WordPress.

## ✨ Fonctionnalités

- 📝 **Génération d'articles SEO** avec Gemini AI (3500-4500 mots)
- 🖼️ **Génération d'images** avec Cloudflare AI Workers (gratuit)
- ☁️ **Hébergement d'images** sur Cloudinary
- 📰 **Publication automatique** sur WordPress
- ⏰ **Planification automatique** via Cron Triggers
- 🔄 **Gestion des sujets** via GitHub

## 🛠️ Architecture

```
┌─────────────┐
│   GitHub    │ ← Liste des sujets (topics.json)
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Cloudflare      │
│ Worker          │
│ (Cron Trigger)  │
└────────┬────────┘
         │
         ├─→ Gemini API (génération article)
         │
         ├─→ Cloudflare AI (génération image)
         │
         ├─→ Cloudinary (upload image)
         │
         └─→ WordPress API (publication)
```

## 📋 Prérequis

- Compte Cloudflare (gratuit)
- Compte Google Cloud (pour Gemini API)
- Compte Cloudinary (gratuit)
- Site WordPress avec API REST activée
- Compte GitHub (gratuit)

## 🚀 Installation

### 1. Cloner le projet

```bash
cd detailingprofrance
git init
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `wrangler.toml` à partir de `wrangler.toml.example`:

```bash
cp wrangler.toml.example wrangler.toml
```

Configurer les secrets Cloudflare Workers:

```bash
wrangler secret put GEMINI_API_KEY
# Entrer votre clé API Gemini

wrangler secret put GITHUB_TOKEN
# Entrer votre token GitHub

wrangler secret put CLOUDINARY_API_SECRET
# Entrer votre secret Cloudinary

wrangler secret put WORDPRESS_APP_PASSWORD
# Entrer votre mot de passe d'application WordPress
```

Éditer `wrangler.toml` et mettre à jour les variables publiques:

```toml
[vars]
GITHUB_REPO = "ElProfessoro/detailingprofrance"
CLOUDINARY_CLOUD_NAME = "ds9nq6m4r"
CLOUDINARY_API_KEY = "382534719394644"
CLOUDINARY_UPLOAD_PRESET = "nexus_articles"
WORDPRESS_URL = "https://votresite.com"
WORDPRESS_USERNAME = "votre_username"
```

### 4. Créer le dépôt GitHub

```bash
# Créer le dépôt sur GitHub.com: ElProfessoro/detailingprofrance

git remote add origin https://github.com/ElProfessoro/detailingprofrance.git
```

### 5. Créer le fichier topics.json sur GitHub

Créer un fichier `topics.json` à la racine du repo avec vos sujets d'articles:

```json
[
  {
    "topic": "Votre sujet d'article",
    "keywords": ["mot-clé 1", "mot-clé 2"],
    "category": "Blog",
    "status": "publish"
  }
]
```

## 🎯 Utilisation

### Déploiement

```bash
# Déployer sur Cloudflare Workers
wrangler deploy
```

### ⚠️ Important: Ne pas tester en local

Ce système est conçu pour fonctionner **uniquement sur Cloudflare Workers** (en production).

**Ne lancez PAS `wrangler dev`** car:
- Les Cron Triggers ne fonctionnent qu'en production
- L'API Cloudflare AI n'est disponible qu'en production
- Les secrets ne sont accessibles qu'en production

Pour tester, déployez directement sur Cloudflare:
```bash
wrangler deploy
```

Puis utilisez GitHub Actions pour automatiser les déploiements (voir section CI/CD ci-dessous)

### Générer un article manuellement

```bash
# Via API
curl -X POST https://votre-worker.workers.dev/generate-article \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Les meilleures techniques de detailing automobile",
    "keywords": ["detailing", "automobile", "protection peinture"],
    "category": "Tutoriels",
    "status": "draft"
  }'
```

### Lister les articles WordPress

```bash
curl https://votre-worker.workers.dev/articles
```

### Planification automatique

Le worker est configuré pour s'exécuter automatiquement selon le planning défini dans `wrangler.toml`:

```toml
[triggers]
crons = ["0 9 * * 1"]  # Tous les lundis à 9h
```

Exemples de planifications:
- `"0 9 * * 1"` - Tous les lundis à 9h
- `"0 10 * * *"` - Tous les jours à 10h
- `"0 9 * * 1,3,5"` - Lundi, Mercredi, Vendredi à 9h
- `"0 */6 * * *"` - Toutes les 6 heures

## 📁 Structure du projet

```
detailingprofrance/
├── src/
│   ├── index.js                 # Worker principal
│   └── services/
│       ├── gemini.js           # Service Gemini API
│       ├── imageGenerator.js   # Service Cloudflare AI
│       ├── cloudinary.js       # Service Cloudinary
│       └── wordpress.js        # Service WordPress API
├── topics.json.example         # Exemple de sujets
├── wrangler.toml.example       # Configuration Cloudflare
├── package.json
├── .env.example
└── README.md
```

## 🔧 Configuration WordPress

### 1. Activer l'API REST

L'API REST WordPress est activée par défaut. Vérifier sur:
```
https://votresite.com/wp-json/wp/v2/
```

### 2. Créer un mot de passe d'application

1. Aller dans **Utilisateurs** > **Profil**
2. Défiler jusqu'à **Mots de passe d'application**
3. Créer un nouveau mot de passe d'application
4. Copier le mot de passe généré

### 3. Installer Yoast SEO (optionnel)

Pour une meilleure optimisation SEO:
```bash
# Via WordPress Admin
Extensions > Ajouter > Rechercher "Yoast SEO" > Installer
```

## 🎨 Gestion des images

### Cloudflare AI Workers

Les images sont générées gratuitement avec le modèle Stable Diffusion XL:
- Résolution: 1200x630px (optimale pour WordPress)
- Format: PNG
- Qualité: Haute définition

### Cloudinary

Images hébergées et optimisées automatiquement:
- Compression automatique
- Format WebP pour navigateurs compatibles
- CDN mondial pour chargement rapide
- Transformations à la volée

## 📊 Monitoring

### Logs Cloudflare

```bash
# Voir les logs en temps réel
wrangler tail
```

### Dashboard Cloudflare

Accéder au dashboard: https://dash.cloudflare.com/
- Statistiques d'exécution
- Erreurs
- Utilisation de l'API

## 🐛 Dépannage

### Erreur "GEMINI_API_KEY not found"

```bash
wrangler secret put GEMINI_API_KEY
```

### Erreur "GitHub API rate limit"

Vérifier que votre token GitHub a les permissions nécessaires:
- `repo` (accès complet aux dépôts)

### Erreur "WordPress authentication failed"

Vérifier:
1. L'URL WordPress est correcte
2. Le nom d'utilisateur est correct
3. Le mot de passe d'application est valide

### Images non générées

Vérifier que le binding AI est configuré dans `wrangler.toml`:
```toml
[ai]
binding = "AI"
```

## 🔒 Sécurité

- ✅ Tous les secrets sont stockés dans Cloudflare Workers Secrets
- ✅ Pas de secrets dans le code source
- ✅ Authentification WordPress via Application Password
- ✅ Communication HTTPS uniquement

## 💰 Coûts

### Gratuit
- Cloudflare Workers (100 000 requêtes/jour)
- Cloudflare AI Workers
- GitHub (repos publics)
- Cloudinary (plan gratuit: 25 GB stockage, 25 GB bande passante/mois)

### Payant
- Gemini API (gratuit jusqu'à un certain quota, puis payant)
- WordPress (hébergement selon votre fournisseur)

## 📈 Optimisation SEO

Le système intègre automatiquement:

✅ Titres H2/H3 optimisés avec mots-clés
✅ Méta descriptions personnalisées
✅ Contenu long-forme (3500-4500 mots)
✅ Structure FAQ pour les featured snippets
✅ Images optimisées avec alt text
✅ Liens internes et externes
✅ Ton conversationnel et engageant

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à:
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

## 🆘 Support

Pour toute question ou problème:
1. Vérifier la section Dépannage
2. Consulter les logs: `wrangler tail`
3. Ouvrir une issue sur GitHub

---

Développé avec ❤️ pour automatiser la création de contenu SEO de qualité

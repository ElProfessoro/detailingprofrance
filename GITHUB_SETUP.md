# 🔧 Configuration GitHub Actions

Ce guide explique comment configurer GitHub Actions pour automatiser la génération d'articles de blog.

## 📋 Vue d'ensemble

Le système peut fonctionner de deux façons:

### Option 1: Cloudflare Cron Triggers (Recommandé)
✅ Exécution directement sur Cloudflare Workers
✅ Pas de dépendance à GitHub Actions
✅ Configuration dans `wrangler.toml`

### Option 2: GitHub Actions Scheduled Workflows
✅ Plus de flexibilité dans les horaires
✅ Gestion des sujets via `topics.json`
✅ Logs et historique dans GitHub

## 🚀 Configuration pour Option 1 (Cloudflare Cron)

### 1. Configurer wrangler.toml

```toml
[triggers]
crons = ["0 9 * * 1"]  # Tous les lundis à 9h UTC
```

### 2. Créer topics.json sur GitHub

Créer le fichier `topics.json` à la racine du repo:

```json
[
  {
    "topic": "Les meilleures techniques de detailing automobile",
    "keywords": ["detailing", "automobile", "protection peinture"],
    "category": "Tutoriels",
    "status": "publish"
  }
]
```

### 3. Déployer

```bash
wrangler deploy
```

C'est tout! Le worker s'exécutera automatiquement selon le planning.

## 🔧 Configuration pour Option 2 (GitHub Actions)

### 1. Créer les secrets GitHub

Dans votre repo GitHub, allez dans **Settings** > **Secrets and variables** > **Actions**

Créer les secrets suivants:

| Secret | Valeur |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Votre token Cloudflare API |
| `GEMINI_API_KEY` | VOTRE_GEMINI_API_KEY |
| `GH_TOKEN` | VOTRE_GITHUB_TOKEN |
| `CLOUDINARY_API_SECRET` | VOTRE_CLOUDINARY_SECRET |
| `WORDPRESS_APP_PASSWORD` | VOTRE_WORDPRESS_PASSWORD |
| `WORKER_URL` | https://votre-worker.workers.dev |

### 2. Activer GitHub Actions

Les workflows sont déjà configurés dans `.github/workflows/`:

- **deploy.yml** - Déploie sur Cloudflare à chaque push
- **generate-article.yml** - Génère un article selon un planning
- **manual-trigger.yml** - Permet de générer un article manuellement

### 3. Modifier le planning

Éditer `.github/workflows/generate-article.yml`:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Tous les lundis à 9h UTC
```

**Exemples de plannings:**

```yaml
# Tous les jours à 10h UTC
- cron: '0 10 * * *'

# Lundi, Mercredi, Vendredi à 9h UTC
- cron: '0 9 * * 1,3,5'

# Toutes les 6 heures
- cron: '0 */6 * * *'

# Deux fois par semaine (Mardi et Vendredi à 14h UTC)
- cron: '0 14 * * 2,5'
```

### 4. Créer topics.json

Créer `topics.json` à la racine avec vos sujets:

```json
[
  {
    "topic": "Sujet 1",
    "keywords": ["mot-clé1", "mot-clé2"],
    "category": "Blog",
    "status": "publish"
  },
  {
    "topic": "Sujet 2",
    "keywords": ["mot-clé3", "mot-clé4"],
    "category": "Tutoriels",
    "status": "publish"
  }
]
```

### 5. Push vers GitHub

```bash
git add .
git commit -m "Configure GitHub Actions"
git push
```

## 🎯 Utilisation

### Génération automatique

Les articles seront générés automatiquement selon le planning configuré.

Le workflow:
1. Lit le premier sujet de `topics.json`
2. Génère l'article via le worker Cloudflare
3. Retire le sujet traité de `topics.json`
4. Commit les changements

### Génération manuelle

#### Via GitHub UI

1. Allez dans **Actions**
2. Sélectionnez **Manual Article Generation**
3. Cliquez sur **Run workflow**
4. Remplissez les champs:
   - **Topic**: Sujet de l'article
   - **Keywords**: mots-clés séparés par des virgules
   - **Category**: Catégorie WordPress
   - **Status**: draft ou publish
5. Cliquez sur **Run workflow**

#### Via GitHub CLI

```bash
gh workflow run manual-trigger.yml \
  -f topic="Les secrets du polissage automobile" \
  -f keywords="polissage,detailing,voiture" \
  -f category="Tutoriels" \
  -f status="draft"
```

### Vérifier les logs

1. Allez dans **Actions**
2. Cliquez sur le workflow en cours
3. Consultez les logs et le résumé

## 📊 Monitoring

### Dashboard GitHub Actions

**Actions** > **Workflows** pour voir:
- Historique des exécutions
- Taux de succès
- Durée d'exécution
- Logs détaillés

### Notifications

Configurer les notifications dans **Settings** > **Notifications** pour être alerté:
- ✅ Succès d'exécution
- ❌ Échecs
- 📧 Par email ou sur l'app GitHub

## 🔄 Workflow des sujets

### Flux automatique avec topics.json

```
topics.json
    │
    ├─→ [Workflow s'exécute]
    │
    ├─→ Lit premier sujet
    │
    ├─→ Génère article
    │
    ├─→ Publie sur WordPress
    │
    └─→ Retire sujet de topics.json
```

### Ajouter des sujets

Simplement push de nouveaux sujets:

```bash
# Éditer topics.json et ajouter des sujets
git add topics.json
git commit -m "Add new blog topics"
git push
```

## 🐛 Dépannage

### Workflow ne s'exécute pas

Vérifiez:
1. Les secrets GitHub sont correctement configurés
2. Le workflow est activé dans **Actions**
3. Le repo n'est pas archivé
4. Vous avez les permissions nécessaires

### Erreur "Worker URL not found"

Configurez le secret `WORKER_URL`:
```
https://votre-worker.workers.dev
```

### Erreur d'authentification

Vérifiez tous les secrets:
```bash
gh secret list
```

Recréez les secrets si nécessaire.

### Topics.json non mis à jour

Vérifiez que le `GH_TOKEN` a les permissions:
- ✅ `repo` - Full control of private repositories
- ✅ `workflow` - Update GitHub Action workflows

## 💡 Conseils

### Optimiser les coûts

GitHub Actions est gratuit pour les repos publics avec 2000 minutes/mois.

Pour économiser:
- Utilisez Cloudflare Cron Triggers (Option 1)
- Limitez la fréquence de génération
- Générez en draft pour révision avant publication

### Tester avant production

1. Configurez `status: "draft"` dans topics.json
2. Testez avec le workflow manuel
3. Vérifiez l'article sur WordPress
4. Passez en `status: "publish"` une fois validé

### Backup de topics.json

Gardez une copie de vos sujets:

```bash
cp topics.json topics.backup.json
git add topics.backup.json
git commit -m "Backup topics"
git push
```

## 🔗 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cron Expression Generator](https://crontab.guru/)

---

Pour toute question, consultez les logs GitHub Actions ou ouvrez une issue.

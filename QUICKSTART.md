# 🚀 Guide de Démarrage Rapide

## Déploiement en 5 minutes

### 1. Créer le dépôt GitHub (1 min)

```bash
# Sur GitHub.com, créer un nouveau repo: ElProfessoro/detailingprofrance

# Localement
cd detailingprofrance
git add .
git commit -m "Initial commit: Blog automation system"
git branch -M main
git remote add origin https://github.com/ElProfessoro/detailingprofrance.git
git push -u origin main
```

### 2. Créer le fichier topics.json sur GitHub (1 min)

Sur GitHub, créer un nouveau fichier `topics.json` avec:

```json
[
  {
    "topic": "Les secrets du detailing professionnel pour une voiture impeccable",
    "keywords": ["detailing automobile", "nettoyage voiture", "polish auto", "protection peinture"],
    "category": "Tutoriels",
    "status": "publish"
  }
]
```

### 3. Installer Wrangler CLI (30 sec)

```bash
npm install
```

### 4. Configurer les secrets (2 min)

```bash
# Se connecter à Cloudflare
wrangler login

# Configurer les secrets
wrangler secret put GEMINI_API_KEY
# Coller: VOTRE_GEMINI_API_KEY

wrangler secret put GITHUB_TOKEN
# Coller: VOTRE_GITHUB_TOKEN

wrangler secret put CLOUDINARY_API_SECRET
# Coller: VOTRE_CLOUDINARY_SECRET

wrangler secret put WORDPRESS_APP_PASSWORD
# Coller: VOTRE_WORDPRESS_PASSWORD
```

### 5. Configurer wrangler.toml (1 min)

```bash
# Copier le fichier exemple
cp wrangler.toml.example wrangler.toml

# Éditer wrangler.toml et remplacer:
# - WORDPRESS_URL par votre URL WordPress
# - WORDPRESS_USERNAME par votre nom d'utilisateur WordPress
```

### 6. Déployer (30 sec)

```bash
wrangler deploy
```

C'est tout! 🎉

## Test du système

### Tester la configuration

```bash
curl https://votre-worker.workers.dev/test
```

Réponse attendue:
```json
{
  "status": "ok",
  "message": "Blog automation worker is running",
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

### Générer votre premier article

```bash
curl -X POST https://votre-worker.workers.dev/generate-article \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Comment protéger efficacement la peinture de votre voiture",
    "keywords": ["protection peinture", "detailing auto", "cire voiture"],
    "category": "Conseils",
    "status": "draft"
  }'
```

L'article sera généré et publié en brouillon sur votre WordPress!

## Configuration WordPress

### Créer un mot de passe d'application

1. Connectez-vous à votre WordPress
2. Allez dans **Utilisateurs** > **Profil**
3. Descendez jusqu'à **Mots de passe d'application**
4. Nom: "Blog Automation"
5. Cliquez sur **Ajouter un nouveau mot de passe d'application**
6. Copiez le mot de passe généré (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)
7. Utilisez-le pour la commande `wrangler secret put WORDPRESS_APP_PASSWORD`

### Vérifier que l'API REST est accessible

```bash
curl https://votresite.com/wp-json/wp/v2/posts
```

Si vous voyez une liste de posts (ou un tableau vide), c'est bon!

## Planification automatique

Éditer `wrangler.toml` pour modifier la fréquence:

```toml
[triggers]
crons = ["0 9 * * 1"]  # Tous les lundis à 9h
```

**Exemples de planifications:**

- Tous les jours à 10h: `"0 10 * * *"`
- Lundi, Mercredi, Vendredi à 9h: `"0 9 * * 1,3,5"`
- Toutes les 6 heures: `"0 */6 * * *"`
- Deux fois par semaine (Mar, Ven à 14h): `"0 14 * * 2,5"`

Après modification, redéployer:
```bash
wrangler deploy
```

## Ajouter des sujets

Éditer `topics.json` sur GitHub et ajouter des sujets:

```json
[
  {
    "topic": "Nouveau sujet d'article",
    "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"],
    "category": "Catégorie WordPress",
    "status": "publish"
  }
]
```

Le système traitera automatiquement un sujet par exécution du cron.

## Monitoring

### Voir les logs en temps réel

```bash
wrangler tail
```

### Dashboard Cloudflare

https://dash.cloudflare.com/ > Workers & Pages > votre worker

Vous y trouverez:
- Nombre d'exécutions
- Taux de succès/erreur
- Temps d'exécution
- Logs détaillés

## Problèmes courants

### "Error: No such object: worker_name"

→ Vous n'êtes pas connecté à Cloudflare
```bash
wrangler login
```

### "GitHub API error: 404"

→ Le fichier `topics.json` n'existe pas sur GitHub
→ Créez-le manuellement sur github.com

### "WordPress authentication failed"

→ Vérifiez votre mot de passe d'application
→ Recréez-en un nouveau si nécessaire

### Images non générées

→ Vérifiez que `[ai]` est dans `wrangler.toml`:
```toml
[ai]
binding = "AI"
```

## Prochaines étapes

1. ✅ Système déployé et fonctionnel
2. 📝 Ajouter plus de sujets dans `topics.json`
3. 🎨 Personnaliser le prompt Gemini dans `src/services/gemini.js`
4. ⏰ Ajuster la fréquence de publication
5. 📊 Monitorer les performances dans Cloudflare Dashboard

## Support

Des questions? Consultez le [README.md](README.md) complet ou ouvrez une issue sur GitHub.

---

**Bon blogging automatisé! 🚀**

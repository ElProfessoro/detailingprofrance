# Plugin WordPress: Blog Automation API

Ce plugin crée un endpoint REST API personnalisé pour publier des articles en **1 seule requête HTTP**, contournant ainsi les limitations de TigerProtect d'O2Switch.

## 🎯 Avantages

- ✅ **1 seule requête HTTP** au lieu de 10+ → TigerProtect ne se déclenche pas
- ✅ Fonctionne avec ton **Application Password actuel**
- ✅ Aucune configuration serveur nécessaire (pas besoin de cPanel)
- ✅ Gestion complète: titre, contenu, catégorie, tags, image à la une
- ✅ Interface d'administration pour gérer le token

## 📦 Installation

### Option 1: Via l'admin WordPress (RECOMMANDÉ)

1. **Connecte-toi à WordPress**: `https://www.detailingprofrance.fr/wp-admin`

2. **Créer le fichier ZIP**:
   ```bash
   cd wordpress-plugin
   zip blog-automation-api.zip blog-automation-api.php
   ```

3. **Installer le plugin**:
   - Va dans **Extensions** → **Ajouter**
   - Clique sur **Téléverser une extension**
   - Choisis `blog-automation-api.zip`
   - Clique sur **Installer maintenant**
   - **Active** le plugin

4. **Configurer le token**:
   - Va dans **Réglages** → **Blog Automation**
   - Vérifie que le token correspond à ton Application Password
   - Sauvegarde

### Option 2: Via FTP/SFTP

1. Upload le fichier `blog-automation-api.php` dans `/wp-content/plugins/blog-automation-api/`
2. Va dans **Extensions** et active **Blog Automation API**

## 🧪 Test de l'endpoint

### Test simple (connexion)
```bash
curl https://www.detailingprofrance.fr/wp-json/blog-automation/v1/test
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "message": "Blog Automation API is working!",
  "version": "1.0.0"
}
```

### Test de publication
```bash
curl -X POST https://www.detailingprofrance.fr/wp-json/blog-automation/v1/publish \
  -H "Content-Type: application/json" \
  -H "X-API-Token: ckSl eiQo zqBs QMKE Hc9P kkZx" \
  -d '{
    "title": "Article de test",
    "content": "<p>Ceci est un article de test.</p>",
    "metaDescription": "Description SEO",
    "categoryName": "Blog",
    "keywords": ["test", "automation"],
    "status": "draft"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "id": 1234,
  "url": "https://www.detailingprofrance.fr/?p=1234",
  "date": "2026-01-11T08:00:00+00:00"
}
```

## 🔧 Modification du Worker

Une fois le plugin installé, il faut adapter le Worker pour utiliser ce nouvel endpoint.

Je vais créer un nouveau service WordPress qui utilise ce plugin:

### Service: `wordpress-plugin.js`

Le Worker enverra **1 seule requête** avec toutes les données:
- Titre
- Contenu
- Meta description
- Catégorie
- Tags (keywords)
- Image à la une (URL Cloudinary)
- Status (publish/draft)

## 📊 Comparaison

| Méthode | Requêtes HTTP | Bloqué par TigerProtect? | Fonctionne? |
|---------|---------------|--------------------------|-------------|
| REST API standard | 10+ requêtes | ✅ OUI (429) | ❌ |
| XML-RPC | 1-2 requêtes | ❌ Désactivé par O2Switch | ❌ |
| **Plugin personnalisé** | **1 requête** | **❌ NON** | **✅ OUI** |

## 🔒 Sécurité

- Authentification par token (X-API-Token header)
- Token stocké en base de données WordPress
- Peut être changé à tout moment depuis l'admin
- Compatible avec Application Passwords

## 📝 Format de la requête

```javascript
POST https://www.detailingprofrance.fr/wp-json/blog-automation/v1/publish
Headers:
  Content-Type: application/json
  X-API-Token: ckSl eiQo zqBs QMKE Hc9P kkZx

Body:
{
  "title": "Titre de l'article",
  "content": "<p>Contenu HTML de l'article...</p>",
  "metaDescription": "Description SEO",
  "categoryName": "Nom de la catégorie",
  "keywords": ["mot-clé1", "mot-clé2"],
  "featuredImageUrl": "https://cloudinary.com/image.jpg",
  "featuredImageAlt": "Texte alternatif",
  "status": "publish" // ou "draft"
}
```

## 🚀 Prochaines étapes

1. ✅ Installer le plugin WordPress
2. ✅ Tester l'endpoint
3. ⏳ Adapter le Worker pour utiliser ce plugin
4. ⏳ Déployer et tester la publication complète

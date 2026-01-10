# 🔐 Guide de Configuration WordPress

## ❌ Problème Actuel

Erreur: "Désolé, vous n'avez pas l'autorisation de créer des contenus sous cet identifiant."

**Cause**: Le mot de passe d'application WordPress n'a pas les permissions nécessaires pour créer des articles.

## ✅ Solution: Créer un Nouveau Mot de Passe d'Application

### Étape 1: Connexion WordPress

1. Allez sur: https://www.detailingprofrance.fr/wp-admin
2. Connectez-vous avec votre compte administrateur

### Étape 2: Créer le Mot de Passe

1. Cliquez sur **Utilisateurs** (menu gauche)
2. Cliquez sur votre profil utilisateur
3. Descendez jusqu'à la section **"Mots de passe d'application"**
4. Dans le champ "Nouveau nom de mot de passe d'application", entrez: **Blog Automation**
5. Cliquez sur **"Ajouter un nouveau mot de passe d'application"**
6. **IMPORTANT**: Copiez le mot de passe généré (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)
7. **Retirez TOUS les espaces** du mot de passe

### Étape 3: Mettre à Jour le Secret

Dans votre terminal (dans le dossier du projet):

```bash
# Remplacez VOTRE_MOT_DE_PASSE par le mot de passe SANS espaces
echo "VOTRE_MOT_DE_PASSE" | npx wrangler secret put WORDPRESS_APP_PASSWORD
```

Exemple:
```bash
# Si le mot de passe est: aBcD eFgH iJkL mNoP qRsT uVwX
# Tapez: aBcDeFgHiJkLmNoPqRsTuVwX (sans espaces)
echo "aBcDeFgHiJkLmNoPqRsTuVwX" | npx wrangler secret put WORDPRESS_APP_PASSWORD
```

### Étape 4: Tester

```bash
./generate-first-article.sh
```

## 🔍 Vérifications

### Vérifier que l'utilisateur a les bonnes permissions

L'utilisateur doit être **Administrateur** ou **Éditeur** pour créer des articles.

### Vérifier le nom d'utilisateur

Si vous n'utilisez pas "admin", mettez à jour `wrangler.toml`:

```toml
WORDPRESS_USERNAME = "votre_vrai_username"
```

Puis redéployer:
```bash
npx wrangler deploy
```

## ⚠️ Important

- Le mot de passe d'application est **différent** de votre mot de passe WordPress normal
- Il doit être créé depuis votre profil WordPress  
- Il est affiché **une seule fois** lors de la création
- Retirez **TOUS les espaces** avant de l'utiliser

## 📞 Si Ça Ne Fonctionne Toujours Pas

1. Vérifiez que les mots de passe d'application sont activés sur votre site
2. Si vous ne voyez pas la section "Mots de passe d'application":
   - Installez le plugin "Application Passwords"  
   - OU utilisez un plugin REST API auth différent

---

**Une fois configuré, le système générera automatiquement vos articles!** 🚀

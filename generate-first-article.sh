#!/bin/bash

echo "🚀 Génération de votre premier article de test"
echo "=============================================="
echo ""

WORKER_URL="https://detailingprofrance-blog-automation.msalla-youssef.workers.dev"

echo "📝 Article: Les secrets du detailing professionnel"
echo "📁 Catégorie: Tutoriels"
echo "📊 Statut: draft (brouillon pour révision)"
echo ""
echo "⏳ Génération en cours... (cela peut prendre 60-90 secondes)"
echo ""

curl -X POST "$WORKER_URL/generate-article" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Les secrets du detailing professionnel pour une voiture impeccable",
    "keywords": ["detailing automobile", "nettoyage voiture professionnel", "polish auto", "protection peinture"],
    "category": "Tutoriels",
    "status": "draft"
  }' | json_pp 2>/dev/null || echo "Erreur lors de la génération"

echo ""
echo ""
echo "✅ Terminé!"
echo ""
echo "📋 Vérifiez vos brouillons WordPress sur:"
echo "   https://detailingprofrance.fr/wp-admin/edit.php?post_status=draft&post_type=post"

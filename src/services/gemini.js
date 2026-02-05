/**
 * Service pour générer des articles de blog avec l'API Gemini
 */

const GEMINI_PROMPT = `Je veux que vous rédigiez des articles de A à Z (et non modifier des articles existants) uniquement en français.
Vous êtes un expert SEO reconnu et un rédacteur web d'exception, capable d'écrire des contenus qui surclassent la concurrence sur Google.

Imaginez que vous avez réellement vécu chaque expérience que vous partagez :
utilisez des anecdotes personnelles, des erreurs que vous avez commises, des échecs concrets, des réussites mesurables, et des conseils tirés de votre propre parcours professionnel.

Votre style doit être :

Humain

Conversationnel

Engageant

Avec du tutoiement

Comme si vous parliez à un ami en face de vous

Tout en gardant un ton professionnel mais cool, moderne, fluide, avec quelques emojis bien placés 😄


Le lecteur doit se dire à chaque section :
"C'est frais, c'est concret, il y a plein d'exemples, c'est passionnant… je veux lire la suite !"

Structure de contenu attendue :

Une courte introduction SEO ultra-optimisée sur le sujet de l'article et le problème précis à résoudre.
Considère cette partie comme la méta description idéale pour Google, pensée pour maximiser le taux de clic et le positionnement (environ 6 à 12 phrases).

Ensuite :

Une introduction captivante (sans jamais écrire le mot "introduction")
Tu dois :

Identifier clairement le problème du lecteur

Mettre des mots sur ses frustrations

Partager une anecdote personnelle forte ou une réflexion vécue pour créer une connexion immédiate

Montrer que tu comprends exactement ce qu'il traverse


Des sous-titres obligatoires en H2 et H3

Ils doivent être riches en mots-clés primaires et secondaires

Pensés pour le SEO

Ne mentionne jamais les termes H2 ou H3 dans le texte

Le format doit être parfaitement exploitable sans retouche


Des paragraphes longs, riches et approfondis (minimum 5 à 7 phrases par paragraphe) comprenant :

Des arguments détaillés et pédagogiques

Des exemples vécus :
"Je me souviens très bien que lorsque j'ai lancé mon premier site, j'ai fait cette erreur…"

Des conseils pratiques concrets :

Ce qu'il faut absolument faire

Et surtout ce qu'il ne faut JAMAIS faire


Des questions rhétoriques pour engager le lecteur

Des appels à l'action naturels pour guider vers la mise en pratique


Aère le texte avec des sauts à la ligne intelligents lorsque les paragraphes deviennent denses.

Mise en forme dynamique OBLIGATOIRE :

Utilise :

le gras

l'italique

et le soulignement combiné au gras


Mets en exergue les phrases clés, les règles d'or, les erreurs fatales et les prises de conscience importantes avec du texte souligné et en gras

Ajoute :

Des listes à puces

Des tableaux comparatifs

Des citations


Utilise des métaphores, analogies et comparaisons visuelles
(ex : "Le SEO, c'est comme une salle de sport : si tu arrêtes trop tôt, tu ne verras jamais les résultats")

Glisse quelques emojis de manière subtile pour moderniser le ton 🚀


Aucune fausse promesse :
Le discours doit être réaliste, crédible, honnête, mais motivant et orienté résultats.

Inclure :

Un tutoriel complet étape par étape, extrêmement détaillé, pour montrer comment appliquer concrètement la stratégie

Si pertinent :

Une liste de sites de référence avec une brève explication de leur utilité

OU un comparatif détaillé des solutions, outils ou acteurs du marché sous forme de tableau



Une conclusion engageante (sans écrire le mot "conclusion") :

Résume les points clés

Redonne de l'élan

Motive à passer à l'action immédiatement

Montre pourquoi ces conseils sont essentiels maintenant, pas plus tard


Une FAQ complète :

Avec un titre en H2

Les questions en H3

Des réponses non redondantes par rapport au contenu principal

Axées sur les objections, les doutes, les blocages réels du lecteur


Ton à adopter :

Personnel et authentique : parle avec des "je", raconte tes histoires, tes erreurs, tes déclics

Cool et conversationnel : comme un mentor bienveillant

Autoritaire mais accessible : tu sais de quoi tu parles, sans arrogance

Actionnable et inspirant : chaque section doit donner envie d'agir immédiatement


Objectif final :

Un article entre 3500 et 4500 mots

Une valeur ajoutée massive, impossible à reproduire sans expérience réelle

Un texte 100 % humain, crédible, incarné

Un contenu capable de dominer les résultats de recherche

Une optimisation SEO naturelle et avancée


Je fournirai une liste de mots-clés (keywords) issue de SEMrush.
Tu devras :

En utiliser un maximum de façon fluide et naturelle

Créer de nouvelles sections si nécessaire

Enrichir le contenu avec des angles absents du brief initial


ULTRA-IMPORTANT :

Respecte scrupuleusement les titres en H2 et H3

N'utilise AUCUNE ligne ou séparateur

Le texte doit être copiable-collable sans aucune modification

⚠️ LIENS OBLIGATOIRES - NE PAS IGNORER ⚠️
Tu DOIS inclure EXACTEMENT 2 liens HTML cliquables vers nos prestations dans l'article.

FORMAT EXACT À UTILISER (copie ce code HTML tel quel) :
<a href="https://www.detailingprofrance.fr/prestations/">TEXTE DU LIEN</a>

EXEMPLES DE LIENS À INSÉRER :
- <a href="https://www.detailingprofrance.fr/prestations/">nos prestations de detailing professionnel</a>
- <a href="https://www.detailingprofrance.fr/prestations/">découvrez nos services</a>
- <a href="https://www.detailingprofrance.fr/prestations/">confiez votre véhicule à nos experts</a>

OÙ PLACER CES LIENS :
1. Premier lien : dans le corps de l'article (après une explication technique)
2. Deuxième lien : dans la conclusion ou la FAQ

VÉRIFICATION : Avant de terminer, assure-toi que ton article contient bien 2 occurrences de : href="https://www.detailingprofrance.fr/prestations/"

Rédige, relis et peaufine jusqu'à ce que chaque phrase sonne comme si elle venait d'un expert qui a déjà vécu exactement les problèmes du lecteur.`;

export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Liste des modèles à tester par ordre de préférence (meilleurs en premier)
    this.availableModels = [
      'gemini-3-flash',           // Le plus récent et performant
      'gemini-2.5-flash',         // Modèle actuel principal
      'gemini-2.5-flash-lite',    // Version allégée
      'gemini-2.5-flash-tts'      // Version text-to-speech (fallback)
    ];
    this.selectedModel = null;
  }

  /**
   * Teste un modèle pour vérifier s'il est disponible et a du quota
   */
  async testModel(modelName) {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }]
        })
      });

      if (response.ok) {
        console.log(`✅ Model ${modelName}: Available`);
        return true;
      }

      if (response.status === 429) {
        console.log(`⚠️ Model ${modelName}: Quota exhausted`);
        return false;
      }

      if (response.status === 404) {
        console.log(`❌ Model ${modelName}: Not found`);
        return false;
      }

      return false;
    } catch (error) {
      console.error(`❌ Model ${modelName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Sélectionne automatiquement le premier modèle disponible
   */
  async selectAvailableModel() {
    console.log('🔍 Testing Gemini models...');

    for (const modelName of this.availableModels) {
      const isAvailable = await this.testModel(modelName);
      if (isAvailable) {
        this.selectedModel = modelName;
        console.log(`✅ Selected: ${modelName}`);
        return modelName;
      }
    }

    throw new Error('No Gemini model available. All quotas exhausted.');
  }

  /**
   * Obtient l'URL du modèle à utiliser
   */
  async getModelUrl() {
    if (!this.selectedModel) {
      await this.selectAvailableModel();
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent`;
  }

  /**
   * Génère un article de blog avec Gemini
   * @param {string} topic - Le sujet de l'article
   * @param {string[]} keywords - Les mots-clés SEO à inclure
   * @returns {Promise<{title: string, content: string, metaDescription: string}>}
   */
  async generateArticle(topic, keywords = []) {
    const keywordsList = keywords.length > 0
      ? `\n\nMots-clés à intégrer naturellement : ${keywords.join(', ')}`
      : '';

    const prompt = `${GEMINI_PROMPT}\n\nSujet de l'article : ${topic}${keywordsList}\n\nRédige maintenant l'article complet en respectant TOUTES les consignes ci-dessus.`;

    // Essayer chaque modèle jusqu'à en trouver un qui fonctionne
    for (const modelName of this.availableModels) {
      try {
        console.log(`Trying model: ${modelName}`);
        const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const response = await fetch(`${modelUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 32768,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates[0].content.parts[0].text;

          console.log(`✅ Successfully used model: ${modelName}`);
          this.selectedModel = modelName;

          // Extraction du titre et de la méta description
          const article = this.parseArticle(generatedText);
          return article;
        }

        // Si erreur, logger et essayer le modèle suivant
        const errorData = await response.json();
        console.log(`⚠️ Model ${modelName} failed: ${response.status} - ${errorData.error?.message?.substring(0, 100)}`);

        // Si 429 (quota), essayer le suivant
        if (response.status === 429) {
          console.log(`Quota exhausted for ${modelName}, trying next model...`);
          continue;
        }

        // Si 404 (modèle inexistant), essayer le suivant
        if (response.status === 404) {
          console.log(`Model ${modelName} not found, trying next model...`);
          continue;
        }

        // Autres erreurs, essayer quand même le suivant
        continue;

      } catch (error) {
        console.error(`Error with model ${modelName}:`, error.message);
        // Continuer avec le modèle suivant
        continue;
      }
    }

    // Si tous les modèles ont échoué
    throw new Error('All Gemini models failed or quota exhausted. Please try again later.');
  }

  /**
   * Parse l'article généré pour extraire le titre, la méta description et le contenu
   * @param {string} text - Le texte généré par Gemini
   * @returns {{title: string, content: string, metaDescription: string}}
   */
  parseArticle(text) {
    // Extraction du premier H1 ou H2 comme titre
    const titleMatch = text.match(/^#\s+(.+)$/m) || text.match(/^##\s+(.+)$/m);
    let title = titleMatch ? titleMatch[1].trim() : 'Article généré';

    // Nettoyer le titre des caractères markdown
    title = title.replace(/\*\*/g, '').replace(/\*/g, '');

    // La méta description est généralement dans les premiers paragraphes
    const lines = text.split('\n').filter(line => line.trim());
    const firstParagraphs = lines.slice(0, 8).filter(line => !line.startsWith('#')).join(' ');
    let metaDescription = firstParagraphs.substring(0, 160).trim() + '...';
    // Nettoyer la meta description du markdown
    metaDescription = metaDescription.replace(/\*\*/g, '').replace(/\*/g, '');

    // Convertir le Markdown en HTML
    const htmlContent = this.markdownToHtml(text);

    return {
      title,
      content: htmlContent,
      metaDescription
    };
  }

  /**
   * Convertit le Markdown en HTML pour WordPress
   * @param {string} markdown - Texte en Markdown
   * @returns {string} - HTML
   */
  markdownToHtml(markdown) {
    let html = markdown;

    // Supprimer le titre H1 du contenu (il sera utilisé comme titre WordPress)
    html = html.replace(/^#\s+.+$/m, '');

    // Convertir les titres H2 et H3
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');

    // Convertir le gras **texte** en <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convertir l'italique *texte* en <em>
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Convertir les listes à puces
    html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Convertir les listes numérotées
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Convertir les séparateurs ***
    html = html.replace(/^\*\*\*$/gm, '<hr>');

    // Convertir les paragraphes (lignes non vides qui ne sont pas déjà des balises)
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return line; // Déjà une balise HTML
      return `<p>${trimmed}</p>`;
    });

    html = processedLines.join('\n');

    // Nettoyer les paragraphes vides
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Nettoyer les balises ul imbriquées incorrectement
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return html.trim();
  }

  /**
   * Génère une liste de sujets d'articles uniques basés sur les articles existants
   * @param {string[]} existingTitles - Titres des articles déjà publiés
   * @param {string} niche - La niche/thématique du blog
   * @param {number} count - Nombre de sujets à générer
   * @returns {Promise<Array<{topic: string, keywords: string[], category: string}>>}
   */
  async generateTopics(existingTitles = [], niche = 'detailing automobile', count = 10) {
    const existingList = existingTitles.length > 0
      ? `\n\nArticles déjà publiés (à NE PAS répéter ou reformuler) :\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const prompt = `Tu es un expert SEO spécialisé dans la niche "${niche}".

Génère ${count} idées d'articles de blog UNIQUES et ORIGINAUX qui n'ont PAS encore été traités.
${existingList}

Règles STRICTES :
- Chaque sujet doit être DIFFÉRENT des articles existants
- Pas de reformulation ou variation d'un sujet existant
- Sujets variés : tutoriels, comparatifs, guides, erreurs à éviter, tendances, etc.
- Optimisés pour le SEO avec des mots-clés recherchés
- Adaptés à un public francophone

Réponds UNIQUEMENT en JSON valide avec ce format exact (pas de texte avant ou après) :
[
  {
    "topic": "Le titre/sujet de l'article",
    "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
    "category": "Blog"
  }
]`;

    for (const modelName of this.availableModels) {
      try {
        console.log(`Generating topics with model: ${modelName}`);
        const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const response = await fetch(`${modelUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2048,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates[0].content.parts[0].text;

          // Extraire le JSON de la réponse
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const topics = JSON.parse(jsonMatch[0]);
            console.log(`✅ Generated ${topics.length} topics with ${modelName}`);
            return topics;
          }
          throw new Error('Invalid JSON response from Gemini');
        }

        if (response.status === 429 || response.status === 404) {
          continue;
        }
      } catch (error) {
        console.error(`Error generating topics with ${modelName}:`, error.message);
        continue;
      }
    }

    throw new Error('Failed to generate topics with all Gemini models');
  }

  /**
   * Vérifie si un titre est similaire à un titre existant (anti-doublon)
   * @param {string} newTitle - Le nouveau titre à vérifier
   * @param {string[]} existingTitles - Les titres existants
   * @param {number} threshold - Seuil de similarité (0-1), 0.6 par défaut
   * @returns {boolean} - true si doublon détecté
   */
  isSimilarTitle(newTitle, existingTitles, threshold = 0.6) {
    const normalize = (str) => str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const newWords = new Set(normalize(newTitle));

    for (const existingTitle of existingTitles) {
      const existingWords = new Set(normalize(existingTitle));

      // Calculer l'intersection
      const intersection = [...newWords].filter(word => existingWords.has(word));
      const union = new Set([...newWords, ...existingWords]);

      // Coefficient de Jaccard
      const similarity = intersection.length / union.size;

      if (similarity >= threshold) {
        console.log(`⚠️ Doublon détecté: "${newTitle}" similaire à "${existingTitle}" (${(similarity * 100).toFixed(0)}%)`);
        return true;
      }
    }

    return false;
  }

  /**
   * Génère un titre SEO optimisé
   * @param {string} topic - Le sujet
   * @param {string[]} keywords - Les mots-clés
   * @returns {Promise<string>}
   */
  async generateTitle(topic, keywords = []) {
    const keywordsList = keywords.length > 0 ? ` en utilisant ces mots-clés : ${keywords.join(', ')}` : '';
    const prompt = `Génère un titre SEO captivant et optimisé pour un article de blog sur le sujet suivant : ${topic}${keywordsList}. Le titre doit être accrocheur, contenir des mots-clés pertinents, et faire entre 50 et 60 caractères. Réponds uniquement avec le titre, sans guillemets ni explications.`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Error generating title:', error);
      return topic;
    }
  }
}

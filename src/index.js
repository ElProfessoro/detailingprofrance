/**
 * Cloudflare Worker principal pour l'automatisation de blog WordPress
 * Génère des articles SEO avec Gemini, des images avec Cloudflare AI,
 * les upload sur Cloudinary et publie sur WordPress
 */

import { GeminiService } from './services/gemini.js';
import { ImageGeneratorService } from './services/imageGenerator.js';
import { CloudinaryService } from './services/cloudinary.js';
import { WordPressPluginService } from './services/wordpress-plugin.js';

export default {
  /**
   * Gestion des requêtes HTTP
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route pour générer et publier un article
    if (url.pathname === '/generate-article' && request.method === 'POST') {
      return await this.handleGenerateArticle(request, env);
    }

    // Route pour tester la configuration
    if (url.pathname === '/test' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Blog automation worker is running',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route pour lister les articles générés
    if (url.pathname === '/articles' && request.method === 'GET') {
      return await this.handleListArticles(env);
    }

    // Route pour tester la génération d'image
    if (url.pathname === '/test-image' && request.method === 'GET') {
      return await this.handleTestImage(env);
    }

    // Route pour générer automatiquement des sujets avec Gemini
    if (url.pathname === '/generate-topics' && request.method === 'POST') {
      return await this.handleGenerateTopics(request, env);
    }

    // Route pour renouveler automatiquement les topics quand la liste est vide
    if (url.pathname === '/refill-topics' && request.method === 'POST') {
      return await this.handleRefillTopics(env);
    }

    return new Response('Not found', { status: 404 });
  },

  /**
   * Gestion des Cron Triggers
   * Déclenché automatiquement selon le planning configuré dans wrangler.toml
   */
  async scheduled(event, env, ctx) {
    console.log('Cron trigger activated at:', new Date(event.scheduledTime).toISOString());

    // ctx.waitUntil() empêche Cloudflare de tuer le worker avant la fin de la génération
    ctx.waitUntil((async () => {
      try {
        // Liste de sujets prédéfinis pour la génération automatique
        const topics = await this.getTopicsFromGitHub(env);

        if (topics.length > 0) {
          // Générer un article pour le premier sujet de la liste
          const topic = topics[0];
          const result = await this.generateAndPublishArticle(topic, env);
          console.log('Article generation result:', JSON.stringify(result));

          // Retirer le sujet de la liste seulement si l'article a été publié
          if (result && result.success) {
            await this.removeTopicFromGitHub(env, topic);
            console.log('Topic removed from list after successful publication');
          }
        } else {
          console.log('No topics available for article generation');
        }
      } catch (error) {
        console.error('Scheduled job failed:', error.message, error.stack);
      }
    })());
  },

  /**
   * Génère et publie un article complet
   */
  async generateAndPublishArticle(topicData, env, skipDuplicateCheck = false) {
    try {
      console.log('Starting article generation for:', topicData.topic);

      // Initialisation des services
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const imageGen = new ImageGeneratorService(env.AI);
      const cloudinary = new CloudinaryService(
        env.CLOUDINARY_CLOUD_NAME,
        env.CLOUDINARY_API_KEY,
        env.CLOUDINARY_API_SECRET,
        env.CLOUDINARY_UPLOAD_PRESET
      );
      // Utiliser le plugin personnalisé (1 seule requête) pour contourner TigerProtect
      const wordpress = new WordPressPluginService(
        env.WORDPRESS_URL,
        env.WORDPRESS_APP_PASSWORD
      );

      // 0. Vérification anti-doublon (récupérer les titres existants)
      let existingTitles = [];
      if (!skipDuplicateCheck) {
        try {
          const existingPosts = await wordpress.getPosts(100, 1);
          existingTitles = existingPosts.map(p => p.title.rendered);
          console.log(`Loaded ${existingTitles.length} existing titles for duplicate check`);
        } catch (e) {
          console.warn('Could not fetch existing posts for duplicate check:', e.message);
        }
      }

      // 1. Génération de l'article avec Gemini
      console.log('Generating article with Gemini...');
      const article = await gemini.generateArticle(
        topicData.topic,
        topicData.keywords || []
      );

      // 1.5 Vérification anti-doublon sur le titre généré
      if (!skipDuplicateCheck && existingTitles.length > 0) {
        if (gemini.isSimilarTitle(article.title, existingTitles)) {
          console.warn('⚠️ Duplicate article detected, skipping publication');
          return {
            success: false,
            skipped: true,
            reason: 'duplicate',
            article: { title: article.title }
          };
        }
      }

      // 2. Génération de l'image à la une avec Cloudflare AI (optionnel)
      let cloudinaryResult = null;
      const articleSlug = wordpress.slugify(article.title);

      try {
        console.log('Generating featured image with Cloudflare AI...');
        const imagePrompt = `${article.title}, professional photography, high quality, modern, clean, vibrant colors, 4k resolution, blog header image`;
        const featuredImage = await imageGen.generateImage(imagePrompt, {
          width: 1200,
          height: 630
        });

        // 3. Upload de l'image sur Cloudinary
        console.log('Uploading image to Cloudinary...');
        cloudinaryResult = await cloudinary.uploadImage(featuredImage, {
          folder: `blog-articles/${articleSlug}`,
          filename: `${articleSlug}-featured`,
          tags: ['blog', 'auto-generated', articleSlug],
          altText: article.title
        });
      } catch (imageError) {
        console.warn('Image generation failed, continuing without image:', imageError.message);
        // Continue without image
      }

      // 4. Préparer le contenu avec titre H1 et image intégrés
      let fullContent = '';

      // Ajouter le titre H1 en haut du contenu
      fullContent += `<h1 class="article-title">${article.title}</h1>\n\n`;

      // Ajouter l'image à la une dans le contenu si disponible
      if (cloudinaryResult && cloudinaryResult.secureUrl) {
        fullContent += `<figure class="featured-image">\n`;
        fullContent += `<img src="${cloudinaryResult.secureUrl}" alt="${article.title}" class="wp-image-featured" />\n`;
        fullContent += `</figure>\n\n`;
      }

      // Ajouter le contenu de l'article
      fullContent += article.content;

      // 5. Publication sur WordPress
      console.log('Publishing to WordPress...');
      const wpResult = await wordpress.publishCompleteArticle({
        title: article.title,
        content: fullContent,
        metaDescription: article.metaDescription,
        keywords: topicData.keywords || [],
        categoryName: topicData.category || 'Blog',
        featuredImageUrl: cloudinaryResult ? cloudinaryResult.secureUrl : null,
        featuredImageAlt: article.title,
        status: topicData.status || 'publish'
      });

      console.log('Article published successfully:', wpResult.url);

      return {
        success: true,
        article: {
          title: article.title,
          wordpressUrl: wpResult.url,
          imageUrl: cloudinaryResult ? cloudinaryResult.secureUrl : null,
          publishDate: wpResult.date
        }
      };
    } catch (error) {
      console.error('Error generating and publishing article:', error);
      throw error;
    }
  },

  /**
   * Handler pour la route de génération manuelle d'article
   */
  async handleGenerateArticle(request, env) {
    try {
      const body = await request.json();
      const { topic, keywords = [], category = 'Blog', status = 'publish' } = body;

      if (!topic) {
        return new Response(JSON.stringify({
          error: 'Topic is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await this.generateAndPublishArticle({
        topic,
        keywords,
        category,
        status
      }, env);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in handleGenerateArticle:', error);
      console.error('Error stack:', error.stack);
      console.error('Error type:', error.constructor.name);

      return new Response(JSON.stringify({
        success: false,
        error: error.message || String(error),
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Handler pour lister les articles WordPress
   */
  async handleListArticles(env) {
    try {
      // Utiliser le plugin personnalisé (1 seule requête) pour contourner TigerProtect
      const wordpress = new WordPressPluginService(
        env.WORDPRESS_URL,
        env.WORDPRESS_APP_PASSWORD
      );

      const posts = await wordpress.getPosts(20, 1);

      return new Response(JSON.stringify({
        count: posts.length,
        posts: posts.map(post => ({
          id: post.id,
          title: post.title.rendered,
          url: post.link,
          date: post.date,
          status: post.status
        }))
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Handler pour tester la génération d'image Cloudflare AI
   */
  async handleTestImage(env) {
    try {
      console.log('Testing Cloudflare AI image generation...');

      const imageGen = new ImageGeneratorService(env.AI);
      const cloudinary = new CloudinaryService(
        env.CLOUDINARY_CLOUD_NAME,
        env.CLOUDINARY_API_KEY,
        env.CLOUDINARY_API_SECRET,
        env.CLOUDINARY_UPLOAD_PRESET
      );

      // 1. Générer l'image avec Cloudflare AI
      console.log('Step 1: Generating image with Cloudflare AI...');
      const imageBuffer = await imageGen.generateImage(
        'Professional car detailing, polishing a black luxury car, high quality photography, studio lighting',
        { width: 1024, height: 768 }
      );

      console.log('Image generated, buffer size:', imageBuffer?.byteLength || 'unknown');

      // 2. Upload sur Cloudinary
      console.log('Step 2: Uploading to Cloudinary...');
      const cloudinaryResult = await cloudinary.uploadImage(imageBuffer, {
        folder: 'blog-articles/test',
        filename: `test-image-${Date.now()}`,
        tags: ['test', 'cloudflare-ai'],
        altText: 'Test image from Cloudflare AI'
      });

      console.log('Upload successful:', cloudinaryResult.secureUrl);

      return new Response(JSON.stringify({
        success: true,
        message: 'Image generated and uploaded successfully',
        imageUrl: cloudinaryResult.secureUrl,
        publicId: cloudinaryResult.publicId,
        dimensions: {
          width: cloudinaryResult.width,
          height: cloudinaryResult.height
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Image test failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Handler pour générer automatiquement des sujets avec Gemini
   */
  async handleGenerateTopics(request, env) {
    try {
      const body = await request.json().catch(() => ({}));
      const count = body.count || 10;
      const niche = body.niche || 'detailing automobile, préparation esthétique, entretien voiture';

      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const wordpress = new WordPressPluginService(
        env.WORDPRESS_URL,
        env.WORDPRESS_APP_PASSWORD
      );

      // Récupérer les titres existants pour éviter les doublons
      let existingTitles = [];
      try {
        const existingPosts = await wordpress.getPosts(100, 1);
        existingTitles = existingPosts.map(p => p.title.rendered);
      } catch (e) {
        console.warn('Could not fetch existing posts:', e.message);
      }

      // Générer les nouveaux sujets
      const topics = await gemini.generateTopics(existingTitles, niche, count);

      return new Response(JSON.stringify({
        success: true,
        existingArticlesCount: existingTitles.length,
        generatedTopics: topics.length,
        topics
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Handler pour renouveler automatiquement les topics sur GitHub
   */
  async handleRefillTopics(env) {
    try {
      // Vérifier combien de topics restent
      const currentTopics = await this.getTopicsFromGitHub(env);

      if (currentTopics.length >= 5) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Topics list is still sufficient',
          remainingTopics: currentTopics.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const wordpress = new WordPressPluginService(
        env.WORDPRESS_URL,
        env.WORDPRESS_APP_PASSWORD
      );

      // Récupérer les titres existants
      let existingTitles = [];
      try {
        const existingPosts = await wordpress.getPosts(100, 1);
        existingTitles = existingPosts.map(p => p.title.rendered);
      } catch (e) {
        console.warn('Could not fetch existing posts:', e.message);
      }

      // Ajouter aussi les topics actuels pour éviter les doublons
      const allExisting = [...existingTitles, ...currentTopics.map(t => t.topic)];

      // Générer 10 nouveaux sujets
      const newTopics = await gemini.generateTopics(
        allExisting,
        'detailing automobile, préparation esthétique, entretien voiture',
        10
      );

      // Combiner avec les topics restants
      const allTopics = [...currentTopics, ...newTopics];

      // Sauvegarder sur GitHub
      await this.saveTopicsToGitHub(env, allTopics);

      return new Response(JSON.stringify({
        success: true,
        previousCount: currentTopics.length,
        addedCount: newTopics.length,
        totalCount: allTopics.length,
        topics: allTopics
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Sauvegarde les topics sur GitHub
   */
  async saveTopicsToGitHub(env, topics) {
    // Récupérer le SHA actuel du fichier
    const response = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
      {
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Cloudflare-Worker',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    let sha = null;
    if (response.ok) {
      const data = await response.json();
      sha = data.sha;
    }

    // Mettre à jour ou créer le fichier
    const updateResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Cloudflare-Worker',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Auto-refill topics (${topics.length} topics)`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(topics, null, 2)))),
          ...(sha && { sha })
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to save topics: ${updateResponse.status}`);
    }

    console.log(`Saved ${topics.length} topics to GitHub`);
  },

  /**
   * Récupère la liste des sujets depuis GitHub
   */
  async getTopicsFromGitHub(env) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
        {
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        // Si le fichier n'existe pas encore, retourner un tableau vide
        if (response.status === 404) {
          return [];
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const content = atob(data.content);
      const topics = JSON.parse(content);

      return topics;
    } catch (error) {
      console.error('Error fetching topics from GitHub:', error);
      return [];
    }
  },

  /**
   * Retire un sujet de la liste GitHub après traitement
   */
  async removeTopicFromGitHub(env, processedTopic) {
    try {
      // Récupérer la liste actuelle
      const response = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
        {
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const data = await response.json();
      const content = atob(data.content);
      const topics = JSON.parse(content);

      // Retirer le sujet traité
      const updatedTopics = topics.filter(t => t.topic !== processedTopic.topic);

      // Mettre à jour le fichier sur GitHub
      const updateResponse = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/topics.json`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Remove processed topic: ${processedTopic.topic}`,
            content: btoa(JSON.stringify(updatedTopics, null, 2)),
            sha: data.sha
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Failed to update topics file: ${updateResponse.status}`);
      }

      console.log('Topic removed from GitHub:', processedTopic.topic);
    } catch (error) {
      console.error('Error removing topic from GitHub:', error);
    }
  }
};

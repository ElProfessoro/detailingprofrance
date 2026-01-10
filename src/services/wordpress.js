/**
 * Service pour publier des articles sur WordPress via l'API REST
 */

export class WordPressService {
  constructor(siteUrl, username, appPassword) {
    this.siteUrl = siteUrl.replace(/\/$/, ''); // Supprime le slash final
    this.username = username;
    this.appPassword = appPassword;
    this.apiBase = `${this.siteUrl}/wp-json/wp/v2`;
    this.authHeader = this.createAuthHeader();
  }

  /**
   * Crée l'en-tête d'authentification Basic Auth
   * @returns {string}
   */
  createAuthHeader() {
    const credentials = `${this.username}:${this.appPassword}`;
    return `Basic ${btoa(credentials)}`;
  }

  /**
   * Publie un article sur WordPress
   * @param {object} article - Données de l'article
   * @returns {Promise<object>} - Réponse de WordPress
   */
  async publishPost(article) {
    const {
      title,
      content,
      excerpt = '',
      status = 'publish', // draft, publish, pending
      categories = [],
      tags = [],
      featuredMedia = null,
      metaDescription = '',
      focusKeyword = ''
    } = article;

    try {
      // Création du post
      const postData = {
        title: title,
        content: content,
        excerpt: excerpt || metaDescription,
        status: status,
        categories: categories,
        tags: tags,
        meta: {
          _yoast_wpseo_metadesc: metaDescription,
          _yoast_wpseo_focuskw: focusKeyword
        }
      };

      // Ajout de l'image à la une si disponible
      if (featuredMedia) {
        postData.featured_media = featuredMedia;
      }

      const response = await fetch(`${this.apiBase}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WordPress API error: ${response.status} - ${error}`);
      }

      const result = await response.json();

      return {
        id: result.id,
        url: result.link,
        status: result.status,
        title: result.title.rendered,
        date: result.date
      };
    } catch (error) {
      console.error('Error publishing to WordPress:', error);
      throw error;
    }
  }

  /**
   * Upload une image sur WordPress Media Library
   * @param {ArrayBuffer|string} imageData - Données de l'image
   * @param {string} filename - Nom du fichier
   * @param {string} altText - Texte alternatif
   * @returns {Promise<number>} - ID du média
   */
  async uploadMedia(imageData, filename, altText = '') {
    try {
      // Conversion de l'image si nécessaire
      let imageBlob;
      if (typeof imageData === 'string') {
        // Si c'est une URL, télécharger l'image
        if (imageData.startsWith('http')) {
          const imgResponse = await fetch(imageData);
          imageBlob = await imgResponse.blob();
        } else {
          // Si c'est du base64
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          imageBlob = new Blob([bytes], { type: 'image/png' });
        }
      } else {
        imageBlob = new Blob([imageData], { type: 'image/png' });
      }

      const formData = new FormData();
      formData.append('file', imageBlob, filename);
      if (altText) {
        formData.append('alt_text', altText);
      }

      const response = await fetch(`${this.apiBase}/media`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WordPress Media upload error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error uploading media to WordPress:', error);
      throw error;
    }
  }

  /**
   * Upload une image depuis une URL Cloudinary
   * @param {string} imageUrl - URL de l'image sur Cloudinary
   * @param {string} filename - Nom du fichier
   * @param {string} altText - Texte alternatif
   * @returns {Promise<number>} - ID du média
   */
  async uploadMediaFromUrl(imageUrl, filename, altText = '') {
    try {
      const response = await fetch(imageUrl);
      const imageBlob = await response.blob();

      const formData = new FormData();
      formData.append('file', imageBlob, filename);
      if (altText) {
        formData.append('alt_text', altText);
      }

      const uploadResponse = await fetch(`${this.apiBase}/media`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`WordPress Media upload error: ${uploadResponse.status} - ${error}`);
      }

      const result = await uploadResponse.json();
      return result.id;
    } catch (error) {
      console.error('Error uploading media from URL to WordPress:', error);
      throw error;
    }
  }

  /**
   * Crée ou récupère une catégorie
   * @param {string} name - Nom de la catégorie
   * @param {string} slug - Slug de la catégorie
   * @returns {Promise<number>} - ID de la catégorie
   */
  async getOrCreateCategory(name, slug = null) {
    try {
      // Recherche de la catégorie existante
      const searchResponse = await fetch(
        `${this.apiBase}/categories?search=${encodeURIComponent(name)}`,
        {
          headers: {
            'Authorization': this.authHeader
          }
        }
      );

      const categories = await searchResponse.json();
      if (categories.length > 0) {
        return categories[0].id;
      }

      // Création de la catégorie si elle n'existe pas
      const createResponse = await fetch(`${this.apiBase}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader
        },
        body: JSON.stringify({
          name: name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-')
        })
      });

      const newCategory = await createResponse.json();
      return newCategory.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Crée ou récupère un tag
   * @param {string} name - Nom du tag
   * @returns {Promise<number>} - ID du tag
   */
  async getOrCreateTag(name) {
    try {
      // Recherche du tag existant
      const searchResponse = await fetch(
        `${this.apiBase}/tags?search=${encodeURIComponent(name)}`,
        {
          headers: {
            'Authorization': this.authHeader
          }
        }
      );

      const tags = await searchResponse.json();
      if (tags.length > 0) {
        return tags[0].id;
      }

      // Création du tag s'il n'existe pas
      const createResponse = await fetch(`${this.apiBase}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader
        },
        body: JSON.stringify({
          name: name,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        })
      });

      const newTag = await createResponse.json();
      return newTag.id;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  /**
   * Publie un article complet avec images
   * @param {object} articleData - Données complètes de l'article
   * @returns {Promise<object>}
   */
  async publishCompleteArticle(articleData) {
    const {
      title,
      content,
      metaDescription,
      keywords = [],
      categoryName = 'Blog',
      featuredImageUrl = null,
      featuredImageAlt = '',
      status = 'publish'
    } = articleData;

    try {
      // Création de la catégorie
      const categoryId = await this.getOrCreateCategory(categoryName);

      // Création des tags à partir des mots-clés
      const tagIds = [];
      for (const keyword of keywords.slice(0, 10)) { // Limite à 10 tags
        const tagId = await this.getOrCreateTag(keyword);
        tagIds.push(tagId);
      }

      // Upload de l'image à la une si disponible
      let featuredMediaId = null;
      if (featuredImageUrl) {
        featuredMediaId = await this.uploadMediaFromUrl(
          featuredImageUrl,
          `${this.slugify(title)}-featured.jpg`,
          featuredImageAlt || title
        );
      }

      // Publication de l'article
      const article = {
        title,
        content,
        excerpt: metaDescription,
        status,
        categories: [categoryId],
        tags: tagIds,
        featuredMedia: featuredMediaId,
        metaDescription,
        focusKeyword: keywords[0] || ''
      };

      return await this.publishPost(article);
    } catch (error) {
      console.error('Error publishing complete article:', error);
      throw error;
    }
  }

  /**
   * Convertit une chaîne en slug
   * @param {string} text - Texte à convertir
   * @returns {string} - Slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Supprime les tirets multiples
      .replace(/^-|-$/g, ''); // Supprime les tirets en début/fin
  }

  /**
   * Récupère les articles existants
   * @param {number} perPage - Nombre d'articles par page
   * @param {number} page - Numéro de page
   * @returns {Promise<Array>}
   */
  async getPosts(perPage = 10, page = 1) {
    try {
      const response = await fetch(
        `${this.apiBase}/posts?per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': this.authHeader
          }
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Supprime un article
   * @param {number} postId - ID de l'article
   * @returns {Promise<object>}
   */
  async deletePost(postId) {
    try {
      const response = await fetch(`${this.apiBase}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.authHeader
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

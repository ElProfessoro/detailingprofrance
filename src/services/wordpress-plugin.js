/**
 * Service WordPress utilisant le plugin personnalisé Blog Automation API
 * Contourne TigerProtect en envoyant 1 seule requête HTTP
 */

export class WordPressPluginService {
  constructor(siteUrl, apiToken) {
    this.apiBase = `${siteUrl.replace(/\/$/, '')}/wp-json/blog-automation/v1`;
    this.apiToken = apiToken;
  }

  /**
   * Publie un article complet en 1 seule requête
   */
  async publishCompleteArticle(articleData) {
    const endpoint = `${this.apiBase}/publish`;

    const payload = {
      title: articleData.title,
      content: articleData.content,
      metaDescription: articleData.metaDescription || '',
      categoryName: articleData.categoryName || 'Blog',
      keywords: articleData.keywords || [],
      featuredImageUrl: articleData.featuredImageUrl || null,
      featuredImageAlt: articleData.featuredImageAlt || articleData.title,
      status: articleData.status || 'publish'
    };

    console.log('Publishing article via plugin API:', articleData.title);
    console.log('Endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': this.apiToken
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Plugin API error:', response.status, errorText);
      throw new Error(`Plugin API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error('Plugin API returned success=false');
    }

    return {
      id: result.id,
      url: result.url,
      date: result.date
    };
  }

  /**
   * Test la connexion au plugin
   */
  async testConnection() {
    const endpoint = `${this.apiBase}/test`;

    console.log('Testing plugin API connection:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Plugin API test failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Plugin API test result:', result);

    return result.status === 'ok';
  }

  /**
   * Génère un slug à partir d'un titre
   */
  slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Récupère la liste des articles
   */
  async getPosts(perPage = 10, page = 1) {
    const endpoint = `${this.apiBase}/posts?per_page=${perPage}&page=${page}`;

    console.log('Fetching posts from plugin API:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Plugin API getPosts failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Met à jour un article existant
   */
  async updateArticle(postId, updateData) {
    const endpoint = `${this.apiBase}/update/${postId}`;

    console.log('Updating article via plugin API:', postId);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': this.apiToken
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Plugin API update error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  }
}

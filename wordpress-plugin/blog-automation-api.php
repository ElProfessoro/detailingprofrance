<?php
/**
 * Plugin Name: Blog Automation API
 * Plugin URI: https://github.com/ElProfessoro/detailingprofrance
 * Description: Endpoint sécurisé pour publier des articles depuis Cloudflare Workers (contourne TigerProtect avec 1 seule requête)
 * Version: 1.0.0
 * Author: Detailing Pro France
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Enregistre l'endpoint REST API personnalisé
 */
add_action('rest_api_init', function () {
    register_rest_route('blog-automation/v1', '/publish', [
        'methods' => 'POST',
        'callback' => 'blog_automation_publish_article',
        'permission_callback' => 'blog_automation_verify_token'
    ]);

    register_rest_route('blog-automation/v1', '/test', [
        'methods' => 'GET',
        'callback' => 'blog_automation_test',
        'permission_callback' => '__return_true'
    ]);

    register_rest_route('blog-automation/v1', '/posts', [
        'methods' => 'GET',
        'callback' => 'blog_automation_get_posts',
        'permission_callback' => '__return_true'
    ]);

    register_rest_route('blog-automation/v1', '/update/(?P<id>\d+)', [
        'methods' => 'POST',
        'callback' => 'blog_automation_update_article',
        'permission_callback' => 'blog_automation_verify_token'
    ]);

    register_rest_route('blog-automation/v1', '/post/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'blog_automation_get_single_post',
        'permission_callback' => 'blog_automation_verify_token'
    ]);
});

/**
 * Vérifie le token d'authentification
 */
function blog_automation_verify_token($request) {
    $token = $request->get_header('X-API-Token');

    // Vérifier le token
    // Tu peux utiliser ton Application Password actuel comme token
    // Ou créer un token personnalisé dans les options WordPress
    $valid_token = get_option('blog_automation_api_token', 'ckSl eiQo zqBs QMKE Hc9P kkZx');

    // Supprimer les espaces pour la comparaison
    $token_clean = str_replace(' ', '', $token);
    $valid_token_clean = str_replace(' ', '', $valid_token);

    return $token_clean === $valid_token_clean;
}

/**
 * Endpoint de test
 */
function blog_automation_test($request) {
    return new WP_REST_Response([
        'status' => 'ok',
        'message' => 'Blog Automation API is working!',
        'version' => '1.1.0',
        'timestamp' => current_time('c')
    ], 200);
}

/**
 * Récupère un article complet avec son contenu
 */
function blog_automation_get_single_post($request) {
    $post_id = $request->get_param('id');
    $post = get_post($post_id);

    if (!$post) {
        return new WP_Error('post_not_found', 'Article not found', ['status' => 404]);
    }

    $categories = wp_get_post_categories($post->ID, ['fields' => 'names']);

    return new WP_REST_Response([
        'id' => $post->ID,
        'title' => $post->post_title,
        'content' => $post->post_content,
        'content_length' => strlen($post->post_content),
        'excerpt' => $post->post_excerpt,
        'status' => $post->post_status,
        'date' => $post->post_date,
        'link' => get_permalink($post->ID),
        'categories' => $categories
    ], 200);
}

/**
 * Récupère la liste des articles
 */
function blog_automation_get_posts($request) {
    $per_page = $request->get_param('per_page') ?: 20;
    $page = $request->get_param('page') ?: 1;

    $posts = get_posts([
        'post_type' => 'post',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => ['publish', 'draft', 'pending']
    ]);

    $result = [];
    foreach ($posts as $post) {
        $categories = wp_get_post_categories($post->ID, ['fields' => 'names']);
        $result[] = [
            'id' => $post->ID,
            'title' => ['rendered' => $post->post_title],
            'link' => get_permalink($post->ID),
            'date' => $post->post_date,
            'status' => $post->post_status,
            'categories' => $categories
        ];
    }

    return new WP_REST_Response($result, 200);
}

/**
 * Met à jour un article existant
 */
function blog_automation_update_article($request) {
    $post_id = $request->get_param('id');
    $data = $request->get_json_params();

    // Vérifier que l'article existe
    $post = get_post($post_id);
    if (!$post) {
        return new WP_Error('post_not_found', 'Article not found', ['status' => 404]);
    }

    // Mettre à jour les champs fournis
    $post_data = ['ID' => $post_id];

    if (isset($data['title'])) {
        $post_data['post_title'] = wp_strip_all_tags($data['title']);
    }
    if (isset($data['content'])) {
        $post_data['post_content'] = $data['content'];
    }
    if (isset($data['status'])) {
        $post_data['post_status'] = $data['status'];
    }

    $result = wp_update_post($post_data, true);

    if (is_wp_error($result)) {
        return new WP_Error('update_failed', $result->get_error_message(), ['status' => 500]);
    }

    // Mettre à jour la catégorie
    if (!empty($data['categoryName'])) {
        $category = get_category_by_slug(sanitize_title($data['categoryName']));

        if (!$category) {
            $category_id = wp_create_category($data['categoryName']);
        } else {
            $category_id = $category->term_id;
        }

        if ($category_id && !is_wp_error($category_id)) {
            wp_set_post_categories($post_id, [$category_id]);
        }
    }

    return new WP_REST_Response([
        'success' => true,
        'id' => $post_id,
        'url' => get_permalink($post_id),
        'message' => 'Article updated successfully'
    ], 200);
}

/**
 * Publie un article complet en 1 seule requête
 */
function blog_automation_publish_article($request) {
    $data = $request->get_json_params();

    // Validation
    if (empty($data['title']) || empty($data['content'])) {
        return new WP_Error('missing_data', 'Title and content are required', ['status' => 400]);
    }

    // Créer le post
    $post_data = [
        'post_title' => wp_strip_all_tags($data['title']),
        'post_content' => $data['content'],
        'post_excerpt' => isset($data['metaDescription']) ? $data['metaDescription'] : '',
        'post_status' => isset($data['status']) ? $data['status'] : 'publish',
        'post_author' => 1, // Admin user
        'post_type' => 'post'
    ];

    $post_id = wp_insert_post($post_data, true);

    if (is_wp_error($post_id)) {
        return new WP_Error('post_creation_failed', $post_id->get_error_message(), ['status' => 500]);
    }

    // Ajouter la catégorie
    if (!empty($data['categoryName'])) {
        $category = get_category_by_slug(sanitize_title($data['categoryName']));

        if (!$category) {
            $category_id = wp_create_category($data['categoryName']);
        } else {
            $category_id = $category->term_id;
        }

        if ($category_id && !is_wp_error($category_id)) {
            wp_set_post_categories($post_id, [$category_id]);
        }
    }

    // Ajouter les tags (keywords)
    if (!empty($data['keywords']) && is_array($data['keywords'])) {
        wp_set_post_tags($post_id, $data['keywords'], false);
    }

    // Image à la une (upload depuis URL)
    if (!empty($data['featuredImageUrl'])) {
        $image_id = blog_automation_upload_image_from_url(
            $data['featuredImageUrl'],
            $post_id,
            isset($data['featuredImageAlt']) ? $data['featuredImageAlt'] : $data['title']
        );

        if ($image_id && !is_wp_error($image_id)) {
            set_post_thumbnail($post_id, $image_id);
        }
    }

    // Retourner la réponse
    return new WP_REST_Response([
        'success' => true,
        'id' => $post_id,
        'url' => get_permalink($post_id),
        'date' => get_the_date('c', $post_id),
        'edit_url' => get_edit_post_link($post_id, 'raw')
    ], 200);
}

/**
 * Upload une image depuis une URL
 */
function blog_automation_upload_image_from_url($image_url, $post_id, $alt_text = '') {
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');

    // Log pour debug
    error_log('Blog Automation: Downloading image from: ' . $image_url);

    // Télécharger l'image avec timeout plus long
    $tmp = download_url($image_url, 60);

    if (is_wp_error($tmp)) {
        error_log('Blog Automation: Download failed: ' . $tmp->get_error_message());
        return $tmp;
    }

    // Générer un nom de fichier propre
    $url_parts = parse_url($image_url);
    $path_parts = pathinfo($url_parts['path']);
    $filename = sanitize_file_name($path_parts['basename']);

    // S'assurer que le fichier a une extension
    if (empty($path_parts['extension'])) {
        $filename .= '.jpg';
    }

    // Préparer le fichier
    $file_array = [
        'name' => $filename,
        'tmp_name' => $tmp
    ];

    // Upload l'image
    $image_id = media_handle_sideload($file_array, $post_id);

    // Nettoyer le fichier temporaire
    @unlink($tmp);

    if (is_wp_error($image_id)) {
        error_log('Blog Automation: Sideload failed: ' . $image_id->get_error_message());
        return $image_id;
    }

    // Ajouter le texte alternatif
    if (!empty($alt_text)) {
        update_post_meta($image_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));
    }

    error_log('Blog Automation: Image uploaded successfully, ID: ' . $image_id);
    return $image_id;
}

/**
 * Ajouter une page de configuration dans l'admin
 */
add_action('admin_menu', function() {
    add_options_page(
        'Blog Automation API',
        'Blog Automation',
        'manage_options',
        'blog-automation-api',
        'blog_automation_settings_page'
    );
});

/**
 * Page de configuration
 */
function blog_automation_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }

    // Sauvegarder le token si le formulaire est soumis
    if (isset($_POST['blog_automation_token'])) {
        check_admin_referer('blog_automation_save_token');
        update_option('blog_automation_api_token', sanitize_text_field($_POST['blog_automation_token']));
        echo '<div class="notice notice-success"><p>Token sauvegardé!</p></div>';
    }

    $current_token = get_option('blog_automation_api_token', 'ckSl eiQo zqBs QMKE Hc9P kkZx');
    $endpoint_url = rest_url('blog-automation/v1/publish');
    $test_url = rest_url('blog-automation/v1/test');

    ?>
    <div class="wrap">
        <h1>Blog Automation API</h1>

        <div class="card">
            <h2>Configuration</h2>
            <form method="post">
                <?php wp_nonce_field('blog_automation_save_token'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="blog_automation_token">API Token</label></th>
                        <td>
                            <input type="text"
                                   name="blog_automation_token"
                                   id="blog_automation_token"
                                   value="<?php echo esc_attr($current_token); ?>"
                                   class="regular-text">
                            <p class="description">Utilise ton Application Password ou génère un token personnalisé</p>
                        </td>
                    </tr>
                </table>
                <p class="submit">
                    <input type="submit" class="button button-primary" value="Sauvegarder">
                </p>
            </form>
        </div>

        <div class="card">
            <h2>Endpoints API</h2>
            <p><strong>Publication d'article:</strong></p>
            <code><?php echo esc_html($endpoint_url); ?></code>

            <p style="margin-top: 20px;"><strong>Test de connexion:</strong></p>
            <code><?php echo esc_html($test_url); ?></code>
        </div>

        <div class="card">
            <h2>Test rapide</h2>
            <p>Teste l'endpoint avec cette commande curl:</p>
            <pre style="background: #f5f5f5; padding: 15px; overflow-x: auto;">curl -X POST <?php echo esc_html($endpoint_url); ?> \
  -H "Content-Type: application/json" \
  -H "X-API-Token: <?php echo esc_html($current_token); ?>" \
  -d '{
    "title": "Test Article",
    "content": "&lt;p&gt;Contenu du test&lt;/p&gt;",
    "status": "draft",
    "categoryName": "Blog"
  }'</pre>
        </div>

        <div class="card">
            <h2>Avantages de cette solution</h2>
            <ul>
                <li>✅ <strong>1 seule requête HTTP</strong> → TigerProtect ne se déclenche pas</li>
                <li>✅ <strong>Authentification sécurisée</strong> avec Application Password</li>
                <li>✅ <strong>Gestion complète</strong>: titre, contenu, catégorie, tags, image à la une</li>
                <li>✅ <strong>Aucune configuration serveur</strong> requise (pas besoin de cPanel)</li>
            </ul>
        </div>
    </div>
    <?php
}

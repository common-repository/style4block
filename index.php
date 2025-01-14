<?php
/*
Plugin Name: Style4Block - Custom CSS For Gutenberg Blocks
Description: Customize WordPress blocks visually.
Plugin URI: https://style4block.com
Version: 1.0.3
Author: WaspThemes
Author URI: https://yellowpencil.waspthemes.com
*/

// Don't run this file directly. 
if (!defined('ABSPATH')) {
    die('-1');
}

// register the plugin's  css and js files
function sfb_plugin_register() {

    // Scripts
    wp_register_script(
        'sfb-build-js',
        plugins_url( 'assets/sfb-build.js', __FILE__ ),
        array(
            'jquery',
            'wp-plugins',
            'wp-edit-post',
            'wp-element',
            'wp-components'
        )
    );

    // Styles
    wp_register_style(
        'sfb-build-css',
        plugins_url( 'assets/sfb-build.css', __FILE__ )
    );

}

add_action( 'init', 'sfb_plugin_register' );
 

// Enqueue JS
function sfb_plugin_script_enqueue() {
    wp_enqueue_script( 'sfb-build-js' );
}

add_action( 'enqueue_block_editor_assets', 'sfb_plugin_script_enqueue' );
 

// Enqueue CSS
function sfb_plugin_style_enqueue() {
    wp_enqueue_style( 'sfb-build-css' );
}

add_action( 'enqueue_block_assets', 'sfb_plugin_style_enqueue' );


// CSS post meta
function sfb_plugin_register_css_meta() {

    // Get post types
    $post_types = get_post_types();

    // loop
    foreach($post_types as $post_type){

        // Register css meta
        register_post_meta( $post_type, 'sfb_css', array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
        ));

    }

}
add_action( 'init', 'sfb_plugin_register_css_meta' );


// Add generated CSS codes to wp_head
function sfb_hook_css_to_head(){

    global $wp_query;

    // Reading the post id
    if (isset($wp_query->queried_object)) {
        $id = @$wp_query->queried_object->ID;
    }

    // Special ID for shop page
    if (class_exists('WooCommerce')) {
        if (is_shop()) {
            $id = wc_get_page_id('shop');
        }
    }

    // has CSS?
    if (isset($id)) {

        // Get CSS
        $css = get_post_meta($id, 'sfb_css', true);

        // strip all tags for security
        $css = wp_strip_all_tags($css);

        // Create Style Tag
        $output = "\n<style id='style-for-block'>";

        // Add information
        $output .= "\r\n\t/* The following CSS generated by Style4Block Plugin. */\r\n\t";
            
        // Add CSS
        $output .= stripslashes(sfb_auto_prefix($css));

        // Close style tag
        $output .= "\r\n</style>\r\n";

        echo $output;

    }

}

add_action("wp_head", "sfb_hook_css_to_head", 999999999); // first priority



// Generates webkit, ms prefixes for same result on all browsers
function sfb_auto_prefix($css) {

    // clean ms and webkit if available
    $css = preg_replace('@\t(-webkit-|-ms-)(.*?):(.*?);@si', "", $css);
    
    // Webkit prefixes
    $webkit = array(
        "background-size",
        "background-clip",
        "box-sizing",
        "animation-name",
        "animation-iteration-count",
        "animation-duration",
        "animation-delay",
        "animation-fill-mode",
        "box-shadow",
        "filter",
        "transform",
        "flex-direction",
        "flex-wrap",
        "justify-content",
        "align-items",
        "align-content",
        "flex-basis",
        "align-self",
        "flex-grow",
        "flex-shrink",
        "perspective",
        "transform-origin",
        "backface-visibility",
        "animation-timing-function"
    );

    // Ms prefixes
    $ms = array(
        "transform",
        "flex-direction",
        "flex-wrap",
        "justify-content",
        "align-items",
        "align-content",
        "flex-basis",
        "align-self",
        "flex-grow",
        "flex-shrink",
        "transform-origin",
        "backface-visibility"
    );
    
    // Webkit
    foreach ($webkit as $prefix) {
        
        if($prefix == "justify-content"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-webkit-box-pack:$1;-webkit-justify-content:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "align-items"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-webkit-box-align:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "flex-grow"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-webkit-box-flex:$1;" . $prefix . ":$1;", $css);
        }else{
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-webkit-" . $prefix . ":$1;" . $prefix . ":$1;", $css);
        }
        
    }

    // MS
    foreach ($ms as $prefix) {
        
        if($prefix == "justify-content"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-pack:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "align-items"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-align:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "align-content"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-line-pack:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "flex-basis"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-preferred-size:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "align-self"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-item-align:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "flex-grow"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-positive:$1;" . $prefix . ":$1;", $css);
        }else if($prefix == "flex-shrink"){
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-flex-negative:$1;" . $prefix . ":$1;", $css);
        }else{
            $css = preg_replace('@(?<!-)' . $prefix . ':([^\{\;]+);@i', "-ms-" . $prefix . ":$1;" . $prefix . ":$1;", $css);
        }
        
    }

    // Display: flex
    $css = preg_replace('@display(\s+)?:(\s+)?flex(\s+)?(\!important)?;@i', "display:-webkit-box$3$4;display:-webkit-flex$3$4;display:-ms-flexbox$3$4;display:flex$3$4;", $css);

    return $css;
    
}
<?php
/**
 * Plugin Name: WooCommerce Mix and Match - Mobile Styles
 * Plugin URI: https://woocommerce.com/products/woocommerce-mix-and-match-products/
 * Description: Turns the Mix and Match counter message into a sticky footer.
 * Version: 2.0.3-beta.1
 * Author: Kathy Darling
 * Author URI: http://kathyisawesome.com/
 *
 * Text Domain: wc-mnm-mobile-styles
 * Domain Path: /languages/
 *
 * Requires at least: 6.6.0
 * Tested up to: 6.7.0
 *
 * WC requires at least: 6.0.0
 * WC tested up to: 7.0.0
 *
 * GitHub Plugin URI: https://github.com/kathyisawesome/wc-mnm-mobile-styles
 * Primary Branch: trunk
 * Release Asset: true
 *
 * Copyright: © 2024 Kathy Darling
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use \Backcourt\MNMMobileStyles\Vendor\Fragen;

 /**
  * Add Git Updater Lite
  */
require_once __DIR__ . '/packages/autoload.php';
add_filter( 'gul_update_server', function () {
	return 'https://backcourt.io';
});
( new Fragen\Git_Updater\Lite( __FILE__ ) )->run();

class WC_MNM_Mobile_Styles {

	const REQ_MNM_VERSION = '2.7.0-beta.1';
	const VERSION = '2.0.3-beta.1';

	/**
	 * Fire in the hole!
	 */
	public static function init() {

		// Quietly quit if Mix and Match is not active or below 2.0.
		if ( ! function_exists( 'wc_mix_and_match' ) || version_compare( wc_mix_and_match()->version, self::REQ_MNM_VERSION ) < 0 ) {
			return false;
		}

		// Scripts and styles.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_scripts' ) );

		// Simple MNM support.
        add_action( 'woocommerce_mix-and-match_add_to_cart', array( __CLASS__, 'attach_hooks' ), 0 );
    
		// Variable MNM support.
		add_action( 'woocommerce_variable-mix-and-match_add_to_cart', array( __CLASS__, 'attach_hooks' ), 0 );

		// Subscription editing
		add_action( 'wc_mnm_subscription_editing_enqueue_scripts', array( __CLASS__, 'attach_hooks' ), 0 );

		// Declare Features compatibility.
		add_action( 'before_woocommerce_init', array( __CLASS__, 'declare_features_compatibility' ) );

	}


	/*-----------------------------------------------------------------------------------*/
	/* Front End Display */
	/*-----------------------------------------------------------------------------------*/

	/**
	 * Register the scripts and styles
	 */
	public static function register_scripts() {

		$style_path    = 'assets/frontend/style-mobile-footer.css';
		$style_url     = self::plugin_url() . $style_path;
		$style_version = WC_Mix_and_Match()->get_file_version( self::plugin_path() . $style_path, self::VERSION );

		wp_enqueue_style( 'wc_mnm_mobile', $style_url, array( 'wc-mnm-frontend' ), $style_version );
		wp_style_add_data( 'wc_mnm_mobile', 'rtl', 'replace' );

		// Scripts.
		$script_path = 'assets/frontend/mobile-footer.js';
		$script_url  = trailingslashit( plugins_url( '/', __FILE__ ) ) . $script_path;

		$script_asset_path = trailingslashit( plugin_dir_path( __FILE__ ) ) . 'assets/frontend/mobile-footer.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: array(
				'dependencies' => array(),
				'version'      => WC_Mix_and_Match()->get_file_version( trailingslashit( plugin_dir_path( __FILE__ ) ) . $script_path ),
			);

		$dependencies = array_merge( $script_asset[ 'dependencies' ], [ 'wc-price-format' ] );

		wp_register_script(
			'wc_mnm_mobile',
			$script_url,
			$dependencies,
			$script_asset[ 'version' ],
			true
		);

	}
	
	/**
	 * Add a target element for screen reader.
	 * 
	 * @since 2.0.0
	 */
	public static function add_target_link() {
		echo '<div id="wc-mnm-child-items" class="screen-reader-text"></div>';
	}
		
	/**
	 * Add a skip link for screen reader.
	 * 
	 * @since 2.0.0
	 */
	public static function add_skip_link() {

		if ( doing_action( 'wc_ajax_mnm_get_edit_container_order_item_form' )
			|| ( isset( $_POST['validation_context'] ) && wc_clean( $_POST['validation_context'] ) === 'edit' )
		) {
			$button_text = esc_html__( 'Skip to update button.', 'wc-mnm-mobile-styles' );
		} else {
			$button_text = esc_html__( 'Skip to add to cart button', 'wc-mnm-mobile-styles' );
		}
		echo '<a href="#wc-mnm-footer-add-to-cart" class="screen-reader-text">' . esc_html( $button_text ) . '</a>';
	}


	/**
	 * Add the mobile template
	 */
	public static function attach_hooks() {

		// Accessibility.
		add_action( 'wc_mnm_before_child_items', array( __CLASS__, 'add_target_link' ) );
		add_action( 'wc_mnm_after_child_items', array( __CLASS__, 'add_skip_link' ), 101 );

		wp_enqueue_script( 'wc_mnm_mobile' );
		
		// Add the react's root element.
		add_action( 'wp_footer', function() {
			echo '<div id="wc-mnm-status-ui-root" class="mnm-mobile-container mnm_form woocommerce" ></div>';
		} );

	}

	/*-----------------------------------------------------------------------------------*/
	/* Core Compat */
	/*-----------------------------------------------------------------------------------*/

	/**
	 * Declare Features compatibility.
	 *
	 */
	public static function declare_features_compatibility() {

		if ( ! class_exists( 'Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			return;
		}

		// HPOS (Custom Order tables.
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', plugin_basename( __FILE__ ), true );

		// Cart and Checkout Blocks.
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', plugin_basename( __FILE__ ), true );

		// Remote Logging compatibility.
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'remote_logging', plugin_basename( __FILE__ ), true );
	}

	/*-----------------------------------------------------------------------------------*/
	/*  Helper Functions                                                                 */
	/*-----------------------------------------------------------------------------------*/

	/**
	 * Get the plugin url.
	 *
	 * @return string
	 */
	public static function plugin_url() {
		return trailingslashit( plugins_url( '/', __FILE__ ) );
	}

	/**
	 * Get the plugin path.
	 *
	 * @return string
	 */
	public static function plugin_path() {
		return trailingslashit( plugin_dir_path( __FILE__ ) );
	}

}
add_action( 'plugins_loaded', array( 'WC_MNM_Mobile_Styles', 'init' ), 20 );
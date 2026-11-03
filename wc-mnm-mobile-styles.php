<?php
/**
 * Plugin Name: WooCommerce Mix and Match - Mobile Styles
 * Plugin URI: https://woocommerce.com/products/woocommerce-mix-and-match-products/
 * Description: Turns the Mix and Match counter message into a sticky footer.
 * Version: 3.0.0-beta.1
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
 * Requires Plugins: woocommerce, woocommerce-mix-and-match-products
 *
 * GitHub Plugin URI: https://github.com/kathyisawesome/wc-mnm-mobile-styles
 * Primary Branch: trunk
 * Release Asset: true
 * Update URI: https://www.backcourt.io
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
( new Fragen\Git_Updater\Lite( __FILE__ ) )->run();

class WC_MNM_Mobile_Styles {

	const REQ_MNM_VERSION = '3.0.0-alpha.2';
	const VERSION = '3.0.0-beta.1';

	/**
	 * Whether the footer is needed on this page.
	 *
	 * @var bool
	 */
	private static $attached = false;

	/**
	 * Fire in the hole!
	 */
	public static function init() {

		// Quietly quit if Mix and Match is not active or too old.
		if ( ! function_exists( 'wc_mix_and_match' ) || version_compare( wc_mix_and_match()->version, self::REQ_MNM_VERSION ) < 0 ) {
			return false;
		}

		// Scripts and styles.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_scripts' ) );

		// Mix and Match products.
		add_action( 'woocommerce_mix-and-match_add_to_cart', array( __CLASS__, 'attach_hooks' ), 0 );

		// Subscription editing.
		add_action( 'wc_mnm_subscription_editing_enqueue_scripts', array( __CLASS__, 'attach_hooks' ), 0 );

		// Declare Features compatibility.
		add_action( 'before_woocommerce_init', array( __CLASS__, 'declare_features_compatibility' ) );
	}


	/*-----------------------------------------------------------------------------------*/
	/* Front End Display */
	/*-----------------------------------------------------------------------------------*/

	/**
	 * Register the scripts and styles.
	 */
	public static function register_scripts() {

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// Fall back to the unminified files when the build hasn't run, ex: in a git checkout.
		if ( $suffix && ! file_exists( self::plugin_path() . 'assets/js/frontend/wc-mnm-mobile-styles.min.js' ) ) {
			$suffix = '';
		}

		$style_path = 'assets/css/frontend/wc-mnm-mobile-styles' . $suffix . '.css';

		wp_register_style( 'wc_mnm_mobile', self::plugin_url() . $style_path, array( 'wc-mnm-frontend' ), WC_Mix_and_Match()->get_file_version( self::plugin_path() . $style_path, self::VERSION ) );
		wp_style_add_data( 'wc_mnm_mobile', 'rtl', 'replace' );

		if ( $suffix ) {
			wp_style_add_data( 'wc_mnm_mobile', 'suffix', '.min' );
		}

		$script_path = 'assets/js/frontend/wc-mnm-mobile-styles' . $suffix . '.js';

		wp_register_script(
			'wc_mnm_mobile',
			self::plugin_url() . $script_path,
			array( 'jquery', 'wc-add-to-cart-mnm' ),
			WC_Mix_and_Match()->get_file_version( self::plugin_path() . $script_path, self::VERSION ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);

		wp_localize_script(
			'wc_mnm_mobile',
			'wc_mnm_mobile_params',
			array(
				'i18n_plans'       => _x( 'Purchase options', '[Frontend]', 'wc-mnm-mobile-styles' ),
				/* translators: Sale price in a dropdown option. %p: Sale price. %r: Regular price. */
				'i18n_sale_format' => _x( '%p (was %r)', '[Frontend]', 'wc-mnm-mobile-styles' ),
			)
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
			|| ( isset( $_POST['validation_context'] ) && wc_clean( wp_unslash( $_POST['validation_context'] ) ) === 'edit' ) // phpcs:ignore WordPress.Security.NonceVerification.Missing
		) {
			$button_text = esc_html__( 'Skip to update button', 'wc-mnm-mobile-styles' );
		} else {
			$button_text = esc_html__( 'Skip to add to cart button', 'wc-mnm-mobile-styles' );
		}
		echo '<a href="#wc-mnm-footer-add-to-cart" class="screen-reader-text">' . esc_html( $button_text ) . '</a>';
	}

	/**
	 * Add the footer to a page with a Mix and Match form.
	 */
	public static function attach_hooks() {

		// Accessibility.
		if ( ! has_action( 'wc_mnm_before_child_items', array( __CLASS__, 'add_target_link' ) ) ) {
			add_action( 'wc_mnm_before_child_items', array( __CLASS__, 'add_target_link' ) );
			add_action( 'wc_mnm_after_child_items', array( __CLASS__, 'add_skip_link' ), 101 );
		}

		wp_enqueue_style( 'wc_mnm_mobile' );
		wp_enqueue_script( 'wc_mnm_mobile' );

		// One footer per page, whichever form is in view.
		if ( ! self::$attached ) {
			self::$attached = true;
			add_action( 'wp_footer', array( __CLASS__, 'footer_template' ) );
		}
	}

	/**
	 * Print the footer.
	 *
	 * @since 3.0.0
	 */
	public static function footer_template() {
		wc_get_template(
			'single-product/mnm/mobile-footer.php',
			array(),
			'',
			self::plugin_path() . 'templates/'
		);
	}

	// --------------------------------------------------------------------------
	// Core compat.
	// --------------------------------------------------------------------------

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

	// --------------------------------------------------------------------------
	// Helper Functions.
	// --------------------------------------------------------------------------

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
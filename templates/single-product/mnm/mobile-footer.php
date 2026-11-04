<?php
/**
 * Mix and Match sticky footer
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/mnm/mobile-footer.php.
 *
 * HOWEVER, on occasion WooCommerce Mix and Match will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * NB: The footer is printed once and rendered with the Interactivity API from the Mix and Match container store,
 * for the first form in view. Keep the data-wp-* directives when overriding, they are what fills it in.
 * The buttons deliberately avoid the form's class names (single_add_to_cart_button, mnm_reset) so that
 * scripts bound to those classes don't also fire on the footer.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce Mix and Match Mobile Styles/Templates
 * @since   3.0.0
 * @version 3.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$button_class = wp_theme_get_element_class_name( 'button' );
?>
<div
	id="wc-mnm-mobile-footer"
	class="mnm-mobile-container woocommerce"
	data-wp-interactive="wc-mnm-mobile-styles"
	data-wp-class--is-visible="state.isVisible"
	data-wp-init="callbacks.init"
	data-wp-watch="callbacks.observeForms"
>

	<div
		class="mnm-mobile-content alignwide context-add-to-cart fails_validation"
		data-wp-class--context-add-to-cart="!state.isEditing"
		data-wp-class--context-edit="state.isEditing"
		data-wp-class--passes_validation="state.isValid"
		data-wp-class--fails_validation="!state.isValid"
	>

		<div class="column col-1">

			<div class="wc-mnm-mobile-footer__status" data-wp-bind--hidden="!state.isAvailable">

				<div class="mnm_price wc-mnm-mobile-footer__price" data-wp-watch="callbacks.renderStatus"></div>

				<button type="button" class="wc-mnm-mobile-footer__reset" hidden data-wp-bind--hidden="!state.canReset" data-wp-on--click="actions.reset"><?php echo esc_html_x( 'Clear selections', '[Frontend]', 'wc-mnm-mobile-styles' ); ?></button>

				<label for="wc-mnm-mobile-footer-progress" class="screen-reader-text"><?php echo esc_html_x( 'Container status', '[Frontend]', 'wc-mnm-mobile-styles' ); ?></label>
				<progress
					id="wc-mnm-mobile-footer-progress"
					class="mnm-container-progress wc-mnm-mobile-footer__progress"
					max="1"
					value="0"
					hidden
					data-wp-bind--max="state.progressMax"
					data-wp-bind--value="state.progressValue"
					data-wp-bind--hidden="!state.hasProgress"
				></progress>

				<div class="mnm_message">
					<ul class="msg mnm_message_content wc-mnm-mobile-footer__messages" role="status" aria-live="polite" data-wp-watch="callbacks.renderMessages"></ul>
				</div>

			</div>

			<div class="mnm_availability wc-mnm-mobile-footer__availability" hidden data-wp-bind--hidden="!state.isOutOfStock"><p class="stock out-of-stock"><?php echo esc_html_x( 'Out of stock', '[Frontend]', 'wc-mnm-mobile-styles' ); ?></p></div>

			<div class="mnm_container_unavailable wc-mnm-mobile-footer__unavailable" hidden data-wp-bind--hidden="!state.isUnpurchasable"><?php echo esc_html_x( 'This product is currently unavailable.', '[Frontend]', 'wc-mnm-mobile-styles' ); ?></div>

		</div>

		<div class="column col-2">

			<div class="mnm_button_wrap wc-mnm-mobile-footer__actions" data-wp-bind--hidden="!state.isAvailable">

				<button
					type="button"
					id="wc-mnm-footer-add-to-cart"
					class="wc-mnm-mobile-footer__add-to-cart button alt <?php echo esc_attr( $button_class ); ?>"
					data-wp-bind--disabled="!state.isValid"
					data-wp-class--disabled="!state.isValid"
					data-wp-text="state.buttonText"
					data-wp-on--click="actions.addToCart"
				><?php echo esc_html_x( 'Add to cart', '[Frontend]', 'wc-mnm-mobile-styles' ); ?></button>

				<a href="#wc-mnm-child-items" class="screen-reader-text"><?php echo esc_html_x( 'Return to selections', '[Frontend]', 'wc-mnm-mobile-styles' ); ?></a>

			</div>

		</div>

	</div>

</div>

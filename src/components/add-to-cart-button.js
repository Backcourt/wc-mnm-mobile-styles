/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

export default function AddToCartButton( { addToCartText, container, context, passesValidation } )
{
	if (! container.id ) {
		return null;
	}

	const inStock = !! container.is_in_stock;
	const isPurchasable = !! container.is_purchasable;

	const handleAddToCart = ( event ) => {
		const productId = event.currentTarget.getAttribute('data-form_id');

		const form = document.querySelector(
			`form[data-product_id="${ productId }"]`
		);

		if ( form ) {
			const submitButton = form.querySelector('[type="submit"]');

			// Need to click on submit button to ensure that the 'add-to-cart' value is sent for simple MNM.
			if ( submitButton && ! event.currentTarget.classList.contains('disabled') ) {
				submitButton.click();
			}
		}

	};

	if (! inStock || ! isPurchasable ) {
		return null;
	}

	return (
		<button
			type="button"
			data-form_id={
				container.parent > 0 ? container.parent : container.id
			}
			onClick={ handleAddToCart }
			className={ `single_add_to_cart_button button alt wp-element-button wc-block-components-button ${
				! passesValidation ? 'disabled' : ''
			}` }
		>
		{ addToCartText }
		</button>
	);
}

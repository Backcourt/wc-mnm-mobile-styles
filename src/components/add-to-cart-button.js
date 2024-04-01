/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

export default function AddToCartButton( { container, passesValidation } )
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

    // By default, the store API gets the loop's add to cart text, which we modify to be select options so we need a different text.
    const addToCartText = container?.extensions?.mix_and_match.single_add_to_cart_text ??  _x('Add to cart', '[Frontend]', 'wc-mnm-mobile-styles');

    return (
        <button
            type="button"
            data-form_id={
                container.parent > 0 ? container.parent : container.id
            }
            onClick={ handleAddToCart }
            className={ `single_add_to_cart_button button alt wp-element-button ${
                ! passesValidation ? 'disabled' : ''
            }` }
        >
        { addToCartText }
        </button>
    );
}

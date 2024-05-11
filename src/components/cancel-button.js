/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

export default function CancelButton( { container, context } ) {

	if ('edit' !== context ) {
		return null;
	}

	const onCancelEdit = ( event ) => {
		const productId = event.currentTarget.getAttribute('data-form_id');

		const form = document.querySelector(
			`form[data-product_id="${ productId }"]`
		);

		if ( form ) {
			const cancelButton = form.querySelector('.wc-mnm-cancel-edit');

			// Need to click on cancel button.
			if ( cancelButton ) {
				cancelButton.click();
			}
		}
	};

	return (
		<div className="wc-mnm-edit-subscription-actions woocommerce-cart-form">
			<div className="actions">
				<button
					type="button"
					className="button wc-mnm-cancel-edit wp-element-button wc-block-components-button outlined"
					onClick={ onCancelEdit }
					data-form_id={
						container.parent > 0 ? container.parent : container.id
					}
				>
					{ _x(
						'Cancel edit',
						'[Frontend]',
						'wc-mnm-mobile-styles'
					) }
				</button>
			</div>
		</div>
	);
}

/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

export default function CancelButton( { context } )
{
	if ('edit' !== context ) {
		return null;
	}

	const onCancelEdit = () => {
		console.debug('cancel edit');
	};

	return (
	<div className="wc-mnm-edit-subscription-actions woocommerce-cart-form">
	<div className="actions">
				<button
					type="button"
					className="button wc-mnm-cancel-edit wp-element-button"
					onClick={ onCancelEdit }
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

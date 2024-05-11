/**
 * External dependencies
 */
import { _nx, _x, sprintf } from '@wordpress/i18n';

export default function StatusCounter( {
    maxContainerSize,
    totalQuantity,
    totalPrice,
    } 
) {
    if (! maxContainerSize ) {
        maxContainerSize = _x(
            '∞',
            '[Frontend] - Infinity symbol',
            'wc-mnm-mobile-styles'
        );
    }

    // NB: Woo's utility doesn't use floats so we need to mutiply by 100 to get the correct price.
    // @todo - totalPrice.regular_price vs totalPrice.price AND totalPrice.price_incl_tax vs totalPrice.price_excl_tax
    const formattedPrice = wc.priceFormat.formatPrice(totalPrice.price);

    return (
        <span className="mnm_counter">
                { sprintf(
                    _nx(
                        '(%1$s/%2$s) item',
                        '(%1$s/%2$s) items',
                        totalQuantity, // Number to check for plural
                        '[Frontend] Formatted total ex (2/8). %1$s is the current total and %2$s is the container maximum.',
                        'wc-mnm-mobile-styles'
                    ),
                    totalQuantity,
                    maxContainerSize
                ) }
        </span>
    );
}

/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ProductPrice from './product-price';
import ProgressBar from './progress-bar';
import ResetButton from './reset-button';
import StatusCounter from './status-counter';
import StatusMessage from './status-message';
import StockStatus from './stock-status';

export default function StatusUI( props )
{
    const {
        container,
        maxContainerSize,
        messages,
        minContainerSize,
        passesValidation,
        totalPrice,
        totalQuantity,
    } = props;

    if (! container.id ) {
        return null;
    }

    if (! container.is_in_stock || ! container.is_purchasable ) {
        return <StockStatus product={ container } />;
    }

    return (
    <>
        <div className="mnm_price">
            <ProductPrice totalPrice={ totalPrice } />
            <StatusCounter
                maxContainerSize={ maxContainerSize }
                totalPrice={ totalPrice }
                totalQuantity={ totalQuantity }
            />
        </div>

        <ResetButton
            container={ container }
            totalQuantity={ totalQuantity }
        />

        <ProgressBar
            minContainerSize={ minContainerSize }
            maxContainerSize={ maxContainerSize }
            totalQuantity={ totalQuantity }
        />

        <StatusMessage messages={ passesValidation ? messages.status : messages.errors } />

    </>
    );
}

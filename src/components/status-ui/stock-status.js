/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Get stock text based on stock. For example:
 * - In stock
 * - Out of stock
 * - Available on backorder
 * - 2 left in stock
 *
 * @see https://github.com/woocommerce/woocommerce/blob/a435f5cafac7c20a67ff08ecf13c1a9274f76f21/plugins/woocommerce-blocks/assets/js/atomic/blocks/product-elements/stock-indicator/block.tsx#L19C1-L57C3
 *
 * @param  stockInfo                Object containing stock information.
 * @param  stockInfo.isInStock      Whether product is in stock.
 * @param  stockInfo.isLowStock     Whether product is low in stock.
 * @param  stockInfo.lowStockAmount Number of items left in stock.
 * @param  stockInfo.isOnBackorder  Whether product is on backorder.
 * @return string Stock text.
 */
const getTextBasedOnStock = ( {
    isInStock = false,
    isLowStock = false,
    lowStockAmount = null,
    isOnBackorder = false,
} ) => {
    if (isLowStock && lowStockAmount !== null ) {
        return sprintf(
        /* translators: %d stock amount (number of items in stock for product) */
            __('%d left in stock', 'woocommerce'),
            lowStockAmount
        );
    } else if (isOnBackorder ) {
        return __('Available on backorder', 'woocommerce');
    } else if (isInStock ) {
        // Leaving this here for posterity, but in our current use case we don't show text in the footer if it's IN stock.
        return null;
        // return __( 'In stock', 'woocommerce' );
    }
    return __('Out of stock', 'woocommerce');
};

export default function StockStatus( { product } )
{
    const inStock = !! product.is_in_stock;
    const lowStock = product.low_stock_remaining;
    const isBackordered = product.is_on_backorder;

    return (
    <div
    className={ classnames(
        'mnm_availability mnm-mobile-container__stock-status',
        {
            'wc-block-components-product-stock-indicator--in-stock':
            inStock,
            'wc-block-components-product-stock-indicator--out-of-stock':
            ! inStock,
            'wc-block-components-product-stock-indicator--low-stock':
            !! lowStock,
            'wc-block-components-product-stock-indicator--available-on-backorder':
            !! isBackordered,
        }
    ) }
    >
    { getTextBasedOnStock(
        {
            isInStock: inStock,
            isLowStock: !! lowStock,
            lowStockAmount: lowStock,
            isOnBackorder: isBackordered,
        } 
    ) }
    </div>
    );
}

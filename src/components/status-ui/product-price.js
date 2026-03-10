const ProductPrice = ( { container, totalPrice } ) => {

    // Use raw prices with wc.priceFormat.
    const price = container?.display_price ?? totalPrice?.price;
    const regularPrice = container?.display_regular_price ?? totalPrice?.regular_price;

    if ( price === undefined || price === null ) {
        return null;
    }

    // Generate a strikethrough for sale price.
    if ( regularPrice && regularPrice !== price ) {
        return (
            <span className="price">
                <del aria-hidden="true">
                    <span className="woocommerce-Price-amount amount">
                        <bdi>{ wc.priceFormat.formatPrice( regularPrice ) }</bdi>
                    </span>
                </del>
                <ins>
                    <span className="woocommerce-Price-amount amount">
                        <bdi>{ wc.priceFormat.formatPrice( price ) }</bdi>
                    </span>
                </ins>
            </span>
        );
    }

    return (
        <span className="price">
            <span className="woocommerce-Price-amount amount">
                <bdi>{ wc.priceFormat.formatPrice( price ) }</bdi>
            </span>
        </span>
    );
};

export default ProductPrice;

/**
    // TODO - should be an import, e.g.
    // import { FormattedMonetaryAmount } from '@woocommerce/blocks-components'; // eslint-disable-line import/no-unresolved
    // See: https://github.com/woocommerce/woocommerce/issues/42956
//    const { FormattedMonetaryAmount } = window.wc.blocksComponents;
    
 //   import getCurrencyObject from '@components/utils';

const ProductPrice = ( {totalPrice }) => {

    const currency = getCurrencyObject();

    // Generate a strikethrough for sale price.
    if (totalPrice.regular_price !== totalPrice.price) {
        return (
            <span className="price">
                <del aria-hidden="true">
                    <span className="woocommerce-Price-amount amount">
                        <bdi>
                        <FormattedMonetaryAmount
                                    currency={ currency }
                                    displayType="text"
                                    value={ totalPrice.regular_price * 100 }
                                />
                        </bdi>    
                    </span>
                </del>
                <ins>
                    <span className="woocommerce-Price-amount amount">
                        <bdi>
                            <FormattedMonetaryAmount
                                    currency={ currency }
                                    displayType="text"
                                    value={ totalPrice.price * 100 }
                                />
                        </bdi>
                    </span>
                </ins>
            </span>
        );
    }

    return (
        <span className="price">
            <span className="woocommerce-Price-amount amount">
                <bdi>
                    <FormattedMonetaryAmount
                                    currency={ currency }
                                    displayType="text"
                                    value={ totalPrice.price * 100 }
                                />
                    </bdi>
            </span>
        </span>
    );
};

export default ProductPrice;
 */

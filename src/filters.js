/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { Fill } from '@wordpress/components';

/**
 * Add anchor links to the child items section for better accessibility.
 * Variable MNM is a react app so we need to use SlotFills.
 */
function anchorLinks( props )
{
    return ( props ) => (
    <>
    <Fill name="beforeChildItems">
                <div id="wc-mnm-child-items" className="screen-reader-text" />
    </Fill>
    <Fill name="afterChildItems">
                { ( context ) => {
                    const button_text =
                    'edit' === context
                    ? _x(
                        'Skip to update button',
                        '[Frontend]',
                        'wc-mnm-mobile-styles'
                    )
                            : _x(
                                'Skip to add to cart button',
                                '[Frontend]',
                                'wc-mnm-mobile-styles'
                            );
                    return (
                        <a
                            href="#wc-mnm-footer-add-to-cart"
                            className="screen-reader-text"
                        >
                            { button_text }
                        </a>
                    );
                    } }
    </Fill>
    </>
    );
}

addFilter(
    'wcMNM.ChildItems',
    'wc-mix-and-match-products/child-items',
    anchorLinks
);

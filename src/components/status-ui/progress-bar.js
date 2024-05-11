/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

export default function ProgressBar( {
    minContainerSize,
    maxContainerSize,
    totalQuantity,
    } 
) {
    if (minContainerSize !== maxContainerSize ) {
        return null;
    }

    return (
    <>
    <label
                htmlFor="mnm-container-progress"
                className="screen-reader-text"
    >
                { _x(
                    'Container status',
                    '[Frontend]',
                    'wc-mnm-mobile-styles'
                ) }
    </label>
    <progress
                id="mnm-container-progress"
                className="mnm-container-progress"
                max={ maxContainerSize }
                value={ totalQuantity }
    ></progress>
    </>
    );
}

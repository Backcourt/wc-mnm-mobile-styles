/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';
import MobileFooter from './mobile-footer';

const target = document.getElementById('wc-mnm-status-ui-root');

if (target ) {
    createRoot(target).render(<MobileFooter />);
}

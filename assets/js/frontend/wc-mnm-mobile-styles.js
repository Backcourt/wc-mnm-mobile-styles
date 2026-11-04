/**
 * Mix and Match sticky footer.
 *
 * Shows the status of the add to cart form in view: price, counter, progress, messages and buttons.
 * Everything it shows comes from the Mix and Match container store, and its buttons call the store's
 * actions, so the form's own scripts still do the work.
 *
 * @package WooCommerce Mix and Match Mobile Styles/Scripts
 * @since   3.0.0
 */

/* jshint esversion: 11, module: true */

import { store, getElement } from '@wordpress/interactivity';
import '@wc-mix-and-match/container';

const NAMESPACE = 'wc-mnm-mobile-styles';

/**
 * Body and form class. Lets the stylesheet hide the form's own status and buttons, and leave room for the footer.
 */
const ACTIVE_CLASS = 'wc-mnm-has-mobile-footer';

const { state: mnm, actions: mnmActions } = store( 'wc-mix-and-match/container' );

/**
 * Forms being watched, keyed by container ID. Not reactive on purpose.
 *
 * @type {Map<number, Element>}
 */
const forms = new Map();

/**
 * Watches which forms are in the viewport.
 *
 * @type {IntersectionObserver|null}
 */
let observer = null;

/**
 * Find a container's form.
 *
 * @param {number} id Container ID.
 * @return {Element|null} The form.
 */
const findForm = ( id ) => {
	const data = document.querySelector( `.mnm_data[data-container_id="${ id }"]` );
	return data ? data.closest( '.mnm_form' ) : null;
};

/**
 * Set an element's HTML. Only touches it when the HTML changes, so live regions aren't announced again.
 *
 * @param {Element} el   Element.
 * @param {string}  html HTML.
 */
const setHtml = ( el, html ) => {
	if ( el.innerHTML !== html ) {
		el.innerHTML = html;
	}
};

const { state } = store( NAMESPACE, {
	state: {
		/**
		 * Whether each container's form is in view, keyed by container ID.
		 *
		 * @type {Object<number, boolean>}
		 */
		inView: {},

		/**
		 * The first purchasable container in view, in document order.
		 *
		 * @return {number|null} Container ID.
		 */
		get activeId() {
			return (
				mnm.ids.find( ( id ) => state.inView[ id ] && mnm.containers[ id ] && mnm.containers[ id ].isPurchasable ) ?? null
			);
		},

		/**
		 * The container the footer shows.
		 *
		 * @return {Object|null} Container state.
		 */
		get container() {
			return null === state.activeId ? null : mnm.containers[ state.activeId ];
		},

		get isVisible() {
			return !! state.container;
		},

		get isAvailable() {
			return !! state.container && state.container.isPurchasable && state.container.isInStock;
		},

		get isOutOfStock() {
			return !! state.container && state.container.isPurchasable && ! state.container.isInStock;
		},

		get isUnpurchasable() {
			return !! state.container && ! state.container.isPurchasable;
		},

		get isEditing() {
			return !! state.container && 'edit' === state.container.context;
		},

		get isValid() {
			return !! state.container && state.container.isValid;
		},

		get canReset() {
			return !! state.container && state.container.canReset;
		},

		/**
		 * The container's own limits, in its validation mode's unit, ex: quantity or weight.
		 *
		 * @return {Object|null} { min, max }
		 */
		get rule() {
			const container = state.container;

			if ( ! container ) {
				return null;
			}

			return container.validationRules[ 0 ] || null;
		},

		/**
		 * Progress needs a maximum to fill towards, which can change with the package.
		 */
		get hasProgress() {
			return !! state.rule && state.rule.max > 0;
		},

		get progressMax() {
			return state.hasProgress ? state.rule.max : 1;
		},

		get progressValue() {
			if ( ! state.hasProgress ) {
				return 0;
			}

			return Math.min( state.container.selected[ state.container.validationMode ] || 0, state.rule.max );
		},

		get buttonText() {
			return state.isEditing ? state.i18n.update : state.i18n.addToCart;
		},

		/**
		 * Strings from PHP.
		 */
		i18n: {
			addToCart: 'Add to cart',
			update: 'Update',
		},
	},

	actions: {
		addToCart() {
			if ( state.isValid ) {
				mnmActions.addToCart( state.activeId );
			}
		},

		reset() {
			if ( state.canReset ) {
				mnmActions.reset( state.activeId );
			}
		},
	},

	callbacks: {
		/**
		 * Watch forms coming into view, and keep room for the footer at the end of the page.
		 */
		init() {
			const { ref } = getElement();

			if ( 'IntersectionObserver' in window ) {
				observer = new window.IntersectionObserver( ( entries ) => {
					entries.forEach( ( entry ) => {
						state.inView[ entry.target.wcMnmMobileFooterId ] = entry.isIntersecting;
					} );
				} );
			}

			const setHeight = () => document.documentElement.style.setProperty( '--wc-mnm-mobile-footer-height', ref.offsetHeight + 'px' );

			if ( 'ResizeObserver' in window ) {
				new window.ResizeObserver( setHeight ).observe( ref );
			} else {
				setHeight();
			}
		},

		/**
		 * Start watching the forms of containers that are new to the store, ex: an ajax loaded edit form.
		 */
		observeForms() {
			const ids = mnm.ids;

			// Forget forms that are gone, or have been replaced.
			forms.forEach( ( form, id ) => {
				if ( ! ids.includes( id ) || ! form.isConnected ) {
					if ( observer ) {
						observer.unobserve( form );
					}
					forms.delete( id );
					delete state.inView[ id ];
				}
			} );

			ids.forEach( ( id ) => {
				const form = findForm( id );

				if ( ! form || forms.get( id ) === form ) {
					return;
				}

				forms.set( id, form );
				form.wcMnmMobileFooterId = id;
				form.classList.add( ACTIVE_CLASS );
				document.body.classList.add( ACTIVE_CLASS );

				if ( observer ) {
					observer.observe( form );
				} else {
					state.inView[ id ] = true;
				}
			} );
		},

		/**
		 * The same price and counter as the form's, ex: "Total: $20.00 (2/4 items)". Built as HTML by the container script.
		 */
		renderStatus() {
			const { ref } = getElement();
			setHtml( ref, state.isAvailable ? state.container.statusHtml : '' );
		},

		/**
		 * Validation messages when the container is invalid, status messages otherwise. Built as HTML from the container script's strings.
		 */
		renderMessages() {
			const { ref }   = getElement();
			const container = state.container;
			const messages  = container ? ( container.isValid ? container.messages.status : container.messages.errors ) : [];

			setHtml( ref, messages.map( ( message ) => `<li>${ message }</li>` ).join( '' ) );
		},
	},
} );

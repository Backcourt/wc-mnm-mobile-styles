/**
 * Mix and Match sticky footer: subscription plans.
 *
 * Shows the All Products for Subscriptions plan choice next to the footer's add to cart button.
 *
 * Stopgap: the container store doesn't have plans, and Subscriptions doesn't have a store of its own yet, so
 * this reads the form's plan controls and sets them as a shopper would. Delete this module once
 * Subscriptions provides the plans, and point the footer at that instead.
 *
 * Every layout keeps the chosen plan in a convert_to_sub_{id} radio group, hidden or not. One-time plus one
 * plan shows as a toggle, more plans as a dropdown.
 *
 * @package WooCommerce Mix and Match Mobile Styles/Scripts
 * @since   3.0.0
 */

/* jshint esversion: 11, module: true */

import { store, getElement } from '@wordpress/interactivity';
import '@wc-mix-and-match/container';
import 'wc-mnm-mobile-styles';

const PLANS = '.wcsatt-options-wrapper';

/**
 * Tags kept when copying a plan label as HTML: sale prices and the price suffix.
 */
const LABEL_TAGS = { DEL: 'del', INS: 'ins', SMALL: 'small' };

/**
 * APFS animates its controls in and out, so read again once that is done.
 */
const SETTLE = 450;

const { state: mnm } = store( 'wc-mix-and-match/container' );
const { state: footer } = store( 'wc-mnm-mobile-styles' );

let settleTimer = null;

/**
 * Find a container's plan controls.
 *
 * @param {number|null} id Container ID.
 * @return {Element|null} The plans wrapper.
 */
const findPlans = ( id ) => {
	const data = null === id ? null : document.querySelector( `.mnm_data[data-container_id="${ id }"]` );
	const form = data ? data.closest( '.mnm_form' ) : null;
	return form ? form.querySelector( PLANS ) : null;
};

/**
 * Collapse an element's text.
 *
 * @param {Element|null} el Element.
 * @return {string} Text.
 */
const textOf = ( el ) => ( el ? el.textContent.replace( /\s+/g, ' ' ).trim() : '' );

/**
 * Upper case the first letter, ex: APFS' "one time".
 *
 * @param {string} text Text.
 * @return {string} Text.
 */
const capitalise = ( text ) => {
	const first = text.charAt( 0 );
	return first && first !== first.toLocaleUpperCase() ? first.toLocaleUpperCase() + text.slice( 1 ) : text;
};

/**
 * Escape text for HTML.
 *
 * @param {string} text Text.
 * @return {string} HTML.
 */
const escapeHtml = ( text ) => {
	const span = document.createElement( 'span' );
	span.textContent = text;
	return span.innerHTML;
};

/**
 * Copy a plan label as HTML, keeping only sale price and suffix markup. Everything else becomes escaped text.
 *
 * @param {Element} el The label.
 * @return {string} HTML.
 */
const labelHtml = ( el ) => {
	let html = '';

	el.childNodes.forEach( ( node ) => {
		if ( Node.TEXT_NODE === node.nodeType ) {
			html += escapeHtml( node.textContent );
		} else if ( Node.ELEMENT_NODE === node.nodeType && ! node.matches( 'input, script, style, template' ) ) {
			const tag = LABEL_TAGS[ node.tagName ];
			html += tag ? `<${ tag }>${ labelHtml( node ) }</${ tag }>` : labelHtml( node );
		}
	} );

	return html.replace( /\s+/g, ' ' ).trim();
};

/**
 * Copy a plan label as text, for a dropdown option, which can't show a strikethrough. A sale price is
 * written out with the sale format instead, ex: "$22.50 (was $25.00)".
 *
 * @param {Element} el         The label.
 * @param {string}  saleFormat %p is the price, %r the regular price.
 * @return {string} Text.
 */
const labelText = ( el, saleFormat ) => {
	const clone = el.cloneNode( true );

	clone.querySelectorAll( 'input, script, style, template' ).forEach( ( child ) => child.remove() );

	clone.querySelectorAll( 'del' ).forEach( ( del ) => {
		const ins = del.nextElementSibling;

		if ( ins && 'INS' === ins.tagName ) {
			ins.replaceWith( document.createTextNode( saleFormat.replace( '%p', textOf( ins ) ).replace( '%r', textOf( del ) ) ) );
			del.remove();
		}
	} );

	return capitalise( textOf( clone ) );
};

/**
 * APFS' own sale format, so the footer words it the same as its dropdown.
 *
 * @param {Element} wrapper The plans wrapper.
 * @return {string} %p is the price, %r the regular price.
 */
const getSaleFormat = ( wrapper ) => {
	for ( const input of wrapper.querySelectorAll( 'input[data-custom_data]' ) ) {
		try {
			const data = JSON.parse( input.getAttribute( 'data-custom_data' ) );

			if ( data && data.dropdown_sale_format ) {
				return data.dropdown_sale_format;
			}
		} catch ( e ) {
			// Not JSON, keep looking.
		}
	}

	return state.i18n.saleFormat;
};

/**
 * Read the plans in a form.
 *
 * Labels come from what shoppers see: the prompt's "One-time purchase" and the delivery dropdown's
 * "Every month", falling back to the radio's own label.
 *
 * @param {Element|null} wrapper The plans wrapper.
 * @return {Object|null} { name, type: 'toggle'|'select', options: [ { value, label, html, isSelected } ] }, or null when there's no choice.
 */
const readPlans = ( wrapper ) => {
	// Not shown, ex: the product's plans are turned off.
	if ( ! wrapper || ! wrapper.getClientRects().length ) {
		return null;
	}

	const radios = [ ...wrapper.querySelectorAll( 'input[type="radio"][name^="convert_to_sub_"]' ) ];

	if ( radios.length < 2 ) {
		return null;
	}

	const dropdown   = wrapper.querySelector( 'select.wcsatt-options-product-dropdown' );
	const oneTime    = wrapper.querySelector( '.wcsatt-options-prompt-label-one-time' );
	const saleFormat = getSaleFormat( wrapper );

	const options = radios.map( ( radio ) => {
		const label  = radio.closest( 'label' );
		const option = dropdown ? [ ...dropdown.options ].find( ( item ) => item.value === radio.value ) : null;
		const shown  = capitalise( '0' === radio.value ? textOf( oneTime ) : textOf( option ) );

		return {
			value: radio.value,
			label: shown || ( label ? labelText( label, saleFormat ) : '' ) || radio.value,
			html: label ? capitalise( labelHtml( label ) ) : escapeHtml( shown || radio.value ),
			isSelected: radio.checked,
		};
	} );

	return {
		name: radios[ 0 ].name,
		type: 2 === options.length ? 'toggle' : 'select',
		options,
	};
};

const { state, actions } = store( 'wc-mnm-mobile-styles/plans', {
	state: {
		/**
		 * Bumped when the form's plan controls may have changed, so the plans are read again.
		 *
		 * @type {number}
		 */
		version: 0,

		/**
		 * The plans of the container the footer shows.
		 *
		 * @return {Object|null} See readPlans().
		 */
		get plans() {
			const id        = footer.activeId;
			const container = null === id ? null : mnm.containers[ id ];

			// Read again when the plan controls change, or the container does: APFS updates its prices with it.
			void state.version; // jshint ignore:line
			void ( container && container.statusHtml ); // jshint ignore:line

			return container && container.isPurchasable && container.isInStock ? readPlans( findPlans( id ) ) : null;
		},

		get hasPlans() {
			return !! state.plans;
		},

		/**
		 * Strings from PHP.
		 */
		i18n: {
			plans: 'Purchase options',
			saleFormat: '%p (was %r)',
		},
	},

	actions: {
		/**
		 * Choose a plan in the form, the way a shopper would, so APFS keeps its layout in step.
		 *
		 * @param {string} value The convert_to_sub_{id} value, '0' for one-time.
		 */
		setPlan( value ) {
			const wrapper = findPlans( footer.activeId );
			const plans   = state.plans;

			if ( ! wrapper || ! plans ) {
				return;
			}

			// "One-time purchase" / "Subscribe" prompt first, it shows or hides the plans.
			const prompt = wrapper.querySelector( `.wcsatt-options-prompt-action-input[value="${ '0' === value ? 'no' : 'yes' }"]` );

			if ( prompt && ! prompt.checked ) {
				prompt.click();
			}

			const dropdown = wrapper.querySelector( 'select.wcsatt-options-product-dropdown' );
			const radio    = [ ...wrapper.querySelectorAll( 'input[type="radio"]' ) ].find( ( item ) => item.name === plans.name && item.value === value );

			if ( '0' !== value && dropdown && [ ...dropdown.options ].some( ( option ) => option.value === value ) ) {
				if ( dropdown.value !== value ) {
					dropdown.value = value;
					// A native event reaches APFS' jQuery handlers too.
					dropdown.dispatchEvent( new Event( 'change', { bubbles: true } ) );
				}
			} else if ( radio && ! radio.checked ) {
				radio.click();
			}

			actions.refresh();
		},

		/**
		 * Read the plans now, and again once APFS has finished animating.
		 */
		refresh() {
			state.version++;

			window.clearTimeout( settleTimer );
			settleTimer = window.setTimeout( () => state.version++, SETTLE );
		},

		/**
		 * The footer's toggle.
		 *
		 * @param {Event} event Click.
		 */
		onClick( event ) {
			const button = event.target.closest( 'button[data-value]' );

			if ( button ) {
				actions.setPlan( button.getAttribute( 'data-value' ) );
			}
		},

		/**
		 * The footer's dropdown.
		 *
		 * @param {Event} event Change.
		 */
		onChange( event ) {
			if ( 'SELECT' === event.target.tagName ) {
				actions.setPlan( event.target.value );
			}
		},
	},

	callbacks: {
		/**
		 * Read again when a shopper changes a plan in the form.
		 */
		init() {
			const onChange = ( event ) => {
				const wrapper = findPlans( footer.activeId );

				if ( wrapper && wrapper.contains( event.target ) ) {
					actions.refresh();
				}
			};

			// APFS changes its own inputs with jQuery's trigger(), which native listeners don't hear. jQuery handlers hear both.
			if ( window.jQuery ) {
				window.jQuery( document ).on( 'change.wc-mnm-mobile-plans', PLANS + ' :input', onChange );
			} else {
				document.addEventListener( 'change', onChange );
			}
		},

		/**
		 * Build the footer's plan control. Only rebuilt when the plans change, and focus is given back.
		 */
		render() {
			const { ref } = getElement();
			const plans   = state.plans;
			const json    = JSON.stringify( plans );

			if ( json === ref.wcMnmPlansJson ) {
				return;
			}

			ref.wcMnmPlansJson = json;

			const focused = ref.contains( document.activeElement ) ? document.activeElement : null;
			const restore = focused ? focused.getAttribute( 'data-value' ) || 'select' : null;

			ref.replaceChildren();

			if ( ! plans ) {
				return;
			}

			if ( 'select' === plans.type ) {
				const select = document.createElement( 'select' );
				select.setAttribute( 'aria-label', state.i18n.plans );
				plans.options.forEach( ( option ) => select.add( new Option( option.label, option.value, false, option.isSelected ) ) );

				const wrap = document.createElement( 'div' );
				wrap.className = 'wc-mnm-mobile-footer__plan wc-mnm-mobile-footer__plan--select';
				wrap.append( select );
				ref.append( wrap );
			} else {
				const group = document.createElement( 'div' );
				group.className = 'wc-mnm-mobile-footer__plan wc-mnm-mobile-footer__plan--radio';
				group.setAttribute( 'role', 'radiogroup' );
				group.setAttribute( 'aria-label', state.i18n.plans );

				plans.options.forEach( ( option ) => {
					const button = document.createElement( 'button' );
					button.type      = 'button';
					button.className = 'wc-mnm-mobile-footer__plan-option';
					button.setAttribute( 'role', 'radio' );
					button.setAttribute( 'aria-checked', option.isSelected ? 'true' : 'false' );
					button.setAttribute( 'data-value', option.value );
					button.innerHTML = option.html; // Escaped text and del, ins and small tags only, see labelHtml().
					group.append( button );
				} );

				ref.append( group );
			}

			if ( restore ) {
				const target = 'select' === restore ? ref.querySelector( 'select' ) : ref.querySelector( `button[data-value="${ CSS.escape( restore ) }"]` );

				if ( target ) {
					target.focus();
				}
			}
		},
	},
} );

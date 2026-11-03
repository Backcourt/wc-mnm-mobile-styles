/**
 * Mix and Match sticky footer.
 *
 * Shows the status of the add to cart form in view: price, counter, progress, messages and buttons.
 * The footer's buttons click the form's own, so the form's scripts still do the work.
 *
 * @package WooCommerce Mix and Match Mobile Styles/Scripts
 * @since   3.0.0
 */

/* global jQuery, wc_mnm_params */

( function( $, window, document ) {
	'use strict';

	/**
	 * The sticky footer. There is one, for the first purchasable container in view.
	 */
	var footer = {

		/**
		 * Containers with a form on the page, in the order they were initialized.
		 *
		 * @type {Array}
		 */
		containers: [],

		/**
		 * The container the footer shows.
		 *
		 * @type {Object|null}
		 */
		active: null,

		/**
		 * Watches which forms are in the viewport.
		 *
		 * @type {IntersectionObserver|null}
		 */
		observer: null,

		/**
		 * Find the footer's elements and attach its event handlers.
		 *
		 * @return {boolean} False when the footer isn't on the page.
		 */
		init: function() {

			footer.$el = $( '#wc-mnm-mobile-footer' );

			if ( ! footer.$el.length ) {
				return false;
			}

			footer.$content      = footer.$el.find( '.mnm-mobile-content' );
			footer.$status       = footer.$el.find( '.wc-mnm-mobile-footer__status' );
			footer.$price        = footer.$el.find( '.wc-mnm-mobile-footer__price' );
			footer.$reset        = footer.$el.find( '.wc-mnm-mobile-footer__reset' );
			footer.$progress     = footer.$el.find( '.wc-mnm-mobile-footer__progress' );
			footer.$messages     = footer.$el.find( '.wc-mnm-mobile-footer__messages' );
			footer.$availability = footer.$el.find( '.wc-mnm-mobile-footer__availability' );
			footer.$unavailable  = footer.$el.find( '.wc-mnm-mobile-footer__unavailable' );
			footer.$actions      = footer.$el.find( '.wc-mnm-mobile-footer__actions' );
			footer.$button       = footer.$el.find( '.wc-mnm-mobile-footer__add-to-cart' );
			footer.$cancel       = footer.$el.find( '.wc-mnm-mobile-footer__cancel' );

			// Footer buttons.
			footer.$button.on( 'click', footer.addToCart );
			footer.$reset.on( 'click', footer.reset );
			footer.$cancel.on( 'click', footer.cancel );

			// Form events. They bubble up from each form.
			$( document )
				.on( 'wc-mnm-initializing', '.mnm_form', footer.onInitializing )
				.on( 'wc-mnm-initialized', '.mnm_form', footer.onInitialized )
				.on( 'wc-mnm-form-updated', '.mnm_form', footer.onFormUpdated )
				.on( 'wc-mnm-container-quantities-updated', '.mnm_form', footer.onQuantitiesUpdated )
				.on( 'wc-mnm-package-changed', '.mnm_form', footer.onPackageChanged );

			// Clear the loading state when an ajax add to cart is done, or the page comes back from the browser's cache.
			$( document.body ).on( 'added_to_cart ajax_request_not_sent.adding_to_cart', footer.stopLoading );
			$( window ).on( 'pageshow', footer.stopLoading );

			// Keep room for the footer at the bottom of the page.
			$( window ).on( 'resize', footer.debounce( footer.setHeight, 200 ) );

			if ( 'IntersectionObserver' in window ) {
				footer.observer = new window.IntersectionObserver( footer.onIntersect );
			}

			// Forms initialized before this script ran.
			$.each( window.wc_mnm_scripts || {}, function( id, container ) {
				footer.register( container );
			} );

			footer.update();

			return true;
		},

		/*-----------------------------------------------------------------*/
		/*  Containers.                                                    */
		/*-----------------------------------------------------------------*/

		/**
		 * Start showing a container's form in the footer.
		 *
		 * @param {Object} container The form's script object.
		 */
		register: function( container ) {

			var form = container.$mnm_form.get( 0 );

			// Forget forms that are gone, or are being initialized again, ex: after an ajax reload of the edit form.
			footer.containers = footer.containers.filter( function( item ) {

				var keep = item.$mnm_form.get( 0 ) !== form && document.body.contains( item.$mnm_form.get( 0 ) );

				if ( ! keep && footer.observer ) {
					footer.observer.unobserve( item.$mnm_form.get( 0 ) );
				}

				return keep;
			} );

			footer.containers.push( container );

			// Lets the stylesheet hide the form's own status and buttons while the footer stands in for them.
			container.$mnm_form.addClass( 'wc-mnm-has-mobile-footer' );
			$( document.body ).addClass( 'wc-mnm-has-mobile-footer' );

			if ( footer.observer ) {
				form.wcMnmMobileFooterInView = false;
				footer.observer.observe( form );
			} else {
				form.wcMnmMobileFooterInView = true;
			}
		},

		/**
		 * The first purchasable container in view, in document order.
		 *
		 * @return {Object|null} Container.
		 */
		getActive: function() {

			var candidates = footer.containers.filter( function( container ) {
				return container.$mnm_form.get( 0 ).wcMnmMobileFooterInView && container.is_initialized && container.api.is_purchasable();
			} );

			candidates.sort( function( a, b ) {
				// eslint-disable-next-line no-bitwise
				return a.$mnm_form.get( 0 ).compareDocumentPosition( b.$mnm_form.get( 0 ) ) & window.Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
			} );

			return candidates.length ? candidates[ 0 ] : null;
		},

		/**
		 * Choose the container to show, then show or hide the footer.
		 */
		update: function() {

			var active = footer.getActive();

			if ( active ) {
				footer.active = active;
				footer.render( active );
			}

			footer.$el.toggleClass( 'is-visible', !! active );
			footer.setHeight();
		},

		/*-----------------------------------------------------------------*/
		/*  Rendering.                                                     */
		/*-----------------------------------------------------------------*/

		/**
		 * Show everything about a container.
		 *
		 * @param {Object} container
		 */
		render: function( container ) {

			var in_stock = container.api.is_purchasable() && container.api.is_in_stock(),
				context  = container.validation_context || container.$mnm_form.data( 'validation_context' ) || 'add-to-cart',
				availability;

			footer.$content
				.removeClass( function( index, className ) {
					return ( className.match( /(^|\s)context-\S+/g ) || [] ).join( ' ' );
				} )
				.addClass( 'context-' + context );

			footer.$status.prop( 'hidden', ! in_stock );
			footer.$actions.prop( 'hidden', ! in_stock );
			footer.$unavailable.prop( 'hidden', container.api.is_purchasable() );

			// Out of stock: the form's own availability message, ex: "Out of stock".
			availability = in_stock ? '' : $.trim( container.$mnm_data.find( '.mnm_availability' ).html() || '' );
			footer.$availability.html( availability ).prop( 'hidden', '' === availability );

			if ( ! in_stock ) {
				return;
			}

			footer.renderStatus( container );
			footer.renderMessages( container );
			footer.renderButtons( container, context );
		},

		/**
		 * Price, counter, progress and the reset button.
		 *
		 * @param {Object} container
		 */
		renderStatus: function( container ) {

			// The same price and counter string as the form's, ex: "Total: $20.00 (2/4 items)". Built as HTML by the container script.
			footer.$price.html( container.get_status_html() );

			footer.renderQuantity( container );
		},

		/**
		 * Progress and the reset button, which only depend on the quantity.
		 *
		 * @param {Object} container
		 */
		renderQuantity: function( container ) {

			var total = container.api.get_container_size(),
				max   = container.api.get_max_container_size();

			// Progress towards the maximum, which changes with the package.
			if ( max > 0 ) {
				footer.$progress.attr( 'max', max ).val( Math.min( total, max ) ).prop( 'hidden', false );
			} else {
				footer.$progress.prop( 'hidden', true );
			}

			footer.$reset.prop( 'hidden', total <= 0 );
		},

		/**
		 * Validation messages when the container is invalid, status messages otherwise.
		 *
		 * @param {Object} container
		 */
		renderMessages: function( container ) {

			var passes   = container.passes_validation(),
				messages = passes ? container.api.get_status_messages() : container.api.get_validation_messages(),
				html     = $.map( messages, function( message ) {
					// Messages are built as HTML from the container script's strings, same as the form's.
					return '<li>' + message + '</li>';
				} ).join( '' );

			// Only touch the live region when the text changes, so screen readers don't repeat it.
			if ( footer.$messages.html() !== html ) {
				footer.$messages.html( html );
			}

			footer.$content
				.toggleClass( 'passes_validation', passes )
				.toggleClass( 'fails_validation', ! passes );
		},

		/**
		 * Add to cart and cancel edit buttons.
		 *
		 * @param {Object} container
		 * @param {string} context   'add-to-cart' | 'edit'
		 */
		renderButtons: function( container, context ) {

			var passes = container.passes_validation(),
				text   = $.trim( container.$mnm_button.first().text() );

			// The form's own text, ex: "Update subscription" when editing, or a subscription plan's "Sign up now".
			if ( text && footer.$button.text() !== text ) {
				footer.$button.text( text );
			}

			footer.$button
				.prop( 'disabled', ! passes )
				.toggleClass( 'disabled', ! passes );

			footer.$cancel.prop( 'hidden', ! ( 'edit' === context && footer.getCancelLink( container ).length ) );
		},

		/*-----------------------------------------------------------------*/
		/*  Form events.                                                   */
		/*-----------------------------------------------------------------*/

		onInitializing: function( event, container ) {
			if ( footer.isMine( event, container ) ) {
				footer.register( container );
			}
		},

		onInitialized: function( event, container ) {
			if ( footer.isMine( event, container ) ) {
				footer.update();
			}
		},

		onFormUpdated: function( event, container ) {
			if ( footer.isMine( event, container ) && container === footer.active ) {
				footer.render( container );
				footer.setHeight();
			}
		},

		/**
		 * Quantities change before the container is validated, so only the counts are shown here.
		 */
		onQuantitiesUpdated: function( event, container ) {
			if ( footer.isMine( event, container ) && container === footer.active && container.is_initialized ) {
				footer.renderQuantity( container );
			}
		},

		/**
		 * A package sets a new size and price. The form validates against them right after, and wc-mnm-form-updated shows the messages.
		 */
		onPackageChanged: function( event, container ) {
			if ( footer.isMine( event, container ) && container === footer.active ) {
				footer.renderStatus( container );
			}
		},

		/**
		 * Whether an event is a form's own, not one bubbling up from a form nested in it.
		 *
		 * @param {Event}  event
		 * @param {Object} container
		 * @return {boolean}
		 */
		isMine: function( event, container ) {
			return !! container && !! container.$mnm_form && container.$mnm_form.get( 0 ) === event.currentTarget;
		},

		/**
		 * Track which forms are in view.
		 *
		 * @param {IntersectionObserverEntry[]} entries
		 */
		onIntersect: function( entries ) {

			$.each( entries, function( index, entry ) {
				entry.target.wcMnmMobileFooterInView = entry.isIntersecting;
			} );

			footer.update();
		},

		/*-----------------------------------------------------------------*/
		/*  Footer actions.                                                */
		/*-----------------------------------------------------------------*/

		/**
		 * Click the form's submit button, so its name and value (add-to-cart) are posted.
		 */
		addToCart: function() {

			var container = footer.active,
				button    = container ? container.$mnm_button.get( 0 ) : null;

			if ( ! button || ! container.passes_validation() ) {
				return;
			}

			footer.$button.addClass( 'loading' );

			// The form's button is hidden, but still submits.
			button.click();
		},

		/**
		 * Click the form's reset button, which asks the shopper to confirm.
		 */
		reset: function() {

			var container = footer.active;

			if ( ! container ) {
				return;
			}

			if ( container.$mnm_reset && container.$mnm_reset.length ) {
				container.$mnm_reset.get( 0 ).click();
			} else if ( window.confirm( wc_mnm_params.i18n_confirm_reset ) ) {
				container.$mnm_form.trigger( 'wc-mnm-container-reset' );
			}
		},

		/**
		 * Click the edit form's cancel button.
		 */
		cancel: function() {

			var $link = footer.active ? footer.getCancelLink( footer.active ) : $();

			if ( $link.length ) {
				$link.get( 0 ).click();
			}
		},

		/**
		 * The cancel edit button that belongs to a container's edit form.
		 *
		 * @param {Object} container
		 * @return {jQuery}
		 */
		getCancelLink: function( container ) {

			var $link = container.$mnm_form.find( '.wc-mnm-cancel-edit' );

			if ( ! $link.length ) {
				$link = container.$mnm_form.closest( '.woocommerce-MyAccount-content, .woocommerce' ).find( '.wc-mnm-cancel-edit' );
			}

			return $link.first();
		},

		stopLoading: function() {
			footer.$button.removeClass( 'loading' );
		},

		/*-----------------------------------------------------------------*/
		/*  Utilities.                                                     */
		/*-----------------------------------------------------------------*/

		/**
		 * Tell the stylesheet how tall the footer is, so the end of the page can scroll clear of it.
		 */
		setHeight: function() {
			document.documentElement.style.setProperty( '--wc-mnm-mobile-footer-height', footer.$el.outerHeight() + 'px' );
		},

		/**
		 * @param {Function} callback
		 * @param {number}   wait     Milliseconds.
		 * @return {Function} Debounced callback.
		 */
		debounce: function( callback, wait ) {
			var timer = null;

			return function() {
				window.clearTimeout( timer );
				timer = window.setTimeout( callback, wait );
			};
		}
	};

	footer.init();

} )( jQuery, window, document );

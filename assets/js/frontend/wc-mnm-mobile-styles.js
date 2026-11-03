/**
 * Mix and Match sticky footer.
 *
 * Shows the status of the add to cart form in view: price, counter, progress, messages and buttons.
 * The footer's buttons click the form's own, so the form's scripts still do the work.
 *
 * Subscription plans (All Products for Subscriptions): the form's visible plan controls are mirrored as
 * compact controls in the footer, which set the form's real inputs so its scripts still do the work.
 *
 * @package WooCommerce Mix and Match Mobile Styles/Scripts
 * @since   3.0.0
 */

/* global jQuery, wc_mnm_params */

( function( $, window, document ) {
	'use strict';

	/**
	 * Subscription plan controls, in the form.
	 *
	 * @type {string}
	 */
	var PLANS = '.wcsatt-options-wrapper',

	/**
	 * Tags kept when copying a plan label as HTML: sale prices and the price suffix.
	 *
	 * @type {Object}
	 */
	LABEL_TAGS = { DEL: 'del', INS: 'ins', SMALL: 'small' },

	/**
	 * Strings from PHP.
	 *
	 * @type {Object}
	 */
	params = $.extend( { i18n_plans: 'Purchase options', i18n_sale_format: '%p (was %r)' }, window.wc_mnm_mobile_params || {} ),

	/**
	 * The sticky footer. There is one, for the first purchasable container in view.
	 */
	footer = {

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
		 * The plan controls the footer shows, as last read from the form.
		 *
		 * @type {string}
		 */
		plansJson: '[]',

		/**
		 * Re-reads the plans once the plan scripts finish animating their controls.
		 *
		 * @type {number|null}
		 */
		plansTimer: null,

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
			footer.$plans        = footer.$el.find( '.wc-mnm-mobile-footer__plans' );
			footer.$button       = footer.$el.find( '.wc-mnm-mobile-footer__add-to-cart' );
			footer.$cancel       = footer.$el.find( '.wc-mnm-mobile-footer__cancel' );

			// Footer buttons.
			footer.$button.on( 'click', footer.addToCart );
			footer.$reset.on( 'click', footer.reset );
			footer.$cancel.on( 'click', footer.cancel );

			// The footer's own plan controls.
			footer.$plans
				.on( 'click', 'button[data-wc-mnm-plan]', function() {
					footer.setPlan( this.getAttribute( 'data-wc-mnm-plan' ), this.getAttribute( 'data-value' ) );
				} )
				.on( 'change', 'select[data-wc-mnm-plan]', function() {
					footer.setPlan( this.getAttribute( 'data-wc-mnm-plan' ), this.value );
				} );

			// Plan changes in the forms.
			$( document ).on( 'change', PLANS + ' :input', footer.onPlanChanged );

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
			footer.renderPlans( container );
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
		/*  Subscription plans.                                            */
		/*-----------------------------------------------------------------*/

		/**
		 * Build the footer's plan controls from the form's. Only rebuilt when they change.
		 *
		 * @param {Object} container
		 */
		renderPlans: function( container ) {

			var plans   = footer.readPlans( container.$mnm_form.get( 0 ) ),
				json    = JSON.stringify( plans ),
				focused = footer.$plans.get( 0 ).contains( document.activeElement ) ? document.activeElement : null,
				restore = focused ? [ focused.getAttribute( 'data-wc-mnm-plan' ), focused.getAttribute( 'data-value' ) ] : null;

			if ( json === footer.plansJson ) {
				return;
			}

			footer.plansJson = json;

			footer.$plans.empty().prop( 'hidden', ! plans.length );

			$.each( plans, function( index, group ) {

				var $wrap = $( '<div />' ).addClass( 'wc-mnm-mobile-footer__plan wc-mnm-mobile-footer__plan--' + group.type ),
					$select;

				if ( 'select' === group.type ) {
					$select = $( '<select />' )
						.attr( 'data-wc-mnm-plan', group.key )
						.attr( 'aria-label', group.label || params.i18n_plans );

					$.each( group.options, function( i, option ) {
						$select.append( new window.Option( option.label, option.value, false, option.checked ) );
					} );

					footer.$plans.append( $wrap.append( $select ) );
					return;
				}

				$wrap.attr( { role: 'radiogroup', 'aria-label': group.label || params.i18n_plans } );

				$.each( group.options, function( i, option ) {

					var $button = $( '<button type="button" role="radio" />' )
						.addClass( 'wc-mnm-mobile-footer__plan-option' )
						.attr( 'aria-checked', option.checked ? 'true' : 'false' )
						.attr( 'data-wc-mnm-plan', group.key )
						.attr( 'data-value', option.value );

					if ( option.html ) {
						// Built from escaped text and del, ins and small tags only, see labelHtml().
						$button.html( option.html );
					} else {
						$button.text( option.label );
					}

					$wrap.append( $button );
				} );

				footer.$plans.append( $wrap );
			} );

			// Rebuilding loses focus, give it back to the same control.
			if ( restore ) {
				footer.$plans.find( '[data-wc-mnm-plan]' ).filter( function() {
					return this.getAttribute( 'data-wc-mnm-plan' ) === restore[0] && ( 'SELECT' === this.tagName || this.getAttribute( 'data-value' ) === restore[1] );
				} ).first().trigger( 'focus' );
			}

			footer.setHeight();
		},

		/**
		 * Read the visible subscription plan controls in a form: radio groups and dropdowns, in document order.
		 *
		 * When there is a one-time purchase and more than one plan, they are combined into one dropdown instead.
		 *
		 * @param {HTMLFormElement} form
		 * @return {Array} [ { key, type: 'radio'|'select', label, options: [ { value, label, html, checked } ] } ]
		 */
		readPlans: function( form ) {

			var wrapper = form.querySelector( PLANS ),
				groups  = [],
				list;

			if ( ! wrapper || ! footer.isShown( wrapper ) ) {
				return groups;
			}

			list = footer.readPlanList( wrapper );

			if ( list ) {
				return [ list ];
			}

			$( wrapper ).find( 'input[type="radio"], select' ).each( function() {

				var control = this,
					label   = control.closest( 'label' ),
					key, group, fieldset, ownLabel;

				// The input itself may be visually hidden, its label is what shoppers see.
				if ( ! footer.isShown( label || control ) ) {
					return;
				}

				if ( 'SELECT' === control.tagName ) {
					ownLabel = control.id ? wrapper.querySelector( 'label[for="' + window.CSS.escape( control.id ) + '"]' ) : null;

					groups.push( {
						key: 'select:' + control.name,
						type: 'select',
						label: footer.textOf( ownLabel ),
						options: $.map( control.options, function( option ) {
							return { value: option.value, label: footer.textOf( option ), checked: option.selected };
						} )
					} );
					return;
				}

				key   = 'radio:' + control.name;
				group = groups.filter( function( item ) {
					return item.key === key;
				} )[0];

				if ( ! group ) {
					fieldset = control.closest( 'fieldset' );
					group    = {
						key: key,
						type: 'radio',
						label: fieldset ? footer.textOf( fieldset.querySelector( 'legend' ) ) : '',
						options: []
					};
					groups.push( group );
				}

				group.options.push( {
					value: control.value,
					label: ( label && footer.labelText( label, footer.getSaleFormat( wrapper ) ) ) || control.value,
					// The toggle can show a strikethrough, so it gets the label's sale price and suffix markup too.
					html: label ? footer.capitalise( footer.labelHtml( label ) ) : '',
					checked: control.checked
				} );
			} );

			// A radio group with one choice isn't a choice.
			return groups.filter( function( group ) {
				return group.options.length > 1;
			} );
		},

		/**
		 * Read a product's plans as one list: one-time purchase first, then each subscription plan.
		 *
		 * Every All Products for Subscriptions layout keeps the chosen plan in a convert_to_sub_{id} radio group,
		 * hidden or not, so that is the list. Labels come from what shoppers see: the prompt's "One-time purchase"
		 * and the delivery dropdown's "Every month", falling back to the radio's own label.
		 *
		 * @param {Element} wrapper The plans wrapper.
		 * @return {Object|null} A select group, or null when there aren't one-time and two or more plans to choose from.
		 */
		readPlanList: function( wrapper ) {

			var radios     = $( wrapper ).find( 'input[type="radio"][name^="convert_to_sub_"]' ).get(),
				dropdown   = wrapper.querySelector( 'select.wcsatt-options-product-dropdown' ),
				oneTime    = wrapper.querySelector( '.wcsatt-options-prompt-label-one-time' ),
				saleFormat = footer.getSaleFormat( wrapper );

			// One-time and a single plan reads better as a toggle.
			if ( radios.length < 3 || ! radios.some( function( radio ) { return '0' === radio.value; } ) ) {
				return null;
			}

			return {
				key: 'plan:' + radios[0].name,
				type: 'select',
				label: params.i18n_plans,
				options: $.map( radios, function( radio ) {

					var option = dropdown ? $( dropdown.options ).filter( function() { return this.value === radio.value; } ).get( 0 ) : null,
						label  = '0' === radio.value ? footer.textOf( oneTime ) : footer.textOf( option );

					return {
						value: radio.value,
						label: footer.capitalise( label ) || footer.labelText( radio.closest( 'label' ) || radio, saleFormat ) || radio.value,
						checked: radio.checked
					};
				} )
			};
		},

		/**
		 * Set a plan control in the form, as if the shopper had used it.
		 *
		 * @param {string} key   The group's key, ex: radio:convert_to_sub_219.
		 * @param {string} value The chosen value.
		 */
		setPlan: function( key, value ) {

			var form    = footer.active ? footer.active.$mnm_form.get( 0 ) : null,
				wrapper = form ? form.querySelector( PLANS ) : null,
				parts   = key.split( ':' ),
				type    = parts.shift(),
				name    = parts.join( ':' ),
				prompt, dropdown, radio;

			if ( ! wrapper ) {
				return;
			}

			radio = $( wrapper ).find( 'input[type="radio"]' ).filter( function() {
				return this.name === name && this.value === value;
			} ).get( 0 );

			// The plan scripts listen for jQuery's change event.
			function selectValue( select ) {
				if ( select && select.value !== value ) {
					$( select ).val( value ).trigger( 'change' );
				}
			}

			if ( 'select' === type ) {
				selectValue( $( wrapper ).find( 'select' ).filter( function() { return this.name === name; } ).get( 0 ) );
				return;
			}

			// The combined plan list. Go through the controls shoppers see, so the form's layout keeps up.
			if ( 'plan' === type ) {
				prompt   = wrapper.querySelector( '.wcsatt-options-prompt-action-input[value="' + ( '0' === value ? 'no' : 'yes' ) + '"]' );
				dropdown = wrapper.querySelector( 'select.wcsatt-options-product-dropdown' );

				// "One-time purchase" / "Subscribe" prompt first, it shows or hides the plans.
				if ( prompt && ! prompt.checked ) {
					prompt.click();
				}

				if ( '0' !== value && dropdown && $( dropdown.options ).filter( function() { return this.value === value; } ).length ) {
					selectValue( dropdown );
					return;
				}
			}

			if ( radio && ! radio.checked ) {
				radio.click();
			}
		},

		/**
		 * A plan changed in a form. Plan scripts animate their controls in and out, so read again once that is done.
		 *
		 * @param {Event} event
		 */
		onPlanChanged: function( event ) {

			var container = footer.active;

			if ( ! container || ! container.$mnm_form.get( 0 ).contains( event.target ) ) {
				return;
			}

			footer.render( container );

			window.clearTimeout( footer.plansTimer );
			footer.plansTimer = window.setTimeout( function() {
				if ( container === footer.active ) {
					footer.render( container );
					footer.setHeight();
				}
			}, 450 );
		},

		/**
		 * The plan scripts' own sale format, so the footer words it the same as their dropdown.
		 *
		 * @param {Element} wrapper The plans wrapper.
		 * @return {string} %p is the price, %r the regular price.
		 */
		getSaleFormat: function( wrapper ) {

			var format = '';

			$( wrapper ).find( 'input[data-custom_data]' ).each( function() {
				var data = $( this ).data( 'custom_data' );

				if ( data && data.dropdown_sale_format ) {
					format = data.dropdown_sale_format;
					return false;
				}
			} );

			return format || params.i18n_sale_format;
		},

		/**
		 * Copy a plan label as HTML, keeping only sale price and suffix markup. Everything else becomes escaped text.
		 *
		 * @param {Element} el The label.
		 * @return {string} HTML.
		 */
		labelHtml: function( el ) {

			var html = '';

			$.each( el.childNodes, function( index, node ) {

				var tag;

				if ( window.Node.TEXT_NODE === node.nodeType ) {
					html += $( '<span />' ).text( node.textContent ).html();
				} else if ( window.Node.ELEMENT_NODE === node.nodeType && ! $( node ).is( 'input, script, style, template' ) ) {
					tag   = LABEL_TAGS[ node.tagName ];
					html += tag ? '<' + tag + '>' + footer.labelHtml( node ) + '</' + tag + '>' : footer.labelHtml( node );
				}
			} );

			return $.trim( html.replace( /\s+/g, ' ' ) );
		},

		/**
		 * Copy a plan label as text, for a dropdown option, which can't show a strikethrough. A sale price is
		 * written out with the sale format instead, ex: "$22.50 (was $25.00)".
		 *
		 * @param {Element} el         The label.
		 * @param {string}  saleFormat %p is the price, %r the regular price.
		 * @return {string} Text.
		 */
		labelText: function( el, saleFormat ) {

			var $clone = $( el.cloneNode( true ) );

			$clone.find( 'input, script, style, template' ).remove();

			$clone.find( 'del' ).each( function() {

				var ins = this.nextElementSibling;

				if ( ins && 'INS' === ins.tagName ) {
					$( ins ).replaceWith( document.createTextNode( saleFormat.replace( '%p', footer.textOf( ins ) ).replace( '%r', footer.textOf( this ) ) ) );
					$( this ).remove();
				}
			} );

			return footer.capitalise( footer.textOf( $clone.get( 0 ) ) );
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
		 * Whether an element is rendered.
		 *
		 * @param {Element} el
		 * @return {boolean} True when it takes up space on the page.
		 */
		isShown: function( el ) {
			return el.getClientRects().length > 0;
		},

		/**
		 * Collapse an element's text.
		 *
		 * @param {Element|null} el
		 * @return {string} Text.
		 */
		textOf: function( el ) {
			return el ? $.trim( el.textContent.replace( /\s+/g, ' ' ) ) : '';
		},

		/**
		 * Upper case the first letter, ex: All Products for Subscriptions' "one time".
		 *
		 * @param {string} text
		 * @return {string} Text.
		 */
		capitalise: function( text ) {

			var first = text.charAt( 0 );

			return first && first !== first.toLocaleUpperCase() ? first.toLocaleUpperCase() + text.slice( 1 ) : text;
		},

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

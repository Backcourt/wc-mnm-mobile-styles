/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { useDebounce } from '@wordpress/compose';
import { addAction } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { STORE_KEY as CONTAINER_STORE_KEY } from './constants';
import './style.scss';

import StatusUI from './components/status-ui';
import AddToCartButton from './components/add-to-cart-button';
import CancelButton from './components/cancel-button';
import './filters';

import { isInViewport, getProductRoute } from './utils';

const MobileFooter = () => {
	// Track all props in state. This is a bit of a hack to get around the fact that we can't use useSelect for simple mix and match yet.
	const [stateProps, setStateProps] = useState({
		addToCartButtonText: _x('Add to cart', '[Frontend]', 'wc-mnm-mobile-styles'),
		container: null,
		containerId: 0,
		context: 'add-to-cart',
		isVisible: false,
		maxContainerSize: '',
		messages: [],
		minContainerSize: 0,
		maxContainerSize: '',
		passesValidation: false,
		totalPrice: 0,
		totalQuantity: 0,
	});

	// Helper to merge new props into state without overwriting the entire state.
	const updateStateProps = (newProps = {}) => {
		setStateProps((prevState) => {
			return {
				...prevState,
				...newProps,
			};
		});
	};

	const containerStoreExists = useSelect(
		(select) => {
			return select(CONTAINER_STORE_KEY) !== undefined;
		},
		[]
	);

	// If the store exists, get the status from the container data store. For now, this means we are dealing with variable mix and match.

	// Get the status from the container data store.
	const storeProps = useSelect(
		(select) => {
			if (containerStoreExists) {
				return {
					container: select(CONTAINER_STORE_KEY).getContainer(),
					containerId: select(CONTAINER_STORE_KEY).getContainerId(),
					context: select(CONTAINER_STORE_KEY).getContext(),
					maxContainerSize: select(CONTAINER_STORE_KEY).getMaxContainerSize(),
					messages: select(CONTAINER_STORE_KEY).passesValidation()
						? select(CONTAINER_STORE_KEY).getMessages('status')
						: select(CONTAINER_STORE_KEY).getMessages('errors'),
					minContainerSize: select(CONTAINER_STORE_KEY).getMinContainerSize(),
					passesValidation: select(CONTAINER_STORE_KEY).passesValidation(),
					totalPrice: select(CONTAINER_STORE_KEY).getTotal(),
					totalQuantity: select(CONTAINER_STORE_KEY).getTotalQuantity(),
				};
			} else {
				return {};
			}
		},
		[]
	);

	// Detect a container change/definition from the data store and relay it to state props.
	useEffect(() => {

		if (stateProps.container?.id !== storeProps.container?.id) {
			updateStateProps({
				container: storeProps.container,
			});
		}
	}, [storeProps.container]);

	// Detect a container change/definition in the state Props. Certain props only change this one time.
	useEffect(() => {

		const theContainer = storeProps.container?.id ? storeProps.container : stateProps.container;

		if (theContainer?.id) {

			// Get the parent product ID if the container is a variation.
			const formId = theContainer.parent > 0 ? theContainer.parent : theContainer.id
			const form   = document.querySelector(`form.mnm_form[data-product_id = "${formId}"]`) || 
			               document.querySelector(`form.variable_mnm_form[data-product_id = "${formId}"]`);

			// Guard against form not being found.
			if ( ! form ) {
				return;
			}

			// Get validation context from rendered form.
			const context          = form.getAttribute('data-validation_context') ?? 'add-to-cart';

			// Get the Add to cart button text from the rendered form.
			const addToCartButton  = form.querySelector('button.single_add_to_cart_button');
			const loadedButtonText = addToCartButton ? addToCartButton.innerText.trim() : _x('Add to cart', '[Frontend]', 'wc-mnm-mobile-styles');
			
			// Support new format (direct properties) with backward compatibility (extensions.mix_and_match).
			const minContainerSize = theContainer?.min_container_size ?? theContainer?.extensions?.mix_and_match?.min_container_size ?? 0;
			const maxContainerSize = theContainer?.max_container_size ?? theContainer?.extensions?.mix_and_match?.max_container_size ?? '';

			updateStateProps({
				addToCartButtonText: loadedButtonText,
				context: context,
				minContainerSize: minContainerSize,
				maxContainerSize: maxContainerSize,
			});
		}
	}, [stateProps.container]);

	// Listen for changes to mix and match configuration.
	// Variable Mix and Match should use useSelect with the data store, but an event listener will work for both until simple MNM gets a data store too.
	useEffect(() => {
		addAction('wc.mnm.container.container-updated', 'wc-mix-and-match', updateStateProps);
	}, []);

	// When container ID is found on a form, we need to fetch the container store API product response for simple MNM products.
	useEffect(() => {

		// For simple Mix and Match, there's no data store yet.
		if (!stateProps.container?.id && stateProps.containerId > 0) {

			// Todo: Preload this?
			apiFetch({
				path: getProductRoute(stateProps.containerId)
			}).then((container) => {
				if (container && container.id) {			
					updateStateProps({
						container: container,
					});
				}
			}).catch((error) => {
				window.console.debug('error', error);
			});

		}
	}, [stateProps.containerId]);

	// Attach scroll event listener to the window.  
	const handleScroll = () => {

		const form    = document.querySelector('form.mnm_form');
		let variation = null;

		if (form) {
			variation = form.querySelector('.wc-mnm-variation');

			// Define the element that we will test is in view... different between simple|variable mnm.
			const wrapper = null !== variation ? variation : form;

			const inViewport = isInViewport(wrapper);

			updateStateProps({ 'isVisible': inViewport });

		} else {
			updateStateProps({ 'isVisible': false });
		}

	};

	const debouncedScroll = useDebounce( handleScroll, 200 );

	useEffect(() => {
		window.addEventListener('scroll', debouncedScroll );
		addAction('wc.mnm.container.container-updated', 'wc-mix-and-match', handleScroll );
	}, []);

	// Pull out a few props that we need in this file.
	const { addToCartButtonText, container, context, passesValidation, isVisible } = stateProps;

	// Don't show anything until there's a container ID set and the form is in view.
	if (!container || !isVisible) {
		return null;
	}

	return (
		<div
			className={`mnm-mobile-content mnm_cart alignwide context-${context} ${
				passesValidation ? 'passes_validation' : 'fails_validation'
			}`}
		>
			<div className="column col-1 product">
				<StatusUI {...stateProps} />
			</div>

			<div className="column col-2">
				<div className="mnm_button_wrap">
					<AddToCartButton
						addToCartText={addToCartButtonText}
						container={container}
						context={context}
						passesValidation={passesValidation}
					/>
					<a href="#wc-mnm-child-items" className="screen-reader-text">
						{_x('Return to selections', '[Frontend]', 'wc-mnm-mobile-styles')}
					</a>
					<CancelButton
						container={container}
						context={context}
					/>
				</div>
			</div>
		</div>
	);
};

export default MobileFooter;

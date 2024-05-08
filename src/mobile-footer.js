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

import { isInViewport } from './utils';

const MobileFooter = () => {
	// Track all props in state. This is a bit of a hack to get around the fact that we can't use useSelect for simple mix and match yet.
	const [stateProps, setStateProps] = useState({
		container: null,
		context: 'add-to-cart',
		isVisible: false,
		maxContainerSize: '',
		messages: [],
		minContainerSize: 0,
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

	// Detect a container change/definition. Certain props only change this one time.
	useEffect(() => {
		if (stateProps.container?.id !== storeProps.container?.id) {
			updateStateProps({
				container: storeProps.container,
				context: storeProps.context,
				minContainerSize: storeProps.minContainerSize,
				maxContainerSize: storeProps.maxContainerSize,
			});
		}
	}, [storeProps.container]);

	// Variable Mix and Match should use useSelect with the data store, but an event listener will work for both until simple MNM gets a data store too.
	useEffect(() => {
		const updateUI = (updated) => {
			updateStateProps({
				passesValidation: updated.passesValidation,
				messages: updated.passesValidation
					? updated.messages.status
					: updated.messages.errors,
				totalPrice: updated.total,
				totalQuantity: updated.totalQuantity,
			});
		};

		const form = document.querySelector(`form.mnm_form`);

		addAction('wc.mnm.container.container-updated', 'wc-mix-and-match', updateUI);

		// For simple Mix and Match, there's no data store yet and we need to get data from the REST response.
		if (!containerStoreExists && form) {
			const containerId = form.getAttribute('data-container_id');

			if (containerId) {
				apiFetch({
					path: `/wc/store/v1/products/${containerId}`
				}).then((container) => {
					if (container && container.id) {

						const minContainerSize = container?.extensions?.mix_and_match?.min_container_size ?? 0;
						const maxContainerSize = container?.extensions?.mix_and_match?.max_container_size ?? '';
						const context = form.getAttribute('data-validation_context') ?? 'add-to-cart';

						setStateProps((prevState) => {
							return {
								...prevState,
								...{
									container: container,
									context: context,
									minContainerSize: minContainerSize,
									maxContainerSize: maxContainerSize,
								},
							};
						});
					}
				}).catch((error) => {
					console.debug('error', error);
				});
			}
		}
	}, []);

	// Attach scroll event listener to the window.  
	const handleScroll = () => {

		const form    = document.querySelector('form.mnm_form');
		let variation = null;

		if (form) {
			variation = form.querySelector('.wc-mnm-variation');

			// Define the element that we will test is in view... different between simple|variable mnm.
			const wrapper = null !== variation ? variation : form;

			const isVisible = isInViewport(wrapper);

			// Only update state when it changes to limit re-renders.
			if (stateProps.isVisible !== isVisible) {
				updateStateProps({ isVisible });
			}

		} else {
			updateStateProps({ isVisible: false });
		}

	};

	const debouncedScroll = useDebounce( handleScroll, 200 );

	useEffect(() => {
		window.addEventListener('scroll', debouncedScroll );
        addAction('wc.mnm.container.add-to-cart-rendered', 'wc-mix-and-match', handleScroll);
		addAction('wc.mnm.container.container-updated', 'wc-mix-and-match', handleScroll);
		handleScroll();
	}, []);

	// Pull out a few props that we need in this file.
	const { container, context, passesValidation, isVisible } = stateProps;

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
						container={container}
						passesValidation={passesValidation}
					/>
					<a href="#wc-mnm-child-items" className="screen-reader-text">
						{_x('Return to selections', '[Frontend]', 'wc-mnm-mobile-styles')}
					</a>
					<CancelButton
						context={context}
					/>
				</div>
			</div>
		</div>
	);
};

export default MobileFooter;

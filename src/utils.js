/**
 * External dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { applyFilters } from '@wordpress/hooks';

/**
 * Test if Element is in window viewport
 * @param {jsx} element 
 * @return bool 
 */
export const isInViewport = (el) => {
	if (!el) return false;
  
	const elementRect = el.getBoundingClientRect();
	const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  
	return (
	  elementRect.top < viewportHeight &&
	  elementRect.bottom >= 0
	);
  };
  

/**
 * Get single product route with query params
 * 
 * @param int containerId - The product ID we want to get the route for.
 * @return string 
 */
export const getProductRoute = (containerId) => {

	const baseUrl = `/wc/store/v1/products/${containerId}`;

	// Get the search parameters from the current browser URL
	const params = new URLSearchParams(window.location.search);

	/**
	 * Add query args to the Store API product route.
	 * Cannot change the product being retrieved, this is suitable for adding $_GET params that can later be used to modify the route responses.
	 * 
	 * @param {Object} queryArgs - The query args to add to the URL.
	 * @param {int} containerId - The product ID we want to get the route for.
	 */
	const queryArgs = applyFilters( 'wc.mnm.container-route-params', Object.fromEntries(params.entries() ), containerId );

	return addQueryArgs( baseUrl, queryArgs );

}
/**
 * External dependencies
 */
import { addQueryArgs } from '@wordpress/url';
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

	return addQueryArgs(baseUrl, Object.fromEntries(params.entries()) );

}
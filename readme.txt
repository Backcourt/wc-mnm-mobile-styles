=== WooCommerce Mix and Match Products - Mobile Styles ===

Contributors: helgatheviking
Tags: woocommerce, product, bundle, bundles, kits, simple, categories
Stable tag: 3.0.0-beta.1
Requires PHP: 8.0
Requires at least: 6.5
Tested up to: 6.7
WC requires at least: 9.4.0
WC tested up to: 9.6.0
License: GNU General Public License v3.0
License URI: http://www.gnu.org/licenses/gpl-3.0.html

== Description ==

Turns the Mix and Match counter message into a sticky footer

== Changelog ==

= 3.0.0-beta.1 XXXX.XX.XX =
* Important: Requires Mix and Match 3.0.
* Important: The sticky footer is plain jQuery again, built from the add to cart form. React and the webpack build are gone.
* Important: Removed Variable Mix and Match support. Use Mix and Match 3.0's packages instead.
* New: The footer follows a container's package, its size, price and progress update when the shopper picks another one.
* New: Template single-product/mnm/mobile-footer.php to override the footer markup.
* New: All Products for Subscriptions plans show in the footer, as a toggle for one plan or a dropdown for several, and stay in sync with the form.
* New: The page leaves room at the bottom for the footer, so the last items can scroll clear of it.
* Tweak: The form's own status and buttons are only hidden once the footer has taken over, so the form still works if the script doesn't load.
* Tweak: The footer is hidden from screen readers and the keyboard while it's out of view.
* Removed: The `wc.mnm.container-route-params` JavaScript filter, the footer no longer fetches the product from the Store API.

= 2.0.0  =
* Fix: Update for Mix and Match 2.0 Compatibility

= 1.0.0 =
* Initial release.


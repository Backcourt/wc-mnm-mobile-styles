# WooCommerce Mix and Match - Mobile Styles

### Quickstart

This is a developmental repo. Clone this repo and run `npm install && npm run build`   
OR    
[Download latest release](https://github.com/kathyisawesome/wc-mnm-mobile-styles/releases/latest/)

### What's This?

Experimental mini-extension for [WooCommerce Mix and Match](https://woocommerce.com/products/woocommerce-mix-and-match-products/) that turns the counter error message into a sticky footer.

![A toolbar at the bottom of the screen showing how many items have been selected](https://user-images.githubusercontent.com/507025/79001591-f4321100-7b0b-11ea-8743-a42a4a13a319.png)

### Important

1. This is proof of concept and not officially supported in any way.
2. Not ideal for use with Name Your Price or Product Addons.
3. Requires Mix and Match 2.7+

### Styling the progress bar

You can adjust the styles of the progress bar with the following rules:

```
.mnm-mobile-container progress.mnm-container-progress::-webkit-progress-bar {
  background-color: #eee;
}
.mnm-mobile-container progress.mnm-container-progress::-webkit-progress-value {
  background-color: green;
}
.mnm-mobile-container progress.mnm-container-progress::-moz-progress-bar {
  background-color: #eee;
}
.mnm-mobile-container progress.mnm-container-progress::-moz-progress-value {
  background-color: green;
}

Then for the first CSS rule you shared that looked like,
.mnm-mobile-container progress.mnm-container-progress[value] {
  accent-color: green;
  background-color: #eee;
}
```

### Automatic plugin updates

Plugin updates can be enabled by installing the [Git Updater](https://git-updater.com/) plugin.

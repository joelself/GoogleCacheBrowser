var observer = null;
function cachifyLinks() {
	'use strict';
    var links, i, link, href, encodedHref, observer, config, regex, matches;
	if (document.browseGoogleCacheObserver == null || document.browseGoogleCacheObserver == undefined) {
		links = document.querySelectorAll('a');
		for (i = 0; i < links.length; i += 1) {
			link = links[i];
			href = link.href;
			if (href != undefined && href != '') {
				if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(href)) == null) {
					regex = new RegExp(window.googleCacheBrowserRegex.replace(/^\/|\/$/g, ''));
					if (regex.test(href)) {
						matches = /(https?).*/gi.exec(href);
						encodedHref = encodeURIComponent(href);
						link.href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodedHref;
					}
				}
			}
		}
		config = { attributes: true, childList: true, characterData: true, subtree: true };
		observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				links = mutation.target.querySelectorAll('a');
				for (i = 0; i < links.length; i++) {
					link = links[i];
					href = link.href;
					if (href != undefined && href != '') {
						if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(href)) == null) {
							regex = new RegExp(window.googleCacheBrowserRegex.replace(/^\/|\/$/g, ''));
							if (regex.test(href)) {
								matches = /(https?).*/gi.exec(href);
								encodedHref = encodeURIComponent(href);
								link.href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodedHref;
							}
						}
					}
				}
			});
		});
		observer.observe(document.documentElement, config);
		document.browseGoogleCacheObserver = observer;
		chrome.runtime.sendMessage({
			action : 'cachedModeOn'
		});
	}
}

cachifyLinks();
var observer = null;
function processLinks(links) {
	for (i = 0; i < links.length; i++) {
		link = links[i];
		href = link.href;
		if (href != undefined && href != '') {
			if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(href)) == null) {
				if((matches = /https?:\/\/web\.archive\.org\/web\/[0-9]*?\/(.*)/ig.exec(href)) != null) {
					// default to using the google cache
					href = matches[1];
				}
				regex = new RegExp(window.googleCacheBrowserRegex.replace(/^\/|\/$/g, ''));
				if (regex.test(href)) {
					matches = /(https?).*/gi.exec(href);
					if(matches != null && matches.length > 1) {
						encodedHref = encodeURIComponent(href);
						link.href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodedHref;
					}
				}
			}
		}
	}
}

function cachifyLinks() {
	'use strict';
    var links, i, link, href, encodedHref, observer, config, regex, matches;
	if (document.browseGoogleCacheObserver == null || document.browseGoogleCacheObserver == undefined) {
		links = document.querySelectorAll('a');
		processLinks(links);
		config = { attributes: true, childList: true, characterData: true, subtree: true };
		observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				if(mutation.target.type == 1) {
					links = mutation.target.querySelectorAll('a');
					processLinks(links);
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
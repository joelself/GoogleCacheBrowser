var tabsRedirecting = [];
var tabsActivated = [];
var tabsActivatedExpression = [];
var tabsGoingBack = [];

chrome.tabs.onActivated.addListener(function (activeInfo) {
	'use strict';
	var tabIndex, regex;
	if ((tabIndex = tabsActivated.indexOf(activeInfo.tabId)) > -1) {
		if (tabsActivatedExpression[tabIndex] == '.*') {
			chrome.browserAction.setIcon({
				path : 'cache_green.png'
			});
		} else {
			chrome.browserAction.setIcon({
				path : 'cache_yellow.png'
			});
		}
		chrome.browserAction.setBadgeText({ 'text': 'ON' });
	} else {
		chrome.browserAction.setIcon({
			path : 'cache.png'
		});
		chrome.browserAction.setBadgeText({ 'text': '' });
	}
});


function pageUpdatedEventListener(tabId, changeInfo, tab) {
	var regex, changeurl, tabIndex, href, matches;
	changeurl = changeInfo.url;
	if (tabsRedirecting.indexOf(tabId) > -1) {
		tabsRedirecting.splice(tabsRedirecting.indexOf(tabId), 1);
	}
	if (tab.url.indexOf('chrome://') == 0 || tab.url.indexOf('https://chrome.google.com/webstore') == 0) {
		chrome.browserAction.setIcon({
			path : 'cache.png'
		});
		return;
	}
	if (changeInfo.status != "complete" || tabsActivated.indexOf(tabId) < 0) {
		return;
	}
	tabIndex = tabsActivated.indexOf(tabId);
	regex = new RegExp(tabsActivatedExpression[tabIndex].replace(/^\/|\/$/g, ''));
	href = tab.url;
	if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(href)) != null) {
		href = decodeURIComponent(matches[1]);
	}
	if (regex.test(href)) {
		chrome.tabs.executeScript(tab.id, {
			code : 'try{Object.defineProperty(window, \'googleCacheBrowserRegex\', {value: "' + regex + '"});}catch(ex){}'
		},
			function () {
				chrome.tabs.executeScript(tab.id, {
					file : 'cachify_links.js'
				},
					function () {
						if (chrome.runtime.lastError) {
							return;
						}
					});
				if (chrome.runtime.lastError) {
					return;
				}
			});
	}
}

function activateTab(tabId, regex) {
	if (tabsActivated.length == 0) {
		/*global onRemoved*/
		chrome.tabs.onRemoved.addListener(onRemoved);
		/*global onReplaced*/
		chrome.tabs.onReplaced.addListener(onReplaced);
		chrome.tabs.onUpdated.addListener(pageUpdatedEventListener);
	}
	tabsActivated.push(tabId);
	tabsActivatedExpression.push(regex);
}

function deactivateTab(tabId) {
	var tabIndex = tabsActivated.indexOf(tabId);
	tabsActivated.splice(tabIndex, 1);
	tabsActivatedExpression.splice(tabIndex, 1);
	if (tabsActivated.length == 0) {
		chrome.tabs.onRemoved.removeListener(onRemoved);
		chrome.tabs.onReplaced.removeListener(onReplaced);
		chrome.tabs.onUpdated.removeListener(pageUpdatedEventListener);
		/*global redirectToCache*/
		chrome.webNavigation.onCommitted.removeListener(redirectToCache);
	}
}

function onReplaced(addedTabId, removedTabId) {
	if (tabsActivated.indexOf(removedTabId) > -1) {
		deactivateTab(removedTabId);
	}
}

function onRemoved(addedTabId, removedTabId) {
	if (tabsActivated.indexOf(removedTabId) > -1) {
		deactivateTab(removedTabId);
	}
}

function redirect(details) {
	var href = details.url, matches;
	tabsRedirecting.push(details.tabId);
	if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(href)) == null &&
			/https?:\/\/web\.archive\.org\/web\/.*/ig.exec(href) == null) {
		matches = /(https?).*/gi.exec(href);
		href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodeURIComponent(href);
		chrome.tabs.update(details.tabId, {
			url: href
		});
	}
}

function redirectToCache(details) {
	var tabIndex, href, regex, matches;
	if (details.frameId == 0 && tabsRedirecting.indexOf(details.tabId) < 0 && details.transitionQualifiers.indexOf("forward_back") < 0) {
		if ((tabIndex = tabsActivated.indexOf(details.tabId)) > -1) {
			regex = new RegExp(tabsActivatedExpression[tabIndex].replace(/^\/|\/$/g, ''));
			if (regex.test(details.url)) {
				redirect(details);
			}
		}
	}
}

function notFoundListener(details) {
	var matches, href, xhr, response, tabIndex;
	if (details.type == 'main_frame' || details.type == 'sub_frame') {
		if (details.statusCode == 404 || details.statusCode == 503/*|| details.url.indexOf("webcache.googleusercontent.com/search") > -1*/) {
			if (details.url.search(/https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/gi) < 0) {
				chrome.tabs.executeScript(details.tabId, {
					file : 'injector.js'
				},
					function () {
						if (chrome.runtime.lastError) {
							return;
						}
					});
			} else if ((tabIndex = tabsActivated.indexOf(details.tabId)) > -1) {
				// Try the wayback machine
				chrome.tabs.executeScript(details.tabId, {
					code : 'try{Object.defineProperty(window, \'spinnerPath\', {value: \'' + chrome.extension.getURL('spinner_128.gif') + '\'});}catch(ex){}'
				},
					function () {
						if (chrome.runtime.lastError) {
							return;
						}
					});
				chrome.tabs.executeScript(details.tabId, {
					file: 'show_spinner.js'
				},
					function () {
						if (chrome.runtime.lastError) {
							return;
						}
					});
				matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(details.url);
				xhr = new XMLHttpRequest();
				xhr.open("GET", "http://archive.org/wayback/available?url=" + matches[1], true);
				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {
						response = JSON.parse(xhr.responseText);
						if (response.archived_snapshots.closest != undefined) {
							chrome.tabs.update(details.tabId, {
								url: response.archived_snapshots.closest.url
							});
						} else {
							chrome.tabs.executeScript(details.tabId, {
								code:   'document.getElementById("googleCacheBrowserSpinner").parentElement.removeChild(document.getElementById("googleCacheBrowserSpinner"));\n' +
										'document.getElementById("googleCacheBrowserTitle").innerHTML = "Page Not Found in Internet Archive: Wayback Machine"\n' +
									   '//# sourceURL=removeSpinner.js\n'
							},
								function () {
									if (chrome.runtime.lastError) {
										return;
									}
								});
						}
					}
				};
				xhr.send();
			}
		}
	}
}

function onCompleted(details) {
	notFoundListener(details);
}

function historyUpdatedListener(details) {
	var tabIndex, href, matches;
	if ((tabIndex = tabsActivated.indexOf(details.tabId)) > -1) {
		if ((tabIndex = tabsGoingBack.indexOf(details.tabId)) > -1) {
			if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(details.url)) != null) {
				tabsGoingBack.splice(tabIndex, 1);
				if (tabsGoingBack.length == 0) {
					chrome.webNavigation.onHistoryStateUpdated.removeListener(historyUpdatedListener);
				}
				href = decodeURIComponent(matches[1]);
				chrome.browserAction.setBadgeText({ 'text': '' });
				deactivateTab(details.tabId);
				chrome.browserAction.setIcon({
					path : 'cache.png'
				});
				chrome.tabs.update(details.tabId, {
					url: href
				});
			}
		}
	}
}

function onExtensionButtonClicked(tab) {
    'use strict';
	var exception, href, regex, tabIndex, value, matches, i;
	if ((tabIndex = tabsActivated.indexOf(tab.id)) > -1) {
		if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(tab.url)) != null ||
			    (matches = /https?:\/\/web\.archive\.org\/web\/[0-9]*?\/(.*)/ig.exec(tab.url)) != null) {
			href = decodeURIComponent(matches[1]);
			chrome.browserAction.setBadgeText({ 'text': '' });
			deactivateTab(tab.id);
			chrome.browserAction.setIcon({
				path : 'cache.png'
			});
			chrome.tabs.update(tab.id, {
				url: href
			});
		} else if (tab.url.search(/https?:\/\/webcache.googleusercontent.com\//gi) > -1) {
			/*Some weird behavior. When you load a cached page it redirects to
			 http://webcache.googleusercontent.com/ while still somehow showing the previous page*/
			tabsGoingBack.push(tab.id);
			chrome.webNavigation.onHistoryStateUpdated.addListener(historyUpdatedListener);
			chrome.tabs.executeScript(tab.id, {
				code : 'window.history.back();'
			},
				function () {
					if (chrome.runtime.lastError) {
						return;
					}
				});
		}
	} else {
		activateTab(tab.id, '.*');
		chrome.tabs.executeScript(tab.id, {
			code : 'try{Object.defineProperty(window, \'googleCacheBrowserRegex\', {value: \'.*\'});}catch(ex){}'
		},
			function () {
				if (!chrome.runtime.lastError) {
					chrome.tabs.executeScript(tab.id, {
						file : 'cachify_links.js'
					},
						function () {
							if (chrome.runtime.lastError) {
								return;
							}
						});
				}
			});
		chrome.browserAction.setBadgeText({ 'text': 'ON' });
		chrome.webNavigation.onCommitted.addListener(redirectToCache,
			{urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame']},
			['blocking']);
		if (tab.url.search(/(https)?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/gi) < 0) {
			matches = /(https?).*/gi.exec(tab.url);
			href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodeURIComponent(tab.url);
			chrome.tabs.update(tab.id, {
				url: href
			});
		}
		chrome.browserAction.setIcon({
			path : 'cache_green.png'
		}, function () {
			//window.close();
		});
	}
}

function viewCachedLocation(request, sender) {
	var value = {}, href, matches;
	activateTab(sender.tab.id, request.urlRegEx);
	chrome.webNavigation.onCommitted.addListener(redirectToCache,
		{urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame']},
		['blocking']);
	matches = /(https?).*/gi.exec(sender.tab.url);
	href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodeURIComponent(sender.tab.url);
	chrome.tabs.update(sender.tab.id, {
		url: href
	});
	chrome.browserAction.setIcon({
		path : 'cache_yellow.png'
	});
	chrome.browserAction.setBadgeText({ 'text': 'ON' });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'viewCachedLocation') {
		viewCachedLocation(request, sender);
	} else if (request.action === 'extensionButtonClicked') {
		onExtensionButtonClicked(request.tab);
	}
});

chrome.webRequest.onCompleted.addListener(onCompleted, {urls: ['http://*/*', 'https://*/*'], types: ['main_frame']});
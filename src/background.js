var tabsRedirecting = [];
var tabsActivated = [];
var tabsActivatedExpression = [];
var tabsGoingBack = [];
var currentUserId = '';

function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32), hex, i;
    crypto.getRandomValues(randomPool);
    hex = '';
    for (i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

chrome.storage.sync.get('userid', function (items) {
    var userid = items.userid;
    function useToken(userid) {
        currentUserId = userid;
    }
    if (userid) {
        useToken(userid);
    } else {
        userid = getRandomToken();
        chrome.storage.sync.set({userid: userid}, function () {
            useToken(userid);
        });
    }
});

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
		});
		chrome.tabs.executeScript(tab.id, {
			file : 'cachify_links.js'
		},
			function () {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError.message);
				}
			});
	}
}

function removeEventListener() {
	if (tabsActivated.length == 0) {
		chrome.tabs.onUpdated.removeListener(pageUpdatedEventListener);
		/*global redirectToCache*/
		chrome.webRequest.onBeforeRequest.removeListener(redirectToCache);
	}
}

function activateTab(tabId, regex) {
	tabsActivated.push(tabId);
	tabsActivatedExpression.push(regex);
}

function deactivateTab(tabId) {
	removeEventListener();
	var tabIndex = tabsActivated.indexOf(tabId);
	tabsActivated.splice(tabIndex, 1);
	tabsActivatedExpression.splice(tabIndex, 1);
}

function addPageUpdatedListener() {
	chrome.tabs.onUpdated.addListener(pageUpdatedEventListener);
}

function redirectToCache(details) {
	var tabIndex, href, regex, matches;
	if (details.frameId == 0 && tabsRedirecting.indexOf(details.tabId) < 0) {
		if ((tabIndex = tabsActivated.indexOf(details.tabId)) > -1) {
			regex = new RegExp(tabsActivatedExpression[tabIndex].replace(/^\/|\/$/g, ''));
			if (regex.test(details.url)) {
				href = details.url;
				tabsRedirecting.push(details.tabId);
				if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(href)) == null) {
					matches = /(https?).*/gi.exec(href);
					href = matches[1] + '://webcache.googleusercontent.com/search?q=cache:' + encodeURIComponent(href);
					chrome.tabs.update(details.tabId, {
						url: href
					});
				}
			}
		}
	}
}

function notFoundListener(details) {
	if (details.type == 'main_frame' || details.type == 'sub_frame') {
		if (details.statusCode == 404 || details.statusCode == 503) {
			if (details.url.search(/https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/gi) < 0) {
				chrome.tabs.executeScript(details.tabId, {
					file : 'injector.js'
				},
					function () {
						if (chrome.runtime.lastError) {
							console.error(chrome.runtime.lastError.message);
						}
					});
			}
		}
	}
}

function forwardBackEventListener(details) {
	var tabIndex, href, matches;
	if ((tabIndex = tabsActivated.indexOf(details.tabId)) > -1) {
		if ((tabIndex = tabsGoingBack.indexOf(details.tabId)) > -1) {
			if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(details.url)) != null) {
				tabsGoingBack.splice(tabIndex, 1);
				if (tabsGoingBack.length == 0) {
					chrome.webNavigation.onHistoryStateUpdated.removeListener(forwardBackEventListener);
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
	var exception, href, regex, tabIndex, value, matches;
	if ((tabIndex = tabsActivated.indexOf(tab.id)) > -1) {
		if ((matches = /https?:\/\/webcache.googleusercontent.com\/search\?q=cache(?::|(?:%3A))(.*)/ig.exec(tab.url)) != null) {
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
			chrome.webNavigation.onHistoryStateUpdated.addListener(forwardBackEventListener);
			chrome.tabs.executeScript(tab.id, {
				code : 'window.history.back();'
			});
		}
	} else {
		activateTab(tab.id, '.*');
		chrome.tabs.executeScript(tab.id, {
			code : 'try{Object.defineProperty(window, \'googleCacheBrowserRegex\', {value: \'.*\'});}catch(ex){}'
		});
		chrome.tabs.executeScript(tab.id, {
			file : 'cachify_links.js'
		},
			function () {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError.message);
				}
			});
		addPageUpdatedListener();
		chrome.browserAction.setBadgeText({ 'text': 'ON' });
		chrome.webRequest.onBeforeRequest.addListener(redirectToCache,
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
	addPageUpdatedListener();
	chrome.webRequest.onBeforeRequest.addListener(redirectToCache,
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

chrome.webRequest.onCompleted.addListener(function (details) {
	notFoundListener(details);
}, {urls: ['http://*/*', 'https://*/*'], types: ['main_frame']}
	);

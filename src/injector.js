var UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // Update after 24 hour

function getUrlParts(href) {
	var matches, fragment = '', query = '', scheme = '', authority = '', slashes = '', hostname = '', port = '', path = '', file = '';
	matches = /(.*?)#(.*)$/gi.exec(href);
	if (matches != null && matches.length > 0) {
		fragment = (matches[2] !== undefined && matches[2] != '' ? matches[2] : '');
		href = (matches[1] !== undefined && matches[1] != '' ? matches[1] : '');
	}
	matches = /(.*?)\?(.*)$/gi.exec(href);
	if (matches != null && matches.length > 0) {
		query = (matches[2] !== undefined && matches[2] != '' ? matches[2] : '');
		href = (matches[1] !== undefined && matches[1] != '' ? matches[1] : '');
	}
	matches = /(.*?):(.*)$/gi.exec(href);
	if (matches != null && matches.length > 0) {
		scheme = (matches[1] !== undefined && matches[1] != '' ? matches[1] : '');
		href = (matches[2] !== undefined && matches[2] != '' ? matches[2] : '');
	}
	matches = /(\/\/)?((?:.*?):(?:.*?)@)?(.*)$/gi.exec(href);
	if (matches != null && matches.length > 0) {
		slashes = (matches[1] !== undefined && matches[1] != '' ? matches[1] : '');
		authority = (matches[2] !== undefined && matches[2] != '' ? matches[2] : '');
		href = (matches[3] !== undefined && matches[3] != '' ? matches[3] : '');
	}
	matches = /((?:[^\.]*?\.?)*?)(:(?:[0-9]*?))?(?:(\/.*)|$)$/gi.exec(href);
	if (matches != null && matches.length > 0) {
		hostname = (matches[1] !== undefined && matches[1] != '' ? matches[1] : '');
		port = (matches[2] !== undefined && matches[2] != '' ? matches[2] : '');
		href = (matches[3] !== undefined && matches[3] != '' ? matches[3] : '');
	}
	matches = /((?:.*?\/)*)(.*)?/gi.exec(href);
	if (matches != null && matches.length > 0) {
		path = (matches[1] !== undefined && matches[1] != '' ? matches[1] : '');
		file = (matches[2] !== undefined && matches[2] != '' ? matches[2] : '');
	}
	return { 'scheme': scheme, 'authority': authority, 'slashes': slashes, 'hostname': hostname, 'port': port, 'path': path, 'file': file, 'query': query, 'fragment': fragment };
}

function viewCachedLocation(location) {
	window.postMessage({'location': location}, '*');
}

function getUrlsAndRegexes(parts) {
	var domainOnly, hostPath, fullPath, pathRegex, hostRegex, domainRegex, escapedDomain, domain;
	domain = tldjs.getDomain(parts.hostname);
	domainOnly = parts.scheme + ':' + parts.slashes + parts.authority + domain + parts.port;
	hostPath = parts.scheme + ':' + parts.slashes + parts.authority + parts.hostname + parts.port;
	fullPath = parts.scheme + ':' + parts.slashes + parts.authority + parts.hostname + parts.port + (parts.path == '/' ? '' : parts.path);
	parts.slashes = parts.slashes.replace(/\//g, '\\/');
	parts.hostname = parts.hostname.replace(/\./g, '\\.');
	parts.path = parts.path.replace(/\//g, '\/');
	escapedDomain = domain.replace(/\./g, '\\.');
	pathRegex = parts.scheme + ':' + parts.slashes + parts.authority + '.*?' + parts.hostname + parts.port + parts.path  + '.*?';
	hostRegex = parts.scheme + ':' + parts.slashes + parts.authority + '.*?' + parts.hostname + parts.port + '.*?';
	domainRegex = parts.scheme + ':' + parts.slashes + parts.authority + '.*?' + escapedDomain + parts.port + '.*?';
	return { 'domainOnly': domainOnly, 'hostPath': hostPath, 'fullPath': fullPath,
		'pathRegex': pathRegex, 'hostRegex': hostRegex, 'domainRegex': domainRegex};
}

function closeTopBar() {
	var topMargin, element, topBarSize;
	topMargin = +(/([0-9]*)px/.exec(window.getComputedStyle(document.body).getPropertyValue('margin-top'))[1]);
	element = document.body.querySelector('#googleCacheBrowserTopBar');
	topBarSize = element.clientHeight;
	topMargin = (topMargin - topBarSize) + 'px';
	document.body.removeChild(element);
	document.body.style.marginTop = topMargin;
}

function injectPageContent(href) {
	var inner, parts, topBar, first, body, i, styles, matches, element, urls, topMargin;
	inner = '<div class="top-bar-content">' +
				'<div class="table-div">' +
					'<span class="middleSpan">' +
						'<p class="view">View</p>' +
					'</span>' +
				'</div>' +
				'<div class="radio-div">' +
					'<span class="middleSpan">' +
						'<div id=><input class="locationRadio" type="radio" name="location" value="[pageHref]" checked><div class="radioText">This page</div><br/></div>' +
						'<div id="pathRadio"><input class="locationRadio" type="radio" name="location" value="[pathHref]"><div class="radioText">[path]</div><br/></div>' +
						'<div id="hostRadio"><input class="locationRadio" type="radio" name="location" value="[hostHref]"><div class="radioText">[host]</div><br/></div>' +
						'<div id="domainRadio"><input class="locationRadio" type="radio" name="location" value="[domainHref]"><div class="radioText">[domain]</div><br/></div>' +
					'</span>' +
				'</div>' +
				'<div class="table-div">' +
					'<span class="middleSpan">' +
						'<p class="view">In the Google Chrome Cache</p>' +
					'</span>' +
				'</div>' +
				'<div class="table-div">' +
					'<span class="middleSpan">' +
						'<p class="view"><a class="gCbutton" id="browseGoogleCacheButton">GO!</a></p>' +
					'</span>' +
				'</div>' +
				'<div class="closeXButton" id="closeXButtonId">X</div>'+
			'</div>';
	parts = getUrlParts(href);
	urls = getUrlsAndRegexes(parts);
	inner = inner.replace('[pageHref]', href).replace('[path]', urls.fullPath).replace('[pathHref]', urls.pathRegex).replace('[host]', urls.hostPath);
	inner = inner.replace('[hostHref]', urls.hostRegex).replace('[domain]', urls.domainOnly).replace('[domainHref]', urls.domainRegex);
	topBar = document.createElement('div');
	topBar.innerHTML = inner;
	topBar.className = 'google-cache-top-bar';
	topBar.id = 'googleCacheBrowserTopBar';
	topBar.querySelector('#browseGoogleCacheButton').onclick = function () {viewCachedLocation(document.querySelector('input[name="location"]:checked').value); };
	topBar.querySelector('#closeXButtonId').onclick = closeTopBar;
	body = document.body;
	body.insertBefore(topBar, document.body.firstChild);
	if (urls.domainOnly == urls.hostPath) {
		element = document.getElementById("domainRadio");
		element.parentNode.removeChild(element);
	}
	if (urls.hostPath == urls.fullPath) {
		element = document.getElementById("pathRadio");
		element.parentNode.removeChild(element);
	}
	document.body.style.marginTop = (+(/([0-9]*)px/.exec(window.getComputedStyle(body).getPropertyValue('margin-top'))[1]) + topBar.clientHeight) + 'px';
}

function get(url, callback) {
    var x = new XMLHttpRequest();
    x.onload = x.onerror = function () { callback(x.responseText); };
    x.open('GET', url);
    x.send();
}

// Typically run within a few milliseconds
function execute(code) {
	code = code + '\n\n//# sourceURL=tldjavascript.js';
    try {
		/*jslint evil: true */
		window['eval'](code);
		/*jslint evil: false */
	} catch (e) {
		console.error(e);
	}
	if (document.getElementById('googleCacheBrowserTopBar') == null) {
		injectPageContent(window.location.href);
	}
}

chrome.storage.local.get({
    lastUpdated: 0,
    code: ''
}, function (items) {
    if (Date.now() - items.lastUpdated > UPDATE_INTERVAL) {
        // Get updated file, and if found, save it.
        get('https://wzrd.in/standalone/tldjs', function (code) {
            if (!code) {
				return;
			}
            chrome.storage.local.set({lastUpdated: Date.now(), code: code});
        });
    }
    if (items.code) { // Cached js is available, use it
        execute(items.code);
	} else {// No cached version yet. Load from extension
        get(chrome.extension.getURL('tldjs.js'), execute);
	}
});

function waitToRun() {
	if (document.readyState == "complete"
			|| document.readyState == "loaded"
			|| document.readyState == "interactive") {
		if (document.getElementById('googleCacheBrowserTopBar') == null) {
			injectPageContent(window.location.href);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function (event) {
			if (document.getElementById('googleCacheBrowserTopBar') == null) {
				injectPageContent(window.location.href);
			}
		});
	}
}

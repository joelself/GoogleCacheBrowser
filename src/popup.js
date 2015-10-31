document.addEventListener("DOMContentLoaded", function (event) {
	'use strict';
	var paragraph, url, proxy;
	paragraph = document.querySelectorAll('p.error_text');
	chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
		url = tabs[0].url;
		if (url.indexOf('chrome://') == 0) {
			paragraph[0].innerHTML = 'Sorry, you can\'t activate Browse Google Cache on a page with a "chrome://" URL.';
		} else if (url.indexOf('https://chrome.google.com/webstore') == 0) {
			paragraph[0].innerHTML = 'Sorry, you can\'t activate Browse Google Cache on the Chrome Web Store.';
		} else {
			chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
				chrome.runtime.sendMessage({
					action : 'extensionButtonClicked',
					'tab': tabs[0]
				});
				window.close();
			});
		}
	});
});
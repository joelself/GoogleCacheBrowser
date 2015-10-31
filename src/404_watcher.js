window.addEventListener('message', function (event) {
	var message;
	if (event.source !== window) {
		return;
	}
	message = event.data;
	if (typeof message !== 'object' || message === null || !message.location) {
		return;
	}
	chrome.runtime.sendMessage({
		action : 'viewCachedLocation',
		urlRegEx : message.location
	});
});
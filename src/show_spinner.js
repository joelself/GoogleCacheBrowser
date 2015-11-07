function removeOverlay() {
	document.body.removeChild(document.getElementById('googleCacheBrowserContainer'));
	document.body.removeChild(document.getElementById('googleCacheBrowserText'));
	document.body.removeChild(document.getElementById('googleCacheBrowserClose'));
}
function showSpinner() {
	var imgdiv, img, divContainer, text, p, spanClose, spanX, divText, closeDiv, closeText, X;
	imgdiv = document.createElement('div');
	divContainer = document.createElement('div');
    closeDiv = document.createElement('div');
    closeDiv.setAttribute('id', 'closeDiv');
    text = document.createTextNode('Trying the Internet Archive: Wayback Machine');
    closeText = document.createTextNode('close: ');
    X = document.createTextNode('X');    
	img = document.createElement('img');
	p = document.createElement('p');
    spanClose = document.createElement('span');
    spanClose.appendChild(closeText);
    spanX = document.createElement('span');
    spanX.appendChild(X);
	divText = document.createElement('div');
	p.appendChild(text);
    closeDiv.appendChild(spanClose);
    closeDiv.appendChild(spanX);
	divText.appendChild(p);
    imgdiv.appendChild(img);
	divContainer.appendChild(imgdiv);
    divText.setAttribute('style', 'left: 50%;top: 50%;line-height: 200px;margin: auto;position: fixed;width: 600px;margin-left: -300px;z-index: 9999;margin-top: -125px;');
	imgdiv.setAttribute('style', 'position: fixed;top:50%; left:50%;');
	divContainer.setAttribute('style', 'position: fixed; top:50%; left:50%; z-index:9999;top:0; bottom:0; left:0; right:0; background-color: #0A0A0A; opacity:0.9; z-index:9998;');
    closeDiv.setAttribute('style', 'left: 50%;top: 50%;margin: auto;position: fixed;width: 600px;margin-left: 155px;z-index: 9998;margin-top: -150px;');
    img.setAttribute('style', 'width:128px; height:128px; margin-left: -64px; margin-top: -64px;');
	img.setAttribute('src', window.spinnerPath);
	p.setAttribute('style', 'font: normal x-large verdana,arial,helvetica,sans-serif; color: white;text-align: center;');
    spanClose.setAttribute('style', 'font: normal large verdana,arial,helvetica,sans-serif; color: white;text-align: center;');
    spanX.setAttribute('style', 'font: normal large verdana,arial,helvetica,sans-serif; color: #6999CC;text-align: center;cursor: pointer;');
	spanX.onclick = removeOverlay;
	p.id = 'googleCacheBrowserTitle';
	img.id = 'googleCacheBrowserSpinner';
	divContainer.id = 'googleCacheBrowserContainer';
	divText.id = 'googleCacheBrowserText';
	closeDiv.id = 'googleCacheBrowserClose';
	document.body.appendChild(divContainer);
    document.body.appendChild(divText);
    document.body.appendChild(closeDiv);
}

if (document.readyState == 'complete'
		|| document.readyState == 'loaded'
		|| document.readyState == 'interactive') {
	if (document.getElementById('googleCacheBrowserTopBar') == null) {
		showSpinner();
	}
} else {
	document.addEventListener('DOMContentLoaded', function (event) {
		if (document.getElementById('googleCacheBrowserTopBar') == null) {
			showSpinner();
		}
	});
}
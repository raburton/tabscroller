'use strict';

const RIGHT_BUTTON = 2;

// flag to indicate we should block the context menu
let blockContextMenu = false;

// work around lack of mac button info on wheel event
let mac = false;
let macMouse = false;

// scroll rate limiting option
let limit = 0;
let lastScroll = 0;

// config defaults (should match defaults in options.js)
let keyAlt = false;
let keyCtrl = false;
let keyMeta = false;
let keyShift = false;
let btnMouse = true;

// load initial config
updateConfig();

// load the config needed in the content script
function updateConfig() {
	// get settings, default to current values
	browser.storage.local.get({
		mac: mac,
		alt: keyAlt,
		ctrl: keyCtrl,
		meta: keyMeta,
		shift: keyShift,
		mouse: btnMouse,
		limit: limit,
	}).then(result => {
		mac = result.mac;
		keyAlt = result.alt;
		keyCtrl = result.ctrl;
		keyMeta = result.meta;
		keyShift = result.shift;
		btnMouse = result.mouse;
		limit = +result.limit;
	});
}

// message from background to indicate tab has been scrolled
//   to and that we should disable the context menu for when
//   the user releases the mouse button
// or to indicate we need to update our config
browser.runtime.onMessage.addListener((message, sender) => {
	switch (message.topic) {
	case 'scrolledToTab':
		if (limit > 0) lastScroll = (new Date()).getTime();
		blockContextMenu = true;
		if (mac) macMouse = true;
		break;
	case 'updateConfig':
		updateConfig();
		break;
	}
	return false;
});

window.addEventListener('mousedown', function (event) {
	// re-enable context menu on right button press
	// (will be disabled again if users scrolls while holding)
	// and track right mouse button press on mac
	if (event.button === RIGHT_BUTTON) {
		if (mac) macMouse = true;
		if (blockContextMenu) blockContextMenu = false;
	}
}, true);

window.addEventListener('mouseup', function (event) {
	// track right mouse button release on mac
	if (mac && macMouse && (event.button === RIGHT_BUTTON)) {
		macMouse = false;
	}
}, true);

window.addEventListener('contextmenu', function (event) {
	// prevent context menu if we've been scrolling
	if (blockContextMenu) {
		event.preventDefault();
		event.stopPropagation();
	}
}, true);

window.addEventListener('wheel', function (event) {

	// only act if right mouse button held down
	// and/or required modifier keys (if any set)
	if (event.isTrusted &&
		(!btnMouse || ((event.buttons & RIGHT_BUTTON) || macMouse)) &&
		(!keyAlt || event.altKey) && (!keyShift || event.shiftKey) &&
		(!keyCtrl || event.ctrlKey) && (!keyMeta || event.metaKey)) {

		// prevent page scrolling
		event.preventDefault();
		event.stopPropagation();

		// prevent context menu when button released
		blockContextMenu = true;

		// if scroll limit set, check time since last scroll
		if (limit > 0) {
			let ms = (new Date()).getTime();
			if (ms < lastScroll + limit) return;
			lastScroll = ms;
		}

		// send tab scroll request to background
		if (event.deltaY > 0) {
			browser.runtime.sendMessage({
				topic: 'scrollDown'
			});
			if (mac) macMouse = false;
		} else if (event.deltaY < 0) {
			browser.runtime.sendMessage({
				topic: 'scrollUp'
			});
			if (mac) macMouse = false;
		}
	}

}, { passive: false });


'use strict';

const RIGHT_BUTTON = 2;

// flag to indicate we should block the context menu
let blockContextMenu = false;

// work around lack of mac button info
let mac = false;
let macHack = false;

// load initial config
updateConfig();

// load the config needed in the content script
function updateConfig() {
	browser.storage.local.get({
		mac: mac
	}).then(result => {
		mac = result.mac;
	});
}

// message from background to indicate tab has been scrolled
// to and that we should disable the context menu for when
// the user releases the mouse button
browser.runtime.onMessage.addListener((message, sender) => {
	switch (message.topic) {
	case 'scrolledToTab':
		blockContextMenu = true;
		if (mac) macHack = true;
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
	if (event.button === RIGHT_BUTTON) {
		if (mac) macHack = true;
		if (blockContextMenu) blockContextMenu = false;
	}
}, true);

window.addEventListener('mouseup', function (event) {
	// re-enable context menu on right button press
	// (will be disabled again if users scrolls while holding)
	if (mac && macHack && (event.button === RIGHT_BUTTON)) {
		macHack = false;
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
	if (event.isTrusted && ((event.buttons & RIGHT_BUTTON) || macHack)) {

		// prevent page scrolling
		event.preventDefault();
		event.stopPropagation();

		// prevent context menu when button released
		blockContextMenu = true;

		// send tab scroll request to background
		if (event.deltaY > 0) {
			browser.runtime.sendMessage({
				topic: 'scrollDown'
			});
			if (mac) macHack = false;
		} else if (event.deltaY < 0) {
			browser.runtime.sendMessage({
				topic: 'scrollUp'
			});
			if (mac) macHack = false;
		}
	}

}, true);

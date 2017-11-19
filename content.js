'use strict';

const RIGHT_BUTTON = 2;

// flag to indicate we should block the context menu
let blockContextMenu = false;

// message from background to indicate tab has been scrolled
// to and that we should disable the context menu for when
// the user releases the mouse button
browser.runtime.onMessage.addListener((message, sender) => {
	switch (message.topic) {
	case 'scrolledToTab':
		blockContextMenu = true;
		return true;
	}
	return false;
});

window.addEventListener('mousedown', function (event) {
	// re-enable context menu on right button press
	// (will be disabled again if users scrolls while holding)
	if (blockContextMenu && (event.button === RIGHT_BUTTON)) {
		blockContextMenu = false;
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
	if (event.isTrusted && (event.buttons & RIGHT_BUTTON)) {

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
		} else if (event.deltaY < 0) {
			browser.runtime.sendMessage({
				topic: 'scrollUp'
			});
		}
	}

}, true);

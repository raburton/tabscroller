'use strict';

// config defaults (should match defaults in option page)
let wrap = true;
let swap = false;

// load the config
updateConfig();
enableLinuxOSX();

function enableLinuxOSX() {
	if (browser.browserSettings.contextMenuShowEvent) {
		browser.browserSettings.contextMenuShowEvent.set({value: 'mouseup'});
	}
}

// switch to next tab and tell tab to block context menu
function nextTab() {
	browser.tabs.query({
		currentWindow: true
	}).then(tabs => {
		let next = tabs.find(tab => tab.active).index + 1;
		if (next >= tabs.length) {
			if (!wrap)
				return true;
			else
				next = 0;
		}
		browser.tabs.sendMessage(tabs[next].id, {
			topic: 'scrolledToTab'
		}).catch (error => {});
		browser.tabs.update(tabs[next].id, {
			active: true
		});
		return true;
	});
}

// switch to previous tab and tell tab to block context menu
function prevTab() {
	browser.tabs.query({
		currentWindow: true
	}).then(tabs => {
		let prev = tabs.find(tab => tab.active).index - 1;
		if (prev < 0) {
			if (!wrap)
				return true;
			else
				prev = tabs.length - 1;
		}
		browser.tabs.sendMessage(tabs[prev].id, {
			topic: 'scrolledToTab'
		}).catch (error => {});
		browser.tabs.update(tabs[prev].id, {
			active: true
		});
		return true;
	});
}

function updateConfig() {
	// get swap & wrap values, defaults to current values
	browser.storage.local.get({
		swap: swap,
		wrap: wrap
	}).then(result => {
		swap = result.swap;
		wrap = result.wrap;
	});
}

// receive messages from content script
browser.runtime.onMessage.addListener((message) => {
	switch (message.topic) {
	case 'scrollUp':
		(swap ? nextTab() : prevTab());
		break;
	case 'scrollDown':
		(swap ? prevTab() : nextTab());
		break;
	case 'updateConfig':
		updateConfig();
		break;
	}
	return false;
});

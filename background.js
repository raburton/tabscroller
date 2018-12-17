'use strict';

// config defaults (should match defaults in option page)
let wrap = true;
let swap = false;
let mac = false;

// load the config
updateConfig();
enableLinuxOSX();
browser.runtime.getPlatformInfo().then(checkPlatform);

function enableLinuxOSX() {
	if (browser.browserSettings.contextMenuShowEvent) {
		browser.browserSettings.contextMenuShowEvent.set({value: 'mouseup'});
	}
}

function checkPlatform(info) {
	let newMac = (info.os == "mac");
	if (mac != newMac) {
		browser.storage.local.set({
			mac: newMac
		});
		// notify content script in open tabs
		browser.tabs.query({}).then(tabs => {
			for (let i = 0; i < tabs.length; i++) {
				browser.tabs.sendMessage(tabs[i].id, {
					topic: 'updateConfig'
				});
			}
		});
	}
};

// switch to next tab and tell tab to block context menu
function nextTab() {
	browser.tabs.query({
		currentWindow: true,
		hidden: false
	}).then(tabs => {
		let next = tabs.findIndex(tab => tab.active) + 1;
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
		currentWindow: true,
		hidden: false
	}).then(tabs => {
		let prev = tabs.findIndex(tab => tab.active) - 1;
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
		wrap: wrap,
		mac: mac
	}).then(result => {
		swap = result.swap;
		wrap = result.wrap;
		mac = result.mac;
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

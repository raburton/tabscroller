'use strict';

// config defaults (should match defaults in option page)
let wrap = true;
let swap = false;
let mac = false;
let skipurls = {};
let skiploading = false;
let skipdiscarded = false;

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
	var query = {
		currentWindow: true,
		hidden: false,
	};
	if (skiploading) query['status'] = 'complete';
	if (skipdiscarded) query['discarded'] = false;
	browser.tabs.query(query).then(tabs => {
		let current = tabs.findIndex(tab => tab.active);
		let next = current + 1;
		while (true) {
			// past the last tab?
			if (next >= tabs.length) {
				if (!wrap) {
					return true;
				} else {
					next = 0;
				}
			}
			// lapped all the way around
			if (next == current) return true;
			// skip urls
			if (skipurls.indexOf(tabs[next].url) > -1) {
				next++;
				continue;
			}
			// if we get here, we have a tab to switch to
			break;
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
	var query = {
		currentWindow: true,
		hidden: false,
	};
	if (skiploading) query['status'] = 'complete';
	if (skipdiscarded) query['discarded'] = false;
	browser.tabs.query(query).then(tabs => {
		let current = tabs.findIndex(tab => tab.active);
		let prev = current - 1;
		while (true) {
			// before the first tab?
			if (prev < 0) {
				if (!wrap) {
					return true;
				} else {
					prev = tabs.length - 1;
				}
			}
			// lapped all the way around
			if (prev == current) return true;
			// skip urls
			if (skipurls.indexOf(tabs[prev].url) > -1) {
				prev--;
				continue;
			}
			// if we get here, we have a tab to switch to
			break;
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
	// get new config, defaulting to current values
	browser.storage.local.get({
		swap: swap,
		wrap: wrap,
		mac: mac,
		skipurls: skipurls,
		skiploading: skiploading,
		skipdiscarded: skipdiscarded,
	}).then(result => {
		swap = result.swap;
		wrap = result.wrap;
		mac = result.mac;
		skipurls = result.skipurls.split(/\r?\n/).filter(element => element);
		skiploading = result.skiploading;
		skipdiscarded = result.skipdiscarded;
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

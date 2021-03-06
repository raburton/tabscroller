'use strict';

function saveOptions(e) {
	e.preventDefault();
	
	// ensure at least one button/key selected
	if (!document.querySelector("#alt").checked &&
		!document.querySelector("#ctrl").checked &&
		!document.querySelector("#meta").checked &&
		!document.querySelector("#shift").checked &&
		!document.querySelector("#mouse").checked) {
		
		document.querySelector("#error").style = "display: block;";
		return;
	} else {
		document.querySelector("#error").style = "display: none;";
	}
	
	browser.storage.local.set({
		alt: document.querySelector("#alt").checked,
		swap: document.querySelector("#swap").checked,
		wrap: document.querySelector("#wrap").checked,
		ctrl: document.querySelector("#ctrl").checked,
		meta: document.querySelector("#meta").checked,
		shift: document.querySelector("#shift").checked,
		mouse: document.querySelector("#mouse").checked,
	});
	// notify background script
	browser.runtime.sendMessage({
		topic: 'updateConfig'
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

function restoreOptions() {
	// defaults should match those in content.js
	browser.storage.local.get({
		alt: false,
		swap: false,
		wrap: true,
		ctrl: false,
		meta: false,
		shift: false,
		mouse: true,
	}).then(result => {
		document.querySelector("#alt").checked = result.alt;
		document.querySelector("#swap").checked = result.swap;
		document.querySelector("#wrap").checked = result.wrap;
		document.querySelector("#ctrl").checked = result.ctrl;
		document.querySelector("#meta").checked = result.meta;
		document.querySelector("#shift").checked = result.shift;
		document.querySelector("#mouse").checked = result.mouse;
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);


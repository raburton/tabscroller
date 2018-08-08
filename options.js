'use strict';

function saveOptions(e) {
	e.preventDefault();
	browser.storage.local.set({
		swap: document.querySelector("#swap").checked,
		wrap: document.querySelector("#wrap").checked
	});
	// notify background script
	browser.runtime.sendMessage({
		topic: 'updateConfig'
	});
	/*// notify content script in open tabs
	browser.tabs.query({}).then(tabs => {
		for (let i = 0; i < tabs.length; i++) {
			browser.tabs.sendMessage(tabs[i].id, {
				topic: 'updateConfig'
			});
		}
	});*/
}

function restoreOptions() {
	browser.storage.local.get({
		swap: false,
		wrap: true
	}).then(result => {
		document.querySelector("#swap").checked = result.swap;
		document.querySelector("#wrap").checked = result.wrap;
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

'use strict';

const permissionsToRequest = {
  permissions: ["tabs"],
}

function requestPermissions() {
	function onResponse(response) {
		if (response) {
			document.querySelector("#tabpermerror").style = "display: none;";
		} else {
			document.querySelector("#tabpermerror").style = "display: block; color: red;";
		}
	}
	browser.permissions.request(permissionsToRequest).then(onResponse);
}

function saveOptions(e) {
	e.preventDefault();
	
	let invalid = false;
	
	// ensure at least one button/key selected
	if (!document.querySelector("#alt").checked &&
		!document.querySelector("#ctrl").checked &&
		!document.querySelector("#meta").checked &&
		!document.querySelector("#shift").checked &&
		!document.querySelector("#mouse").checked) {
		
		document.querySelector("#error").style = "display: block; color: red;";
		invalid = true;
	} else {
		document.querySelector("#error").style = "display: none;";
	}
	
	if (document.querySelector("#limit").value < 0 ||
		document.querySelector("#limit").value > 1000) {
		
		document.querySelector("#limiterror").style = "display: block; color: red;";
		invalid = true;
	} else {
		document.querySelector("#limiterror").style = "display: none;";
	}
	
	if (invalid) return;
	
	if (document.querySelector("#skipurls").value.length > 0) requestPermissions();
	
	browser.storage.local.set({
		alt: document.querySelector("#alt").checked,
		swap: document.querySelector("#swap").checked,
		wrap: document.querySelector("#wrap").checked,
		ctrl: document.querySelector("#ctrl").checked,
		meta: document.querySelector("#meta").checked,
		shift: document.querySelector("#shift").checked,
		mouse: document.querySelector("#mouse").checked,
		limit: document.querySelector("#limit").value,
		skipurls: document.querySelector("#skipurls").value,
		skiploading: document.querySelector("#skiploading").checked,
		skipdiscarded: document.querySelector("#skipdiscarded").checked,
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
		limit: 0,
		skipurls: "",
		skiploading: false,
		skipdiscarded: false,
	}).then(result => {
		document.querySelector("#alt").checked = result.alt;
		document.querySelector("#swap").checked = result.swap;
		document.querySelector("#wrap").checked = result.wrap;
		document.querySelector("#ctrl").checked = result.ctrl;
		document.querySelector("#meta").checked = result.meta;
		document.querySelector("#shift").checked = result.shift;
		document.querySelector("#mouse").checked = result.mouse;
		document.querySelector("#limit").value = result.limit;
		document.querySelector("#skipurls").value = result.skipurls;
		document.querySelector("#skiploading").checked = result.skiploading;
		document.querySelector("#skipdiscarded").checked = result.skipdiscarded;
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);


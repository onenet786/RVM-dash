
const sendMsg = (msg) => {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(msg, function (response) {
			resolve(response);
		});
	});
}

(async () => {
	await sendMsg({ command: 'counter', TYPE: 'CLEAR' });
	chrome.storage.local.get('ADwhiteList', function (r) {
		// console.log('ad白名单: ' + r.ADwhiteList);
		let temparr = r.ADwhiteList;
		let domain = location.host;
		domain = domain.replace('www.', '');
		if (temparr.indexOf(domain) >= 0) {
			sendMsg({ action: 'refreshADcombox', command: 'counter', checked: true });
		} else {
			sendMsg({ action: 'refreshADcombox', command: 'counter', checked: false });
		}

	})
	let buzy = false;
	setInterval(async () => {
		if (buzy) return;
		buzy = true;
		await sendMsg({ command: 'counter', TYPE: 'COUNT' });
		buzy = false;
	}, 1000);
})();




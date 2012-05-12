var state = new wine.models.State();

//Style top bar and tab bar
forge.topbar.setTint([88,22,43,255]);
forge.tabbar.setActiveTint([88,22,43,255]);

forge.tabbar.addButton({
	text: "Rate Wine",
	icon: "img/star.png",
	index: 0
}, function (button) {
	state.set('rateButton', button);
	button.onPressed.addListener(function () {
		wine.router.navigate('rateTab', { trigger: true });
	});
	
	// Initialise app
	forge.prefs.keys(function(array) {
		if ($.inArray('wine', array) > -1) {
			forge.prefs.get('wine', function(photos) {
				wine.photos = new wine.collections.Photos(photos);
				wine.util.initialize();
			});
		} else {
			/* handle migration from v0.1 */
			if (localStorage.wine) {
				wine.photos = new wine.collections.Photos(JSON.parse(localStoreage.wine));
				forge.prefs.set('wine', wine.photos.toArray());
				localStorage.clear();
			} else {
				wine.photos = new wine.collections.Photos();
			}
			wine.util.initialize();
		}
	});
});

forge.tabbar.addButton({
	text: "Wine List",
	icon: "img/bottle.png",
	index: 1
}, function (button) {
	state.set('listButton', button);
	button.onPressed.addListener(function () {
		wine.router.navigate('listTab', { trigger: true });
	});
});

forge.tabbar.addButton({
	text: "Wine Map",
	icon: "img/map.png",
	index: 2
}, function (button) {
	state.set('mapButton', button);
	button.onPressed.addListener(function () {
		wine.router.navigate('mapTab', { trigger: true });
	});
});
forge.enableDebug();

var state = new wine.models.State();

if (forge.is.web()) {
	forge.topbar.show();
	forge.topbar.setTitle('Wine List');
}

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

$ = $ || Zepto;
wine.initialize();
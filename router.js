// Router
wine.types.Router = Backbone.Router.extend({
	routes: {
		"rateTab": "rateTab",
		"listTab": "listTab",
		"mapTab": "mapTab",
		"mapTab/:idx": "mapTab",
		"picture": "picture",
		"rate": "rate",
		"detail/:idx": "detail"
	},
	rateTab: function() {
		state.get('rateButton').setActive();
		forge.topbar.setTitle("Rate Wine");
		if (!state.get('currentPhoto')) {
			wine.router.navigate('picture', { trigger: true });
		} else {
			wine.router.navigate('rate', { trigger: true });
		}
	},
	listTab: function() {
		state.get('listButton').setActive();
		forge.topbar.setTitle("Wine List");
		state.get('list').show();
	},
	mapTab: function(idx) {
		state.get('mapButton').setActive();
		forge.topbar.setTitle("Wine Map");
		state.get('map').show(idx);
	},
	picture: function () {
		state.set('currentPhoto', null);
		var page = new wine.views.Picture();
		page.render().show();
	},
	rate: function() {
		var page = new wine.views.Rate();
		page.render().show();
	},
	detail: function(idx) {
		forge.logging.log('... Showing detail for index: '+idx);
		var page = new wine.views.Detail();
		page.render(idx).show();
	}
});
wine.router = new wine.types.Router();
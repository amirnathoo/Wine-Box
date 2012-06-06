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
		forge.is.mobile() && state.get('rateButton').setActive();
		forge.topbar.setTitle("Rate Wine");
		if (state.get('currentPhoto')) {
			var page = new wine.views.Rate();
		} else {
			var page = new wine.views.Picture();
		}
		page.render().show();
	},
	listTab: function() {
		forge.is.mobile() && state.get('listButton').setActive();
		forge.topbar.setTitle("Wine List");
		state.get('list').show();
	},
	mapTab: function(idx) {
		forge.is.mobile() && state.get('mapButton').setActive();
		forge.topbar.setTitle("Wine Map");
		state.get('map').show(idx);
	},
	detail: function(idx) {
		forge.logging.log('... Showing detail for index: '+idx);
		var page = new wine.views.Detail();
		page.render(idx).show();
	}
});
wine.router = new wine.types.Router();
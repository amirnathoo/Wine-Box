// Models
wine.models.Photo = Backbone.Model.extend({});
wine.models.State = Backbone.Model.extend({});

// Collections
wine.collections.Photos = Backbone.Collection.extend({
	model: wine.models.Photo,
	comparator: function (model) {
		return -model.get('timestamp');
	}
});
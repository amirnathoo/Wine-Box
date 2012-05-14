//Fake support of :active on Android
var fake_active = function(el) {
	if (forge.is.android() && $(el).hasClass('listenactive')) {
		$(el).bind("touchstart", function () {
			$(this).addClass("active");
		}).bind("touchend", function() {
			$(this).removeClass("active");
		});
	}
}

// Setup "sensible" click/touch handling
var clickEvent = 'ontouchend' in document.documentElement ? 'tap' : 'click';

if (clickEvent == 'tap') {
	var currentTap = true;
	$('*').live('touchstart', function (e) {
		currentTap = true;
		e.stopPropagation();
	});
	$('*').live('touchmove', function (e) {
		currentTap = false;
	});
	$('*').live('touchend', function (e) {
		if (currentTap) {
			$(e.currentTarget).trigger('tap');
		}
		e.stopPropagation();
	});
}

// Organisation object
var wine = {
	types: {},
	views: {},
	models: {},
	collections: {},
	router: null,
	util: {
		initialize: function() {
			forge.logging.log('Initializing...')
			wine.photos.on("add", function(photo) {
				state.get('list').add(photo);
				forge.prefs.set('wine', wine.photos.toArray());
			});
			state.set('list', new wine.views.List());
			state.get('list').render();
			forge.logging.log('Pre-rendered wine list');
			state.set('map', new wine.views.Map());
			state.get('map').render();
			forge.logging.log('Pre-rendered map');
			Backbone.history.start();
			wine.router.navigate("rateTab", { trigger: true});
			forge.logging.log('... completed initialization');
		},
		disclosure_indicator: function(el) {
			forge.tools.getURL('img/disclosure_indicator.png', function(src) {
				$('img.icon', el).attr('src', src);
			});
		},
		handleRatingClick: function(rating, el) {
			$('label', el).removeClass('no_star');
			$('label', el).each(function(idx, el) {
				if (parseInt($(el).attr('class').split('_')[1]) > rating) {
					$(el).addClass('no_star');
				}
			});
		},
		getLocation: function(coords, timestamp) {
			forge.request.ajax({
				url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+coords.latitude+","+coords.longitude+"&sensor=true",
				dataType: "json",
				success: function(response) {
					try {
						var photo = wine.photos.filter(function(item) {
							return item.get('timestamp') == timestamp;
						})[0];
						if (photo) {
							photo.set('location', response.results[0].formatted_address);
							$('#_'+timestamp+' .title').html(photo.get('location'));
						} else {
							forge.logging.log('No photo with timestamp: '+timestamp);
						}
					} catch(e) {
						forge.logging.log('--- Exception getting location --- ');
						forge.logging.log(e);
						forge.logging.log('--- Photo:');
						forge.logging.log(photo);
						forge.logging.log('--- Response:');
						forge.logging.log(response);
					}
				},
				error: function(response) {
					forge.logging.log('--- Error getting location, response:');
					forge.logging.log(response);
				}
			});
		},
		initMap: function() {
			forge.logging.log('Google Maps API loaded');
			state.get('map').initMap();
		},
		resetCurrentView: function(view) {
			forge.topbar.removeButtons();
			if (state.get('currentView')) {
				state.get('currentView').close();
			}
			state.set('currentView', view);
		}
	}
};
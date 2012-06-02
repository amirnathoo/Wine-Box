forge.enableDebug();
//TODO - test migration, test add photo, test synching between phones, test deletion sycnhing, test offline

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
	publicFirebase: null,
	userFirebase: null,
	user: null,
	util: {
		initialize: function() {
			forge.logging.log('Initializing...');
			wine.util.initUser(function() {
				wine.util.initStorage();
				wine.util.preRenderViews();
				Backbone.history.start();
				if (forge.is.mobile()) {
					if (state.get('rateButton')) {
						wine.router.navigate("rateTab", { trigger: true});
						forge.logging.log('... completed initialization');
					} else {
						window.initInterval = setInterval(function() {
							if (state.get('rateButton')) {
								wine.router.navigate("rateTab", { trigger: true});
								forge.logging.log('... completed initialization');
								clearInterval(window.initInterval);
							} 
						}, 200);
					}
				}
				if (forge.is.web()) {
					wine.router.navigate("listTab", { trigger: true});
				}
			});
		},
		initUser: function(cb) {
			forge.prefs.get('user', function(user) {
				wine.user = user || wine.util.getUUID();
				forge.prefs.set('user', wine.user);
				cb();
			});
		},
		getUUID: function() {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0;
				var v = c == "x" ? r : (r & 0x3 | 0x8);
				return v.toString(16);
				}).toUpperCase();
		},
		initStorage: function() {
			//Initialize Firebase
			wine.publicFirebase = new Firebase('http://gamma.firebase.com/winebox/public');
			wine.userFirebase = new Firebase('http://gamma.firebase.com/winebox').child(wine.user);
			//Initialize collection
			if (localStorage.wine) {
				//Handle migration
				wine.photos = new wine.collections.Photos(JSON.parse(localStoreage.wine));
				wine.photos.forEach(function(photo) {
					photo.set('user', wine.user);
					wine.publicFirebase.child(photo.get('timestamp')).set(photo.toJSON());
					wine.userFirebase.child(photo.get('timestamp')).set(photo.toJSON());
				});
				localStorage.clear();
			} else {
				wine.photos = new wine.collections.Photos();
				wine.userFirebase.once('value', function(snapshot) {
					snapshot.forEach(function(photo) {
						wine.photos.add(new wine.models.Photo(photo.val()));
					});
				});
				
			}
			//Add event handlers
			wine.photos.on("add", function(photo) {
				photo.set('user', wine.user);
				state.get('list').add(photo);
				wine.publicFirebase.child(photo.get('timestamp')).set(photo.toJSON());
				wine.userFirebase.child(photo.get('timestamp')).set(photo.toJSON());
			});
			wine.photos.on("remove", function() {
				state.get('list').removeByIndex(state.get('idx'));
				wine.publicFirebase.child(this.get('timestamp')).remove();
				wine.userFirebase.child(this.get('timestamp')).remove();	
			});
			wine.userFirebase.on("child_added", function(child) {
				if (child.user === wine.user && !state.get('list').exists(child.timestamp)) {
					var photo = wine.models.Photo(child);
					state.get('list').add(photo);
				}
			});	
			wine.userFirebase.on("child_removed", function(child) {
				if (child.user === wine.user) {
					state.get('list').removeByTimestamp(child.get(timestamp));
				}
			});
		},
		preRenderViews: function() {
			state.set('list', new wine.views.List());	
			state.get('list').render();
			forge.logging.log('Pre-rendered wine list');
			state.set('map', new wine.views.Map());
			state.get('map').render();
			forge.logging.log('Pre-rendered map');
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
		},
		showDetailIcon: function(el) {
			forge.tools.getURL('img/detail_disclosure.jpg', function(src) {
				$('.detail_icon', el).each(function(idx, item) {
					$(item).attr('src', src);
				});
			});
		}
	}
};
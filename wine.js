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
var clickEvent = 'ontouchend' in document.documentElement && forge.is.mobile() ? 'tap' : 'click';

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
	initialize: function() {
		forge.logging.log('Initializing...');
		wine.initUser(function() {
			state.set('list', new wine.views.List());	
			state.get('list').render();
			forge.logging.log('Pre-rendered wine list');
			state.set('map', new wine.views.Map());
			state.get('map').render();
			forge.logging.log('Pre-rendered map');
			wine.initStorage();
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
			forge.logging.log('User: '+user);
			wine.user = user || wine.getUUID();
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
		forge.logging.log('... Start initStorage');
		//Initialize Firebase
		wine.publicFirebase = new Firebase('http://gamma.firebase.com/winebox/public');
		wine.userFirebase = new Firebase('http://gamma.firebase.com/winebox/'+wine.user);
		wine.photos = new wine.collections.Photos();
		//Initialize collection
		if (localStorage.wine) {
			forge.logging.log('Migrating storage');
			//Handle migration
			wine.photos = new wine.collections.Photos(JSON.parse(localStorage.wine));
			wine.photos.forEach(function(photo) {
				photo.set('user', wine.user);
				wine.publicFirebase.child(photo.get('timestamp')).set(photo.toJSON());
				wine.userFirebase.child(photo.get('timestamp')).set(photo.toJSON());
			});
			localStorage.clear();
		} else {
			forge.logging.log('Read from  Firebase');
			var firebase = forge.is.web()? wine.publicFirebase: wine.userFirebase;
			firebase.once('value', function(snapshot) {
				forge.logging.log('firebase.once triggered');
				$('#loading').remove();
				snapshot.forEach(function(photo) {
					forge.logging.log('Adding photo');
					var photo_model = new wine.models.Photo(photo.val());
					if (photo_model.get('user') === wine.user && photo_model.has('dataurl')) {
						wine.setDataUrl(photo_model.get('url'), photo_model.get('timestamp'));
					}
					wine.photos.add(photo_model);
					state.get('list').add(photo_model);
					forge.logging.log('Added photo from Firebase');
				});
			});
		}
		//Add event handlers
		wine.photos.on("remove", function(photo) {
			state.get('list').removeByIndex(state.get('idx'));
			wine.publicFirebase.child(photo.get('timestamp')).remove();
			wine.userFirebase.child(photo.get('timestamp')).remove();	
		});
	},
	setDataUrl: function(src, timestamp) {
		// create image
		var image = document.createElement('img');

		// set src using remote image location
		image.src = src;

		// wait til it has loaded
		image.onload = function (){

			// set up variables
			var fWidth = image.width;
			var fHeight = image.height;

			// create canvas
			var canvas = document.createElement('canvas');
			canvas.id = 'canvas';
			canvas.width = fWidth;
			canvas.height = fHeight;
			var context = canvas.getContext('2d');

			// draw image to canvas
			context.drawImage(image, 0, 0, fWidth, fHeight, 0, 0, fWidth, fHeight);

			// get data url 
			var dataurl = canvas.toDataURL('image/jpeg');
			
			//set data url in Firebase
			wine.publicFirebase.child(timestamp).child('dataurl').set(String(dataurl));
			wine.userFirebase.child(timestamp).child('dataurl').set(String(dataurl));
			forge.logging.log('Set data url for: '+timestamp);
			forge.logging.log(String(dataurl));
		}
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
};
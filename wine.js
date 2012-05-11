// Current state
var state = {
	currentPhoto: null,
	rateButton: null,
	listButton: null,
	currentCoords: null,
	currentMarker: null,
	item: null
}

// Organisation object
var wine = {
	types: {},
	views: {},
	models: {},
	collections: {}
};

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

//Style top bar and tab bar
forge.topbar.setTint([88,22,43,255]);
forge.tabbar.setActiveTint([88,22,43,255]);

var starterButton = forge.tabbar.addButton({
	text: "Rate Wine",
	icon: "img/star.png",
	index: 0
}, function (button) {
	state.rateButton = button;
	button.onPressed.addListener(function () {
		wine.router.rateTab();
	});
	
	// Initialise app
	wine.util.initialize();
});

var mainButton = forge.tabbar.addButton({
	text: "Wine List",
	icon: "img/bottle.png",
	index: 1
}, function (button) {
	state.listButton = button;
	button.onPressed.addListener(function () {
		wine.router.listTab();
	});
});

var mapButton = forge.tabbar.addButton({
	text: "Wine Map",
	icon: "img/map.png",
	index: 2
}, function (button) {
	state.mapButton = button;
	button.onPressed.addListener(function () {
		wine.router.mapTab();
	});
});

// Router
wine.types.Router = Backbone.Router.extend({
	routes: {
		"rateTab": "rateTab",
		"picture": "picture",
		"rate": "rate"
	},
	rateTab: function() {
		state.rateButton.setActive();
		forge.topbar.setTitle("Rate Wine");
		forge.topbar.removeButtons();
		if (state.currentPhoto === null) {
			wine.router.picture();
		} else {
			wine.router.rate();
		}
	},
	listTab: function() {
		state.listButton.setActive();
		forge.topbar.setTitle("Wine List");
		forge.topbar.removeButtons();
		state.list.show();
	},
	mapTab: function(back, item) {
		state.mapButton.setActive();
		forge.topbar.setTitle("Wine Map");
		forge.topbar.removeButtons();
		state.map.show(back, item);
	},
	picture: function () {
		forge.topbar.removeButtons();
		state.currentPhoto = null;
		var page = new wine.views.Picture();
		page.render().show();
	},
	rate: function() {
		forge.topbar.removeButtons();
		var page = new wine.views.Rate();
		page.render().show();
	},
	detail: function(idx, back, nomap) {
		forge.logging.log('... Showing detail for index: '+idx);
		forge.topbar.removeButtons();
		var page = new wine.views.Detail();
		page.render(idx).show(back, nomap);
	}
});
wine.router = new wine.types.Router();

// Functions
wine.util = {
	initialize: function() {
		forge.logging.log('Initializing...')
		state.list = new wine.views.List();
		state.list.render();
		forge.logging.log('Pre-rendered wine list');
		state.map = new wine.views.Map();
		state.map.render();
		forge.logging.log('Pre-rendered map');
		wine.router.rateTab();
		Backbone.history.start();
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
	}
}

// Models
wine.models.Photo = Backbone.Model.extend({
});

// Collections
wine.collections.Photos = Backbone.Collection.extend({
	model: wine.models.Photo,
	comparator: function (model) {
		return -model.get('timestamp');
	}
});
wine.photos = (localStorage.photos)? 
	new wine.collections.Photos(JSON.parse(localStorage.photos)): 
	new wine.collections.Photos();
wine.photos.on("add", function(photo) {
	state.list.add(photo);
	localStorage.photos = JSON.stringify(wine.photos.toArray());
});

// Views
wine.views.Picture = Backbone.View.extend({
	tagName: "div",
	id: "picture",
	render: function() {
		var el = this.el;
		$(el).html('<div id="choosephoto" class="step center listenactive"><div class="label">1.</div><div class="instruction">Take picture of label</div><img class="icon"></img></div>');
		wine.util.disclosure_indicator(el);
		if (wine.photos.length) {
			var src = wine.photos.at(0).get('url');
			$(el).attr('style', 'width:100%;height:100%;background-image:url('+src+');background-size:cover;');
		} else {
			forge.tools.getURL('img/wine.jpg', function(src) {
				$(el).attr('style', 'width:100%;height:100%;background-image:url('+src+');background-size:cover;');
			});
		}
		$('#choosephoto', el).bind(clickEvent, this.choose);
		fake_active($('#choosephoto', el));
		return this;
	},
	show: function () {
		$('.container').hide();
		$('#rate_container').show();
		$('#picture').remove();
		$('#rate').remove();
		$('#detail').remove();
		$('#rate_container').append(this.el);
	},
	choose: function () {
		var self = this;
		self.selImage = undefined;
		forge.file.getImage({width: 500, height: 500}, function (file) {
			forge.file.imageURL(file, function (url) {
				forge.logging.log('Got photo with url: '+url);
				forge.geolocation.getCurrentPosition(function(position) {
					state.currentCoords = position.coords;
					forge.logging.log('Set current position:');
					forge.logging.log(state.currentCoords);
					var timestamp = new Date().getTime()
					state.currentPhoto = new wine.models.Photo({
						url: url,
						timestamp: timestamp,
						position: state.currentCoords
					});
					wine.router.rate();
				});
			});
		});
	}
});

wine.views.Rate = Backbone.View.extend({
	tagName: "div",
	id: "rate",
	render: function() {
		forge.topbar.addButton({
			text: 'Back',
			position: 'left'
		}, function() {
			wine.router.picture();
		});
		var el = this.el;
		$(el).html('<div class="ratephoto step center listenactive"></div>');
		$(el).attr('style', 'width:100%;height:100%;background-image:url('+state.currentPhoto.get('url')+');background-size:cover;');
		if (state.currentPhoto.get('rating')) {
			this.rate();
		} else {
			$('.ratephoto', el).html('<div class="label">2.</div><div class="instruction">Rate wine</div><img class="icon">');
			wine.util.disclosure_indicator(el);
			fake_active($('.ratephoto', el));
			$('.ratephoto', el).bind(clickEvent, this.rate);
		}
		return this;
	},
	show: function () {
		$('.container').hide();
		$('#rate_container').show();
		$('#picture').remove();
		$('#rate').remove();
		$('#detail').remove();
		$('#rate_container').append(this.el);
	},
	rate: function() {
		function addSaveButton() {
			forge.topbar.addButton({
				text: 'Save',
				position: 'right'
			}, function() {
				wine.photos.add(state.currentPhoto);
				state.currentPhoto = null;
				wine.router.listTab();
			});
		}
		
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('#rate_container .ratephoto').unbind(clickEvent, this.rate);
			$('#rate_container .ratephoto').removeClass('listenactive');
			$('#rate_container .ratephoto').html('<fieldset><div><label class="_1"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="1_5"> 1/5</label><br><label class="_2"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="2_5"> 2/5</label><br><label class="_3"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="3_5"> 3/5</label><br><label class="_4 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="4_5"> 4/5</label><br><label class="_5 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="5_5"> 5/5</label></div></fieldset>');
			$('#rate_container .ratephoto img').bind(clickEvent, function(ev) {
				forge.logging.log('... Set rating');
				var rating = parseInt($(ev.target).parent().attr('class').split('_')[1])
				forge.logging.log(rating);
				wine.util.handleRatingClick(rating, $('#rate'));
				state.currentPhoto.set('rating', rating);
				addSaveButton();
			});
			if (state.currentPhoto.get('rating')) {
				wine.util.handleRatingClick(state.currentPhoto.get('rating'), $('#rate'));
				addSaveButton();
			}
		});
		return this;
	}
});

wine.views.List = Backbone.View.extend({
	tagName: "div",
	id: "list",
	template: '<div id="_{{timestamp}}" class="step left listenactive"><img class="detail_icon" /><div class="image_wrapper"><img src="{{url}}"></div><div class="title">{{location}}</div><div class="ratephoto">{{rating}}</div></div>',
	render: function() {
		var el = this.el;
		var obj = { "list": wine.photos.toJSON() }; 
		var output = Mustache.render('{{#list}}'+this.template+'{{/list}}', obj);
		$(el).html(output);
		$('#list_container').append(el);
		this.displayItem($('.ratephoto', el));
		return this;
	},
	add: function(photo) {
		var el = this.el;
		$(el).prepend(Mustache.render(this.template, photo.toJSON()));
		this.displayItem($('.ratephoto', el).first());
		state.map.add(photo);
	},
	displayItem: function(items) {
		var el = this.el;
		forge.tools.getURL('img/sprite.gif', function(src) {
			$(items).each(function(idx, item) {
				var rating = parseInt($(item).text());
				$(item).html('<fieldset><div><label class="_1"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="1_5"> 1/5</label><br><label class="_2"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="2_5"> 2/5</label><br><label class="_3"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="3_5"> 3/5</label><br><label class="_4 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="4_5"> 4/5</label><br><label class="_5 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="5_5"> 5/5</label></div></fieldset>');
				fake_active(item);
				wine.util.handleRatingClick(rating, $(item));
				var photo = wine.photos.at(idx);
				$(item).parent().bind(clickEvent, function() {
					wine.router.detail(wine.photos.indexOf(photo), wine.router.listTab);
				});
			});
		});
		forge.tools.getURL('img/detail_disclosure.jpg', function(src) {
			$('.detail_icon', el).each(function(idx, item) {
				$(item).attr('src', src);
			});
		});
	},
	show: function () {
		$('.container').hide();
		$('#list_container').show();
		$('#list').show();
		$('#detail').remove();
		forge.topbar.addButton({
			text: 'Map',
			position: 'left'
		}, function() {
			wine.router.mapTab(wine.router.listTab);
		});
		forge.topbar.addButton({
			text: 'Add',
			position: 'right'
		}, function() {
			wine.router.rateTab();
		});
		wine.photos.forEach(function(item) {
			if (!item.has('location')) {
				forge.logging.log('... Getting location');
				wine.util.getLocation(item.get('position'), item.get('timestamp'));
			}
		});
	}
});

wine.views.Detail = Backbone.View.extend({
	tagName: "div",
	id: "detail",
	render: function(idx) {
		var el = this.el;
		state.item = wine.photos.at(idx);
		var src = state.item.get('url');
		$(el).html(Mustache.render('<div id="_{{timestamp}}" class="step left listenactive"><div class="title">{{location}}</div><div class="ratephoto">{{rating}}</div></div>', {
			url: src,
			rating: wine.photos.at(idx).get('rating'),
			location: wine.photos.at(idx).get('location')
		}));
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('.ratephoto', el).each(function(idx, item) {
				var rating = parseInt($(item).text());
				$(item).html('<fieldset><div><label class="_1"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="1_5"> 1/5</label><br><label class="_2"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="2_5"> 2/5</label><br><label class="_3"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="3_5"> 3/5</label><br><label class="_4 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="4_5"> 4/5</label><br><label class="_5 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="5_5"> 5/5</label></div></fieldset>');
				wine.util.handleRatingClick(rating, $(item));
			});
		});
		$(el).append('<img class="detail" src="'+src+'" />');
		return this;
	},
	show: function (back, nomap) {
		$('.container').hide();
		$('#list_container').show();
		$('#list').hide();
		$('#detail').remove();
		$('#list_container').append(this.el);
		forge.topbar.setTitle('Wine Detail');
		back = back || wine.router.listTab;
		forge.topbar.addButton({
			text: 'Back',
			position: 'left'
		}, function() {
			back();
		});
		if (!nomap) {
			forge.topbar.addButton({
				text: 'Map',
				position: 'right'
			}, function() {
				wine.router.mapTab(null, state.item)
			});
		}
	}
});

wine.views.Map = Backbone.View.extend({
	tagName: "div",
	id: "map",
	gmap: null,
	render: function(idx) {
		var el = this.el;
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyAlFSCee70OJOiD7k-fz8e6ywXVVIkWErU&sensor=true&callback=state.map.initMap";
		document.body.appendChild(script);
		$('#map_container').append(el);
		return this;
	},
	initMap: function() {
		forge.logging.log('... Initializing map');
		forge.geolocation.getCurrentPosition(function(position) {
			$(this.el).empty();
			state.currentCoords = position.coords;
			forge.logging.log('Set current position:');
			forge.logging.log(state.currentCoords);
			var latLng = new google.maps.LatLng(state.currentCoords.latitude, state.currentCoords.longitude, true);
			var myOptions = {
				zoom: 15,
				center: latLng,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			}
			state.map.gmap = new google.maps.Map(document.getElementById('map'), myOptions);
			forge.tools.getURL('img/blue-pin.png', function(src) {
				state.currentMarker = new google.maps.Marker({
					position: latLng,
					title: "Current Position",
					icon: src,
					map: state.map.gmap,
					zIndex: -1
				});
			});
			wine.photos.each(state.map.add);
			forge.logging.log('Created map ...');
		});
	},
	add: function(item) {
		var latLng = new google.maps.LatLng(item.get('position').latitude, item.get('position').longitude, true);
		var marker = new google.maps.Marker({
			position: latLng,
			map: state.map.gmap,
			zIndex: 1
		});
		var idx = wine.photos.indexOf(item)
		google.maps.event.addListener(marker, 'click', function() {
			wine.router.detail(idx, function() {
				wine.router.mapTab();
			}, true);
		});
	},
	show: function(back, item) {
		$('.container').hide();
		$('#map_container').show();
		$('#detail').remove();
		if (state.map.gmap) {
			google.maps.event.trigger(state.map.gmap, 'resize');
			if (item) {
				var latLng = new google.maps.LatLng(item.get('position').latitude, item.get('position').longitude, true);
				state.map.gmap.setCenter(latLng);
			} else {
				var latLng = new google.maps.LatLng(state.currentCoords.latitude, state.currentCoords.longitude, true);
				state.map.gmap.setCenter(latLng);
			}
			state.currentMarker.setPosition(latLng);
		} else {
			this.initMap();
			$('#map').html('<div class="title">Loading...</div>');
		}
		if (item) {
			forge.topbar.addButton({
				text: 'Back',
				position: 'left'
			}, function() {
				wine.router.detail(wine.photos.indexOf(item));
			});
		} else if (back) {
			forge.topbar.addButton({
				text: 'Back',
				position: 'left'
			}, back);
		}
	}
});
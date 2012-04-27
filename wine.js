forge.debug = true;

//Style top bar and tab bar

//TODO - check when there is a fix in the platform
/*forge.topbar.setTint([88,22,43,0]);
forge.tabbar.setTint([88,22,43,0]); */

//Fake support of :active on Android
var fake_active = function(el) {
	if (forge.is.android()) {
		$(el).bind("touchstart", function () {
			$(this).addClass("active");
		}).bind("touchend", function() {
			$(this).removeClass("active");
		});
	}
}

//Instrument tab bar for transitions
var scrollTop = function () {
	setTimeout(function () {
		document.body.scrollTop = 0;
	}, 0);
}
var updateView = function (search) {
	scrollTop();
}

var starterButton = forge.tabbar.addButton({
	text: "Rate Wine",
	icon: "img/star.png",
	index: 0
}, function (button) {
	button.onPressed.addListener(function () {
		updateView("rate");
		forge.topbar.setTitle("Rate Wine");
	});
	button.setActive();
	updateView("rate");
	forge.topbar.setTitle("Rate Wine");
});

var mainButton = forge.tabbar.addButton({
	text: "My Wine",
	icon: "img/bottle.png",
	index: 1
}, function (button) {
	button.onPressed.addListener(function () {
		updateView("list");
		forge.topbar.setTitle("My Wine");
	});
});

// Constants used for configuration
var config = {
	parseAppId: 'QD9yEg6rZdAtirdSn02QQDFJp57pDnLfmwHqP4xa',
	parseRestKey: 'ZstsmIqn3BoShHopKGTSVdOPv7TrNk1NrjQjnb1P',
	defaultStream: 'launch',
	pageSize: 23
};

// Current state
var state = {
	animating: false,
	index: 0,
	location: null,
	stream: null,
	pageNum: 1
};

// Organisation object
var wine = {
	types: {},
	views: {},
	models: {},
	collections: {}
};

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

// Treat span.a like <a>
$('span.a').live(clickEvent, function () {
	window.location.hash = $(this).attr('data-href');
});

// TODO: Tidy up, currently just keeps track of any active ajax requests and shows a loading message
var loadCount = 0;
var loading = function () {
	loadCount++;
	$('#loading').show();
};
var loaded = function () {
	loadCount--;
	if (loadCount < 1) {
		$('#loading').hide();
	}
};

var updatePhotos = function(increment) {
	state.pageNum = parseInt(state.pageNum, 10) + increment;
	var targetClassName = 'photoPage' + state.pageNum;
	setupNav();

	$('.loadedPhoto').each(function() {
		if($(this).attr('class').indexOf(targetClassName) != -1) {
			$(this).fadeIn('slow');
		} else {
			$(this).hide();
		}
	});
};

var setupNav = function () {
	if(state.pageNum > 1) {
		$('#prev-link').show();
	} else {
		$('#prev-link').hide();
	}
	if(wine.photos.length > state.pageNum * config.pageSize) {
		$('#next-link').show();
	} else {
		$('#next-link').hide();
	}
	if($('#prev-link').is(":visible") && $('#next-link').is(":visible")) {
		$('#nav-divider').show();
	} else {
		$('#nav-divider').hide();		
	}

	$('#next-link').unbind(clickEvent).bind(clickEvent, function(e) {
		e.preventDefault();
		updatePhotos(1);
	});
	$('#prev-link').unbind(clickEvent).bind(clickEvent, function(e) {
		e.preventDefault();
		updatePhotos(-1);
	});
};

// TODO: forge.geolocation should work everywhere, iOS only for now
if (forge.is.ios()) {
	forge.geolocation.getCurrentPosition(function (loc) {
		state.location = loc.coords
	});
} else if (forge.is.mobile() && navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(function (loc) {
		state.location = loc.coords
	});
}

// Router
wine.types.Router = Backbone.Router.extend({
	routes: {
		"": "upload",
		"upsell": "upsell",
		"upload": "upload",
		"photo/:stream/:photoId": "photo",
		"stream/:stream": "stream"
	},
	listStreams: function () {
		$('#streams').show();
		$('#photos').hide();
		$('#upload').remove();
		$('#upsell').hide();
		$('#scrollbox').hide();
		$('#page-title').text('');

		/*loading();
		forge.request.ajax({
			url: "https://api.parse.com/1/classes/Stream",
			headers: {
				"X-Parse-Application-Id": config.parseAppId,
				"X-Parse-REST-API-Key": config.parseRestKey
			},
			type: "GET",
			dataType: 'json',
			data: {
				"order": "-updatedAt"
			},
			success: function (data) {
				$('#streams ul').html('');
				data.results.forEach(function (stream) {
					var li = $('<li><span class="photoStream">#'+stream.stream+'</span></li>');
					li.bind(clickEvent, function () {
						window.location.hash = '#stream/'+stream.stream;
					});
					$('#streams ul').append(li);
				})
				loaded();
				setupSearch();
			},
			error: function () {
				loaded();
			}
		});*/

	},
	stream: function (stream) {
		// TODO: Use views rather than hardcoded
		if (!stream) {
			stream = config.defaultStream;
		}
		if (state.stream != stream) {
			state.stream = stream;

			// Remove current photos
			wine.photos.reset();
			$('.loadedPhoto').remove();
			wine.util.update(setupNav);
		}
		$('#photos').show();
		$('#upload').remove();
		$('#upsell').hide();
		$('#scrollbox').hide();
		$('#streams').hide();
		$('.toUpload').remove();
		setupNav();
	},
	upsell: function () {
		// TODO: Detect iPhone/Android/Web and use appropriate message
		$('#scrollbox').hide();
		if (forge.is.web()) {
			$('#photos').hide();
			$('#upload').remove();
			$('#upsell').show();
			$('#streams').hide();
		} else {
			wine.router.navigate('stream/'+state.stream, true);
		}
	},
	upload: function () {
		var page = new wine.views.Upload();
		page.render().show();
	},
	photo: function (stream, photoId) {
		// TODO: Use views rather than hardcoded
		$('#photos').hide();
		$('#upload').remove();
		$('#upsell').hide();
		$('#scrollbox').hide();
		$('#streams').hide();
		if (state.stream != stream) {
			state.stream = stream;
		}
		wine.util.update(function() { wine.util.getIndividualPhoto(photoId); });
	}
});
wine.router = new wine.types.Router();

// Functions
wine.util = {
	upload: function () {
		wine.router.navigate('upload', true);
	},
	update: function (callback) {
		loading();
		/*forge.request.ajax({
			url: "https://api.parse.com/1/classes/Photo",
			headers: {
				"X-Parse-Application-Id": config.parseAppId,
				"X-Parse-REST-API-Key": config.parseRestKey
			},
			type: "GET",
			dataType: 'json',
			data: {
				"where": '{"stream": "'+state.stream+'"}',
				"order": "-createdAt"
			},
			success: function (data) {
				data.results.forEach(function (file) {
					if (!wine.photos.get(file.objectId)) {
						wine.photos.add([{
							id: file.objectId,
							url: file.file.url,
							timestamp: Date.parse(file.createdAt.replace('T', ' ').replace('Z','').substring(0, file.createdAt.indexOf('.'))).getTime()
						}]);
					}
				})
				loaded();
				if (callback) {
					callback();
				}
			},
			error: function () {
				loaded();
			}
		});*/
	},
	getIndividualPhoto: function(photoId) {
		var photo = wine.photos.get(photoId);
		state.index = wine.photos.indexOf(photo);
		$(document).keydown(function(e){
		    if (e.keyCode == 37) {
   	    		wine.util.showIndividualPhoto(-1);
		    } else if (e.keyCode == 39) {
   	    		wine.util.showIndividualPhoto(1);
		    }
		});
		$('#large-photo').attr('src', photo.get('url'));
		$('#scrollbox').show();
	},
	showIndividualPhoto: function(increment) {
		if (state.animating) {
			return;
		}
		state.animating = true;
	    var nextPhoto = '';
	    // A null state.index means show the 'Upsell' box instead of a photo
		if (state.index == null) {
			state.index = increment == 1 ? 0 : wine.photos.length - 1;
			nextPhoto = wine.photos.at(state.index).get('url');
		} else {
	    	state.index += increment;
	    	if (state.index == -1 || state.index == wine.photos.length) {
	    		state.index = null;
	    	}
			else {
				nextPhoto = wine.photos.at(state.index).get('url');
			}
	    }

		var xShift = 500;
		$('#scrollbox').animate({
		    opacity: 0,
		    left: '+=' + increment * xShift
			}, {
			duration: 200,
			complete: function() {
				$('#scrollbox').css('left', -1 * increment * xShift);
				if(!nextPhoto) {
			    	$('#start-stream-header').show();
			    	$('#large-photo').hide();
				} else {
			    	$('#start-stream-header').hide();
			    	$('#large-photo').show();
				}
				$('#large-photo').attr('src', nextPhoto);
				$('#scrollbox').animate({
				    opacity: 1,
				    left: '+=' + increment * xShift
				}, {
					duration: 200
				});
				state.animating = false;}});
	},
	showPhoto: function(el, preloadImage, target) { 
		return function() {
			var square, heightOffset, widthOffset;
			if (preloadImage.height > preloadImage.width) {
				square = preloadImage.width;
				heightOffset = (preloadImage.height - square) / 2;
				widthOffset = 0;
			} else {
				square = preloadImage.height;
				widthOffset = (preloadImage.width - square) / 2;
				heightOffset = 0;
			}
			var ratio = target/square;
			$(el).append('<div class="photowrapper" style="height: '+square*ratio+'px; width: '+square*ratio+'px; overflow: hidden"></div>');
			var style = 'width: '+preloadImage.width*ratio+'px; height: '+preloadImage.height*ratio+'px; margin-left: -'+widthOffset*ratio+'px; margin-top: -'+heightOffset*ratio+'px';
			$('.photowrapper', el).append(preloadImage);
			$(preloadImage, el).attr('style', style);
		}
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
wine.photos = new wine.collections.Photos();
wine.photos.on('add', function (model) {
	var photo = new wine.views.Photo({
		model: model
	});

	var index = wine.photos.indexOf(model);
	loading();
	var pageNum = Math.floor(index / config.pageSize) + 1;
	if (index == 0) {
		$('#header').after(photo.render(pageNum, false).el);
	} else {
		$(wine.photos.at(index-1).get('el')).after(photo.render(pageNum, false).el);
	}
});

// Views
wine.views.Upload = Backbone.View.extend({
	tagName: "div",
	id: "upload",
	render: function() {
		var el = this.el;
		$(el).html('<div id="choosephoto" class="step"><div class="label">1.</div><div class="instruction">Take picture of label</div><img class="icon"></img></div>');
		forge.tools.getURL('img/disclosure_indicator.png', function(src) {
			$('img.icon', el).attr('src', src);
		});
		forge.tools.getURL('img/wine.jpg', function(src) {
			$(el).attr('style', 'width:100%;height:100%;background-image:url('+src+');background-size:cover;');
		});
		_.bindAll(this);
		$('#choosephoto', el).bind(clickEvent, this.choose);
		fake_active($('#choosephoto', el));
		return this;
	},
	show: function () {
		$('body').append(this.el);
	},
	choose: function () {
		var self = this;
		self.selImage = undefined;
		$('.toUpload').remove();
		forge.file.getImage({width: 500, height: 500}, function (file) {
			forge.file.imageURL(file, function (url) {
				var photo = new wine.views.Photo({
					model: new wine.models.Photo({url: url})
				});
			});
			self.selImage = file;
			$(self.el).html('<div class="step"><div class="label">2.</div><div class="instruction">Rate wine</div></div>');
			alert('amirtest');
		});
	}
});

wine.views.Photo = Backbone.View.extend({
	tagName: "div",
	className: "photo",

	render: function(pageNum, isUpload) {
		var el = this.el;
		this.model.set('el', el);
		$(el).hide();
		var preloadImage = new Image();
		var photoId = this.model.get('id');
		preloadImage.onload = wine.util.showPhoto;
		preloadImage.src = this.model.get('url');
		return this;
	}
});

// Initialise app
$(function () {
	Backbone.history.start()
});

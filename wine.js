//forge.debug = true;

//Style top bar and tab bar

forge.topbar.setTint([88,22,43,255]);
forge.tabbar.setActiveTint([88,22,43,255]);

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
	currentPhoto: {}
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
		"": "picture",
		"picture": "picture",
		"rate": "rate"
	},
	picture: function () {
		wine.util.reset();
		var page = new wine.views.Picture();
		page.render().show();
	},
	rate: function() {
		wine.util.reset();
		var page = new wine.views.Rate();
		page.render().show();
	}
});
wine.router = new wine.types.Router();

// Functions
wine.util = {
	reset: function () {
		forge.topbar.removeButtons();
		$('#picture').remove();
		$('#rate').remove();
	},
	disclosure_indicator: function(el) {
		forge.tools.getURL('img/disclosure_indicator.png', function(src) {
			$('img.icon', el).attr('src', src);
		});
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

// Views
wine.views.Picture = Backbone.View.extend({
	tagName: "div",
	id: "picture",
	render: function() {
		var el = this.el;
		$(el).html('<div id="choosephoto" class="step listenactive"><div class="label">1.</div><div class="instruction">Take picture of label</div><img class="icon"></img></div>');
		wine.util.disclosure_indicator(el);
		if (wine.photos.length) {
			var src = wine.photos.at(wine.photos.length-1).get('url');
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
		$('body').append(this.el);
	},
	choose: function () {
		var self = this;
		self.selImage = undefined;
		forge.file.getImage({width: 500, height: 500}, function (file) {
			forge.file.imageURL(file, function (url) {
				state.currentPhoto = new wine.models.Photo({url: url});
				self.selImage = file;
				wine.router.rate();
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
		$(el).html('<div id="ratephoto" class="step listenactive"><div class="label">2.</div><div class="instruction">Rate wine</div><img class="icon"></div>');
		wine.util.disclosure_indicator(el);
		$(el).attr('style', 'width:100%;height:100%;background-image:url('+state.currentPhoto.get('url')+');background-size:cover;');
		$('#ratephoto', el).bind(clickEvent, this.rate);
		fake_active($('#ratephoto', el));
		return this;
	},
	show: function () {
		$('body').append(this.el);
	},
	rate: function() {
		$('#ratephoto').unbind(clickEvent, this.rate);
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('#ratephoto').removeClass('listenactive');
			$('#ratephoto').html('<fieldset><div><label class="1"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="1_5"> 1/5</label><br><label class="2"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="2_5"> 2/5</label><br><label class="3"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="3_5"> 3/5</label><br><label class="4 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="4_5"> 4/5</label><br><label class="5 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="5_5"> 5/5</label></div></fieldset>');
			$('#ratephoto img').bind(clickEvent, function(ev) {
				forge.topbar.addButton({
					text: 'Save',
					position: 'right'
				}, function() {
					wine.photos.add(state.currentPhoto);
					wine.router.picture();
				});
				$('#ratephoto label').removeClass('no_star');
				var rating = parseInt($(ev.target).parent().attr('class'));
				$('#ratephoto label').each(function(idx, el) {
					if (parseInt($(el).attr('class')) > rating) {
						$(el).addClass('no_star');
					}
				});
				state.currentPhoto.set('rating', rating);
			});
		});
		return this;
	}
});

// Initialise app
$(function () {
	Backbone.history.start()
});

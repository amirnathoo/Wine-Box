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

var starterButton = forge.tabbar.addButton({
	text: "Rate Wine",
	icon: "img/star.png",
	index: 0
}, function (button) {
	state.rateButton = button;
	button.onPressed.addListener(function () {
		wine.router.rateTab();
	});
	wine.router.rateTab();
});

var mainButton = forge.tabbar.addButton({
	text: "My Wine",
	icon: "img/bottle.png",
	index: 1
}, function (button) {
	state.listButton = button;
	button.onPressed.addListener(function () {
		wine.router.listTab();
	});
});

// Current state
var state = {
	currentPhoto: null,
	rateButton: null,
	listButton: null
}

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

// Router
wine.types.Router = Backbone.Router.extend({
	routes: {
		"": "rateTab",
		"rateTab": "rateTab",
		"picture": "picture",
		"rate": "rate"
	},
	rateTab: function() {
		state.rateButton.setActive();
		forge.topbar.setTitle("Rate Wine");
		forge.topbar.removeButtons();
		$('#rate_container').show();
		$('#list_container').hide();
		if (state.currentPhoto === null) {
			wine.router.picture();
		} else {
			wine.router.rate();
		}
	},
	listTab: function() {
		state.listButton.setActive();
		forge.topbar.setTitle("My Wine");
		forge.topbar.removeButtons();
		$('#rate_container').hide();
		$('#list_container').show();
		scrollTop();
	},
	picture: function () {
		$('#picture').remove();
		$('#rate').remove();
		state.currentPhoto = null;
		var page = new wine.views.Picture();
		page.render().show();
	},
	rate: function() {
		$('#picture').remove();
		$('#rate').remove();
		forge.topbar.removeButtons();
		var page = new wine.views.Rate();
		page.render().show();
		state.rate = true;
	}
});
wine.router = new wine.types.Router();

// Functions
wine.util = {
	disclosure_indicator: function(el) {
		forge.tools.getURL('img/disclosure_indicator.png', function(src) {
			$('img.icon', el).attr('src', src);
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
		$('#rate_container').append(this.el);
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
		$(el).html('<div id="ratephoto" class="step listenactive"></div>');
		$(el).attr('style', 'width:100%;height:100%;background-image:url('+state.currentPhoto.get('url')+');background-size:cover;');
		if (state.currentPhoto.get('rating')) {
			this.rate();
		} else {
			$('#ratephoto', el).html('<div class="label">2.</div><div class="instruction">Rate wine</div><img class="icon">');
			wine.util.disclosure_indicator(el);
			$('#ratephoto', el).bind(clickEvent, this.rate);
			fake_active($('#ratephoto', el));
		}
		return this;
	},
	show: function () {
		$('#rate_container').append(this.el);
	},
	rate: function() {
		function handleRatingClick(rating) {
			forge.topbar.addButton({
				text: 'Save',
				position: 'right'
			}, function() {
				wine.photos.add(state.currentPhoto);
				state.currentPhoto = null
				wine.router.listTab();
			});
			$('#ratephoto label').removeClass('no_star');
			$('#ratephoto label').each(function(idx, el) {
				if (parseInt($(el).attr('class').split('_')[1]) > rating) {
					$(el).addClass('no_star');
				}
			});
			state.currentPhoto.set('rating', rating);
		}
		$('#ratephoto').unbind(clickEvent, this.rate);
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('#ratephoto').removeClass('listenactive');
			$('#ratephoto').html('<fieldset><div><label class="_1"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="1_5"> 1/5</label><br><label class="_2"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="2_5"> 2/5</label><br><label class="_3"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="3_5"> 3/5</label><br><label class="_4 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="4_5"> 4/5</label><br><label class="_5 no_star"><img src="'+src+'"  width="0" height="1" ><input type="radio" name="movie" value="5_5"> 5/5</label></div></fieldset>');
			$('#ratephoto img').bind(clickEvent, function(ev) {
				handleRatingClick(parseInt($(ev.target).parent().attr('class').split('_')[1]));
			});
			if (state.currentPhoto.get('rating')) {
				handleRatingClick(state.currentPhoto.get('rating'));
			}
		});
		return this;
	}
});

// Initialise app
$(function () {
	Backbone.history.start()
});

// Views
wine.views.Picture = Backbone.View.extend({
	tagName: "div",
	id: "picture",
	render: function() {
		var el = this.el;
		$(el).html($('#tmpl-picture').text());
		wine.util.disclosure_indicator(el);
		if (wine.photos.length) {
			var src = wine.photos.at(0).get('url');
			$(el).css('background-image', 'url('+src+')');
		} else {
			forge.tools.getURL('img/wine.jpg', function(src) {
				$(el).css('background-image', 'url('+src+')');
			});
		}
		$('#choosephoto', el).bind(clickEvent, this.choose);
		fake_active($('#choosephoto', el));
		return this;
	},
	show: function () {
		wine.util.resetCurrentView(this);
		$('#rate_container').show();
		$('#rate_container').append(this.el);
	},
	close: function() {
		$('#rate_container').hide();
		$('#picture').remove();
		this.remove();
	},
	choose: function () {
		var self = this;
		self.selImage = undefined;
		forge.file.getImage({width: 500, height: 500}, function (file) {
			forge.file.imageURL(file, function (url) {
				forge.logging.log('Got photo with url: '+url);
				forge.geolocation.getCurrentPosition(function(position) {
					state.set('currentCoords', position.coords);
					forge.logging.log('Set current position:');
					forge.logging.log(position.coords);
					var timestamp = new Date().getTime();
					state.set('currentPhoto', new wine.models.Photo({
						url: url,
						timestamp: timestamp,
						position: state.get('currentCoords')
					}));
					wine.router.navigate('rate', { trigger: true });
					$('#picture').remove();
				});
			});
		});
	}
});

wine.views.Rate = Backbone.View.extend({
	tagName: "div",
	id: "rate",
	render: function() {
		var el = this.el;
		$(el).html($('#tmpl-rate1').text());
		$(el).css('background-image', 'url('+state.get('currentPhoto').get('url')+')');
		if (state.get('currentPhoto').get('rating')) {
			this.rate();
		} else {
			$('.ratephoto', el).html($('#tmpl-rate2').text());
			wine.util.disclosure_indicator(el);
			fake_active($('.ratephoto', el));
			$('.ratephoto', el).bind(clickEvent, this.rate);
		}
		return this;
	},
	show: function () {
		wine.util.resetCurrentView(this);
		$('#rate_container').show();
		$('#rate_container').append(this.el);
		forge.topbar.addButton({
			text: 'Back',
			position: 'left',
			type: 'back'
		}, function() {
			$('#rate').remove();
		});
	},
	close: function() {
		$('#rate_container').hide();
		$('#rate').remove();
		this.remove();
	},
	rate: function() {
		function addSaveButton() {
			forge.topbar.addButton({
				text: 'Save',
				position: 'right'
			}, function() {
				wine.photos.add(state.get('currentPhoto'));
				state.set('currentPhoto', null);
				wine.router.navigate('listTab', { trigger: true });
				$('#rate_container').hide();
				$('#rate').remove();
			});
		}
		
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('#rate_container .ratephoto').unbind(clickEvent, this.rate);
			$('#rate_container .ratephoto').removeClass('listenactive');
			$('#rate_container .ratephoto').html(Mustache.render($('#tmpl-stars').text(), { src: src }));
			$('#rate_container .ratephoto img').bind(clickEvent, function(ev) {
				forge.logging.log('... Set rating');
				var rating = parseInt($(ev.target).parent().attr('class').split('_')[1])
				forge.logging.log(rating);
				wine.util.handleRatingClick(rating, $('#rate'));
				state.get('currentPhoto').set('rating', rating);
				addSaveButton();
			});
			if (state.get('currentPhoto').get('rating')) {
				wine.util.handleRatingClick(state.get('currentPhoto').get('rating'), $('#rate'));
				addSaveButton();
			}
		});
		return this;
	}
});

wine.views.List = Backbone.View.extend({
	tagName: "div",
	id: "list",
	render: function() {
		var el = this.el;
		var obj = { "list": wine.photos.toJSON() }; 
		var output = Mustache.render('{{#list}}'+$('#tmpl-list').text()+'{{/list}}', obj);
		$(el).html(output);
		$('#list_container').append(el);
		this.displayItem($('.ratephoto', el));
		return this;
	},
	add: function(photo) {
		var el = this.el;
		$(el).prepend(Mustache.render($('#tmpl-list').text(), photo.toJSON()));
		this.displayItem($('.ratephoto', el).first());
		state.get('map').add(photo);
	},
	displayItem: function(items) {
		var el = this.el;
		forge.tools.getURL('img/sprite.gif', function(src) {
			$(items).each(function(idx, item) {
				var rating = parseInt($(item).text());
				$(item).html(Mustache.render($('#tmpl-stars').text(), { src: src }));
				fake_active(item);
				wine.util.handleRatingClick(rating, $(item));
				var photo = wine.photos.at(idx);
				$(item).parent().bind(clickEvent, function() {
					wine.router.navigate('detail/'+wine.photos.indexOf(photo), { trigger: true });
					$('#list').hide();
				});
			});
		});
		forge.tools.getURL('img/detail_disclosure.jpg', function(src) {
			$('.detail_icon', el).each(function(idx, item) {
				$(item).attr('src', src);
			});
		});
	},
	close: function() {
		$('#list_container').hide();
		$('#list').hide();
	},
	show: function () {
		wine.util.resetCurrentView(this);
		$('#list_container').show();
		$('#list').show();
		forge.topbar.addButton({
			text: 'Map',
			position: 'left'
		}, function() {
			wine.router.navigate('mapTab', { trigger: true });
			$('#list_container').hide();
			$('#list').hide();
		});
		forge.topbar.addButton({
			text: 'Add',
			position: 'right'
		}, function() {
			wine.router.navigate('rateTab', { trigger: true });
			$('#list_container').hide();
			$('#list').hide();
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
		state.set('idx', idx);
		var item = wine.photos.at(idx);
		var src = item.get('url');
		$(el).html(Mustache.render($('#tmpl-detail').text(), {
			url: src,
			rating: wine.photos.at(idx).get('rating'),
			location: wine.photos.at(idx).get('location'),
			timestamp: wine.photos.at(idx).get('timestamp')
		}));
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('.ratephoto', el).each(function(idx, item) {
				var rating = parseInt($(item).text());
				$(item).html(Mustache.render($('#tmpl-stars').text(), { src: src }));
				wine.util.handleRatingClick(rating, $(item));
			});
		});
		$(el).append('<img class="detail" src="'+src+'" />');
		return this;
	},
	show: function () {
		wine.util.resetCurrentView(this);
		$('#list_container').show();
		$('#list_container').append(this.el);
		forge.topbar.setTitle('Wine Detail');
		forge.topbar.addButton({
			text: 'Back',
			position: 'left',
			type: 'back'
		}, function() {
			$('#detail').remove();
		});
		forge.topbar.addButton({
			text: 'Map',
			position: 'right'
		}, function() {
			wine.router.navigate('mapTab/'+state.get('idx'), { trigger: true} );
			$('#list_container').hide();
			$('#detail').remove();
		});
	},
	close: function() {
		$('#list_container').hide();
		$('#detail').remove();
		this.remove();
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
		script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyAlFSCee70OJOiD7k-fz8e6ywXVVIkWErU&sensor=true&callback=wine.util.initMap";
		document.body.appendChild(script);
		$('#map_container').append(el);
		return this;
	},
	initMap: function() {
		forge.logging.log('... Initializing map');
		forge.geolocation.getCurrentPosition(function(position) {
			$(this.el).empty();
			state.set('currentCoords', position.coords);
			forge.logging.log('Set current position:');
			forge.logging.log(position.coords);
			var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude, true);
			var myOptions = {
				zoom: 15,
				center: latLng,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			}
			forge.logging.log('... Create map');
			state.get('map').gmap = new google.maps.Map(document.getElementById('map'), myOptions);
			forge.tools.getURL('img/blue-pin.png', function(src) {
				forge.logging.log('... Add position marker');
				state.set('currentMarker', new google.maps.Marker({
					position: latLng,
					title: "Current Position",
					icon: src,
					map: state.get('map').gmap,
					zIndex: -1
				}));
			});
			wine.photos.each(state.get('map').add);
			forge.logging.log('Created map ...');
		});
	},
	add: function(item) {
		var latLng = new google.maps.LatLng(item.get('position').latitude, item.get('position').longitude, true);
		var marker = new google.maps.Marker({
			position: latLng,
			map: state.get('map').gmap,
			zIndex: 1
		});
		var idx = wine.photos.indexOf(item)
		google.maps.event.addListener(marker, 'click', function() {
			wine.router.navigate('detail/'+idx, { trigger: true });
			$('#map_container').hide();
		});
	},
	show: function(idx) {
		$('#map_container').show();
		wine.util.resetCurrentView(this);
		if (state.get('map').gmap) {
			google.maps.event.trigger(state.get('map').gmap, 'resize');
			if (idx) {
				var item = wine.photos.at(idx);
				var latLng = new google.maps.LatLng(item.get('position').latitude, item.get('position').longitude, true);
				state.get('map').gmap.setCenter(latLng);
			} else {
				var latLng = new google.maps.LatLng(state.get('currentCoords').latitude, state.get('currentCoords').longitude, true);
				state.get('map').gmap.setCenter(latLng);
			}
			state.get('currentMarker').setPosition(latLng);
		} else {
			this.initMap();
			$('#map').html('<div class="title">Loading...</div>');
		}
		if (idx) {
			forge.topbar.addButton({
				text: 'Back',
				position: 'left',
				type: 'back'
			}, function() {
				$('#map_container').hide();
			});
		}
	},
	close: function() {
		$('#map_container').hide();
	}
});
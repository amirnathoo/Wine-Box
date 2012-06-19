// Views
wine.views.Picture = Backbone.View.extend({
	tagName: "div",
	id: "picture",
	render: function() {
		var el = this.el; 
		forge.logging.log('Start render picture ...');
		$(el).html($('#tmpl-picture').text());
		wine.disclosure_indicator(el);
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
		forge.logging.log('... complete render picture.');
		return this;
	},
	show: function () {
		forge.logging.log('Start show picture ...');
		wine.resetCurrentView(this);
		$('#rate_container').show();
		$('#rate_container').append(this.el);
		forge.logging.log('... complete show picture.');
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
					var page = new wine.views.Rate();
					page.render().show();
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
			wine.disclosure_indicator(el);
			fake_active($('.ratephoto', el));
			$('.ratephoto', el).bind(clickEvent, this.rate);
		}
		return this;
	},
	show: function () {
		wine.resetCurrentView(this);
		$('#rate_container').show();
		$('#rate_container').append(this.el);
		forge.topbar.addButton({
			text: 'Back',
			position: 'left'
		}, function() {
			state.set('currentPhoto', null);
			var page = new wine.views.Picture();
			page.render().show();
		});
	},
	close: function() {
		$('#rate_container').hide();
		$('#rate').remove();
		this.remove();
	},
	rate: function() {
		function addSaveButton() {
			forge.topbar.removeButtons();
			forge.topbar.addButton({
				text: 'Back',
				position: 'left'
			}, function() {
				state.set('currentPhoto', null);
				var page = new wine.views.Picture();
				page.render().show();
			});
			forge.topbar.addButton({
				text: 'Save',
				position: 'right'
			}, function() {
				//Persist photo
				var photo = state.get('currentPhoto');
				wine.photos.add(photo);
				photo.set('user', wine.user);
				state.get('list').add(photo);
				wine.setDataUrl(photo.get('url'), photo.get('timestamp'));
				wine.publicFirebase.child(photo.get('timestamp')).set(photo.toJSON());
				wine.userFirebase.child(photo.get('timestamp')).set(photo.toJSON());
				
				//Navigate away
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
			$('fieldset img', $('#rate_container')).get(0).onload = function() {
				$('fieldset div', $('#rate_container')).show();
			}
			$('#rate_container .ratephoto img').bind(clickEvent, function(ev) {
				forge.logging.log('... Set rating');
				var rating = parseInt($(ev.target).parent().attr('class').split('_')[1])
				forge.logging.log(rating);
				wine.handleRatingClick(rating, $('#rate'));
				state.get('currentPhoto').set('rating', rating);
				addSaveButton();
			});
			if (state.get('currentPhoto').get('rating')) {
				wine.handleRatingClick(state.get('currentPhoto').get('rating'), $('#rate'));
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
		$('#list_container').append(el);
		return this;
	},
	add: function(photo) {
		var el = this.el;
		forge.logging.log('Adding photo to list');
		$(el).prepend(Mustache.render($('#tmpl-list').text(), photo.toJSON()));
		this.display($('.ratephoto', el).first());
		state.get('map').add(photo);
		wine.getLocation(photo.get('position'), photo.get('timestamp'));
	},
	remove: function(timestamp) {
		$('#_'+timestamp).remove();
		//TODO need to remove marker from map as well
	},
	addImage: function(photo_obj) {
		$('#_'+photo_obj.timestamp+' .image_wrapper img').attr('src', photo_obj.dataurl).show();
	},
	exists: function(timestamp) {
		var el = this.el;
		return ($('#_'+timestamp, el).length? true: false);
	},
	display: function(items) {
		var el = this.el;
		forge.tools.getURL('img/sprite.gif', function(src) {
			$(items).each(function(idx, item) {
				var photo = wine.photos.at(idx);
				if (forge.is.web()) {
					if (photo.get('dataurl')) {
						$('.image_wrapper img', $(item).parent()).attr('src', photo.get('dataurl'));
					} else {
						$('.image_wrapper img', $(item).parent()).hide();
					}
				}
				var rating = parseInt($(item).text());
				$(item).html(Mustache.render($('#tmpl-stars').text(), { src: src }));
				$('fieldset img', $(item)).get(0).onload = function() {
					$('fieldset div', $(item)).show();
				}
				fake_active($(item).parent());
				wine.handleRatingClick(rating, $(item));
				$(item).parent().bind(clickEvent, function() {
					var timestamp = parseInt($(this).attr('id').split('_')[1]);
					var index = wine.photos.indexOf(wine.photos.where({timestamp: timestamp})[0]);
					forge.logging.log('Showing detail for timestamp: '+timestamp+' at index: '+index);
					wine.router.navigate('detail/'+index, { trigger: true });
					$('#list').hide();
				});
			});
		});
		wine.showDetailIcon(el);
	},
	close: function() {
		$('#list_container').hide();
		$('#list').hide();
	},
	show: function () {
		wine.resetCurrentView(this);
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
		if (forge.is.mobile()) {
			forge.topbar.addButton({
				text: 'Add',
				position: 'right'
			}, function() {
				wine.router.navigate('rateTab', { trigger: true });
				$('#list_container').hide();
				$('#list').hide();
			});
		}
	}
});

wine.views.Detail = Backbone.View.extend({
	tagName: "div",
	id: "detail",
	render: function(idx) {
		var el = this.el;
		state.set('idx', idx);
		var item = wine.photos.at(idx);
		var src = forge.is.web()? item.get('dataurl'): item.get('url');
		$(el).html(Mustache.render($('#tmpl-detail').text(), {
			url: src,
			rating: wine.photos.at(idx).get('rating'),
			location: wine.photos.at(idx).get('location'),
			timestamp: wine.photos.at(idx).get('timestamp')
		}));
		fake_active($('.listenactive', el));
		forge.tools.getURL('img/sprite.gif', function(src) {
			$('.ratephoto', el).each(function(idx, item) {
				var rating = parseInt($(item).text());
				$(item).html(Mustache.render($('#tmpl-stars').text(), { src: src }));
				$('fieldset img', $(item)).get(0).onload = function() {
					$('fieldset div', $(item)).show();
				}
				wine.handleRatingClick(rating, $(item));
			});
		});
		wine.showDetailIcon(el);
		if (!(forge.is.web() && !item.has('dataurl'))) {
			$(el).append('<img class="detail" src="'+src+'" />');
		}
		$('.step', el).bind(clickEvent, function() {
			wine.router.navigate('mapTab/'+state.get('idx'), { trigger: true });
			$('#list_container').hide();
			$('#detail').remove();
		});
		return this;
	},
	show: function () {
		wine.resetCurrentView(this);
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
		if (forge.is.mobile()) {
			forge.topbar.addButton({
				text: 'Delete',
				position: 'right'
			}, function() {
				if (confirm("Confirm delete?")) {
					wine.photos.remove(wine.photos.at(state.get('idx')));
					wine.router.navigate('listTab', { trigger: true });
					$('#detail').remove();
				}
			});
		}
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
	toAdd: [],
	render: function() {
		var el = this.el;
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyAlFSCee70OJOiD7k-fz8e6ywXVVIkWErU&sensor=true&callback=wine.initMap";
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
				var gmap = state.get('map').gmap
				state.set('currentMarker', new google.maps.Marker({
					position: latLng,
					title: "Current Position",
					icon: src,
					map: gmap,
					zIndex: -1
				}));
			});
			forge.logging.log('Created map ...');
			state.get('map').toAdd.forEach(function(item) {
				state.get('map').add(item);
			})
		});
	},
	add: function(item) {
		if (state.get('map').gmap) {
			forge.logging.log('Adding item to map');
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
		} else {
			forge.logging.log('Map not ready, waiting to add item');
			state.get('map').toAdd.push(item);
		}
	},
	show: function(idx) {
		$('#map_container').show();
		wine.resetCurrentView(this);
		if (state.get('map').gmap) {
			google.maps.event.trigger(state.get('map').gmap, 'resize');
			var currentLatLng = new google.maps.LatLng(state.get('currentCoords').latitude, state.get('currentCoords').longitude, true);
			if (idx) {
				var item = wine.photos.at(idx);
				var latLng = new google.maps.LatLng(item.get('position').latitude, item.get('position').longitude, true);
				state.get('map').gmap.setCenter(latLng);
			} else {
				state.get('map').gmap.setCenter(currentLatLng);
			}
			state.get('currentMarker').setPosition(currentLatLng);
		} else {
			this.initMap();
			$('#map').html('<div class="title">Loading...</div>');
		}
		forge.topbar.addButton({
			text: 'Back',
			position: 'left',
			type: 'back'
		}, function() {
			$('#map_container').hide();
		});
	},
	close: function() {
		$('#map_container').hide();
	}
});
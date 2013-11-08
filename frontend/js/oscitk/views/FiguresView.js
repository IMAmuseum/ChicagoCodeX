OsciTk.views.Figures = OsciTk.views.BottomDrawerView.extend({
	id: 'figures',
	template: OsciTk.templateManager.get('aic-figures'),
	events: {
		"click .drawer-handle": "toggleDrawer",
		"click a.view-fullscreen": "onFigurePreviewClicked",
		"click img.figure-preview": "onFigurePreviewClicked",
		"click a.view-in-context": "onViewInContextClicked",
		"click #figures-nav-next .figures-indicator": "onNextPageClicked",
		"click #figures-nav-prev .figures-indicator": "onPrevPageClicked"
	},
	initialize: function() {
		this._super('initialize');
		this.collection = app.collections.figures;
		this.page = 1;
		this.maxPage = 1;

		// draw the figures ui only if figures become available
		this.listenTo(Backbone, 'figuresLoaded', function(figures) {
			this.render();
		});
	},
	render: function() {
		var that = this;
		var override = false;
        var sectionClasses = app.models.section.get('classes');
        var needsOverride = ['node-figure-gallery'];
        if (_.isArray(sectionClasses) && _.intersection(sectionClasses, needsOverride).length) {
            that.$el.hide();
            return;
        }

		this.$el.css('display', 'block');
		// prepare data for display, getting a sorted copy of the figures collection
		var data = {
			figures: this.collection.sortBy(function(figure) {
				return parseInt(figure.get('order'), 10);
			})
		};
		// remove plate image if present
		if (data.figures.length > 0 && data.figures[0].get('plate') === true) {
			data.figures.shift();
		}
		this.$el.html(this.template(data));

		// set figures list width
		var itemWidth = this.$el.find('#figures-list li').first().outerWidth() || 1;
		var itemCount = this.collection.length;
		this.$el.find('#figures-list').width(itemWidth * itemCount);

		// justify contents across container width
		var containerWidth = this.$el.find('#figures-list-container').width();
		var numToFit = Math.floor(containerWidth / itemWidth);
		var paddingToAdd = (containerWidth - (numToFit * itemWidth)) / numToFit;
		var leftPadding = parseInt(this.$el.find('#figures-list li').css('padding-left'), 10);
		var rightPadding = parseInt(this.$el.find('#figures-list li').css('padding-right'), 10);
		var currentPadding = leftPadding + rightPadding;
		var newPadding = Math.floor((currentPadding + paddingToAdd) / 2);
		var extra = 0;
		if ((newPadding * 2) < (currentPadding + paddingToAdd)) {
			extra = ((currentPadding + paddingToAdd) - (newPadding * 2)) * numToFit;
		}
		this.$el.find('#figures-list li').css({
			'padding-left': newPadding + 'px',
			'padding-right': newPadding + 'px'
		});
		this.$el.find('#figures-list li:nth-child('+numToFit+'n+'+numToFit+')').css({
			'padding-right': newPadding + extra + 'px'
		});

		// item width has changed, get it again
		itemWidth = this.$el.find('#figures-list li').outerWidth();

		// reset list width now that padding has been added
		this.$el.find('#figures-list').width((itemWidth + paddingToAdd) * itemCount);

		// set the max page value
		this.maxPage = Math.ceil((itemWidth * itemCount) / containerWidth);

		// if any figure thumbnails were smaller than the display size, increase them to fit
		var maxW = parseInt($('#figures-list .figure-preview').css('max-width'), 10);
		var maxH = parseInt($('#figures-list .figure-preview').css('max-height'), 10);
		if (maxW && maxH) {
			// push this into the stack to increase chance of image being loaded
			$('#figures-list .figure-preview').each(function(i, elem) {
				that.resizeFigurePreview(elem, maxW, maxH);
			});
		}

		this.setDrawerLastPosition();
	},
	resizeFigurePreview: function(elem, maxW, maxH) {
		var that = this;
		if (elem.width !== 0 && elem.height !== 0) {
			if (elem.width < maxW || elem.height < maxH) {
				if (elem.width > elem.height) {
					$(elem).css('min-width', maxW + 'px');
				}
				else {
					$(elem).css('min-height', maxH + 'px');
				}
			}
		}
		else {
			setTimeout(function() {
				that.resizeFigurePreview(elem, maxW, maxH);
			}, 500);
		}
	},
	onFigurePreviewClicked: function(event_data) {
		var figId = $(event_data.target).parents('figure').attr('data-figure-id');
		var figureView = app.views.figures[figId];
		if (figureView && figureView.fullscreen) {
			figureView.fullscreen();
		}
		return false;
	},
	onViewInContextClicked: function(event_data) {

		// find the figure identifier
		var figId = $(event_data.target).parent().attr('data-figure-id');
		// find the reference elements that match this figId
		var figRefs = app.views.sectionView.$el.find('a.figure_reference[href="#'+figId+'"]');

		// determine which of these elements are currently visible
		var visibleRefs = [];
		_.each(figRefs, function(figRef) {
			var visible = app.views.sectionView.isElementVisible(figRef);
			if (visible) {
				visibleRefs.push(figRef);
			}
		}, this);

		if (visibleRefs.length > 0) {
			// navigate to the first instance and highlight
			this.navigateAndHighlightRef(figId, visibleRefs, 0);
		}
		return false;
	},
	navigateAndHighlightRef: function(identifier, visibleRefs, index) {
		$this = this;
		index = index || 0;
		// navigate to figure reference
		Backbone.trigger('navigate', { identifier: identifier + '-' + (index + 1) });

		var ref = $(visibleRefs[index]);
		this.pulsateText(ref);
		// if there are duplicate references in the text
		if (visibleRefs.length > 1) {
			// is there a previous ref?
			var prev = (index > 0) ? true : false;
			// is there a next ref?
			var next = (visibleRefs.length - 1 > index) ? true : false;
			// draw a control


			var linker = this.linker = $("<div>", { id: "osci_linker" });
			if (prev) {
				// create previous control
				linkerPrev = $('<a>', {
					'href': '#',
					'class': 'prev',
					'title': 'Previous Reference',
					'text': '&lt;'
				}).appendTo(linker);
				linkerPrev.bind('click', function(event) {
					event.preventDefault();
					linker.remove();
					$this.navigateAndHighlightRef(visibleRefs, index - 1);
				});
			}
			if (next) {
				// create next control
				linkerNext = $('<a>', {
					'href': '#',
					'class': 'next',
					'title': 'Next Reference',
					'text': '&gt;'
				}).appendTo(linker);
				linkerNext.bind('click', function(event) {
					event.preventDefault();
					linker.remove();
					$this.navigateAndHighlightRef(visibleRefs, index + 1);
				});
			}
			// create stop control
			linkerClose = $('<a>', {
				'href': '#',
				'class': 'close',
				'title': 'Close',
				'text': 'close'
			}).appendTo(linker);
			linkerClose.bind('click', function(event) {
				event.preventDefault();
				linker.remove();
			});

			// set postion and append to section
			linker.appendTo('#section');
			var offset = ref.offset();
			var width = linker.width();
			linker.css({
				position: 'absolute',
				top: (offset.top - 90) + 'px',
				left: offset.left - 100 - (width / 2) + 'px',
				width: '100px',
				height: '28px'
			});

		}
	},
	pulsateText: function(element) {
		var offset = element.offset(),
			width = element.width(),
			temp = $("<div>", {
				css : {
					"position": "absolute",
					"top": (offset.top - 90) + "px",
					"left": offset.left - 160 + (width / 2) + "px",
					"margin": 0,
					"width": "80px",
					"height": "80px",
					"border": "6px solid #F00",
					"border-radius" : "46px",
					"-webkit-animation-duration" : "400ms",
					"-moz-animation-duration": "400ms",
					"-ms-animation-duration" : "400ms",
					"-o-animation-duration" : "400ms",
					"animation-duration" : "400ms",
					"-webkit-animation-iteration-count" : "1",
					"-moz-animation-iteration-count" : "1",
					"-ms-animation-iteration-count" : "1",
					"-o-animation-iteration-count" : "1",
					"animation-iteration-count" : "1",
					"-webkit-animation-name" : "pulse",
					"-moz-animation-name" : "pulse",
					"-ms-animation-name" : "pulse",
					"-o-animation-name" : "pulse",
					"animation-name" : "pulse",
					"-webkit-animation-direction" : "normal",
					"-moz-animation-direction" : "normal",
					"-ms-animation-direction" : "normal",
					"-o-animation-direction" : "normal",
					"animation-direction" : "normal",
					"-webkit-box-shadow": "0px 0px 10px #888",
					"-moz-box-shadow": "0px 0px 10px #888",
					"-ms-box-shadow": "0px 0px 10px #888",
					"-o-box-shadow": "0px 0px 10px #888",
					"box-shadow": "0px 0px 10px #888"
				}
			}).appendTo("#section");

		setTimeout(function(){temp.remove();}, 1100);
	},
	translateToPage: function() {
		var width = this.$el.find('#figures-list-container').width();
		var list = this.$el.find('#figures-list');
		var pos = -(width * (this.page - 1));
		list.css({
			'-webkit-transition-duration': '400ms',
			'-moz-transition-duration': '400ms',
			'-ms-transition-duration': '400ms',
			'-o-transition-duration': '400ms',
			'transition-duration': '400ms',
			'-webkit-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
			'-moz-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
			'-ms-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
			'-o-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
			'transform': 'translate3d(' + pos + 'px, 0px, 0px)'
		});
	},
	onNextPageClicked: function() {
		if (this.page < this.maxPage) {
			this.page++;
			this.translateToPage();
		}
	},
	onPrevPageClicked: function() {
		if (this.page > 1) {
			this.page--;
			this.translateToPage();
		}
	}
});

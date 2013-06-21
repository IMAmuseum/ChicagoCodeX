OsciTk.views.Toc = OsciTk.views.BaseView.extend({
	id: 'toc-view',
	template: OsciTk.templateManager.get('aic-toc'),
	that: this,
	initialize: function() {
		this.navTree = null;
		this.sectionImageUrl = null;
		this.referenceImageUrl = null;
		this.isOpen = false;

		this.listenTo(Backbone, 'navigationLoaded', function(navigationItems) {
			this.navTree = this.renderNavTree();
		});

		this.listenTo(Backbone, 'tocClose', function(caller) {
			if (caller !== this) {
				this.closeDrawer();
			}
		});

		// when a section is loaded, find and highlight the matching navigation item
		this.listenTo(Backbone, 'sectionLoaded', function(section) {
			// set the section image url and render
			var navItems = app.collections.navigationItems.where({id: section.id});
			if (navItems.length > 0) {
				this.sectionImageUrl = navItems[0].get('thumbnail');
				// let the referenceImageView know about the image
				Backbone.trigger('referenceImageLoaded', {
					imageUrl: this.sectionImageUrl,
					section_id: app.models.section.id,
					figure_index: navItems[0].get('thumbnail_figure_index')
				});
			}
			this.render();
			// reset bold on all section li tags
			this.$el.find('li[data-section_id]').css('font-weight', 'normal');
			// set the current sections nav item to bold
			var li = this.$el.find('li[data-section_id="' + section.id + '"]');
			li.css('font-weight', 'bold');
			// find any vertical nav arrows and click them to close
			this.$el.find('li.V').click();
			// find parents of the li that are horizontal and click
			li.parents('li.H').each(function() {
				$(this).click();
			});
		});
	},
	toggleDrawer: function() {
		if (this.isOpen) {
			this.closeDrawer();
		}
		else {
			this.openDrawer();
		}
	},
	closeDrawer: function() {
		if (this.isOpen) {
			Backbone.trigger('tocClosing');
			this.$el.animate({ left: '-200px' });
			this.isOpen = false;
		}
	},
	openDrawer: function() {
		if (!this.isOpen) {
			// tell other drawers to close
			Backbone.trigger('drawersClose', this);
			Backbone.trigger('tocOpening');
			this.$el.animate({ left: '0px'});
			this.isOpen = true;
		}
	},
	render: function() {
		// render and place content
		this.$el.html(this.template({
			referenceImageUrl: this.sectionImageUrl,
			navTree: this.navTree
		}));
		this.renderCollapsibleList();

		// bind handle to open/close panel
		this.$el.find('#toc-handle').on('click', this, function(event) {
			event.data.toggleDrawer();
		});
	},
	renderNavTree: function() {
		var topLevelItems = app.collections.navigationItems.where({parent: null});

		// build the markup for the navigation menu
		var markup = $('<ul class="collapsibleList"></ul>');
		for (var i = 0; i < topLevelItems.length; i++) {
			markup.append(this.renderNavSubTree(topLevelItems[i]));
		}
		return markup[0].outerHTML;
	},
	renderNavSubTree: function(item) {
		// create item's li tag
		var itemMarkup = $('<li></li>')
			.attr('data-section_id', item.id)
			.attr('data-active', item.get('active'))
			.append('<div class="navArrowContainer"></div>')
			.append('<div class="navTitle">' + item.get('title') + '</div>');

		var i, ul;
		// get the children of this item and render them too
		var children = app.collections.navigationItems.where({parent: item});
		if (children.length > 0) {
			ul = $('<ul></ul>');
			for (i = 0; i < children.length; i++) {
				ul.append(this.renderNavSubTree(children[i]));
			}
			itemMarkup.append(ul);
		}

		var subHeadings = item.get('subHeadings');
		if (subHeadings.length > 0) {
			ul = $('<ul></ul>');
			for (i = 0; i < subHeadings.length; i++) {
				var subHead = $('<li></li>')
					.attr('data-section_id', item.id)
					.attr('data-active', item.get('active'))
					.attr('data-field', subHeadings[i].id)
					.append('<div class="navTitle">' + subHeadings[i].label + '</div>');
				ul.append(subHead);
			}
			itemMarkup.append(ul);
		}
		return itemMarkup;
	},
	renderCollapsibleList: function() {
		var that = this;
		// calculate and set a fixed height on the navigation area
		var navigation = this.$el.find('#toc-navigation');
		var navHeight = window.innerHeight - navigation.offset().top;
		navigation.css('height', navHeight + 'px');

		var list = this.$el.find('ul.collapsibleList').first();

		// hide all but the top level items
		list.find('ul').addClass('collapsed').hide();

		// for each li that has a descendant ul, bind it's click to show the below listings
		list.find('li > ul')
			.parent()
			.addClass('navArrow H')
			.bind('click', {view: this}, this.toggleCollapsibleList);

		// bind the mouseover of each li to fire a change event for the reference image
		list.find('li')
			.bind('mouseenter', function(event) {
				var itemId = $(event.currentTarget).attr('data-section_id');
				var item  = app.collections.navigationItems.get(itemId);
				var thumb = item.get('thumbnail');
				if (thumb) {
					var refImg = that.$el.find('#toc-reference-image img').first();
					if (refImg) {
						refImg.attr('src', thumb);
					}
				}
			})
			.bind('mouseleave', function(event) {
				var refImg = that.$el.find('#toc-reference-image img').first();
				if (refImg) {
					refImg.attr('src', that.sectionImageUrl);
				}
			});

		// bind section titles to navigate on click
		list.find('li div.navTitle').on('click', function(event) {
			event.preventDefault();
			var active = $(this).parent().attr('data-active');
			if (active === 'true') {
				var sectionId = $(this).parent().attr('data-section_id');
				var routeTo = "/section/" + sectionId;
				var field = $(this).parent().attr('data-field');
				if (field) {
					routeTo += "/" + field + "_anchor";
				}
				that.closeDrawer();
				if (field && sectionId === app.views.navigationView.currentNavigationItem.id) {
					Backbone.trigger('navigate', { identifier: field + "_anchor" });
				} else if (sectionId !== app.views.navigationView.currentNavigationItem.id) {
					app.router.navigate(routeTo, {trigger: true});
				}
			}
		});

		// bind non-active titles to show unavailable message on hover
		list.find('li[data-active="false"] div.navTitle').qtip({
			content: {
				text: 'The complete version of Renoir Paintings and Drawings at the Art Institute of Chicago will include entries for the following works of art.'
			},
			position: {
				my: 'left center',
				at: 'right center'
			},
			style: {
				classes: 'qtip-dark qtip-section-unavailable'
			}
		});

	},
	toggleCollapsibleList: function(event) {
		// only catch the nearest li click
		if (!event.isDefaultPrevented()) {
			event.preventDefault();
			// determine status of clicked li
			var li = $(event.currentTarget);
			var closed = li.hasClass('H');
			if (closed) {
				event.data.view.showCollapsibleList(li);
			}
			else {
				event.data.view.hideCollapsibleList(li);
			}
		}
	},
	showCollapsibleList: function(li) {
		// reclass as Vertical Arrow, bind the click, and open the child ul
		li.removeClass('H')
			.addClass('V')
			// unhide the sibling ul
			.children('ul')
			.removeClass('collapsed')
			.addClass('expanded')
			.slideDown();
	},
	hideCollapsibleList: function(li) {
		// reclass as Horizontal Arrow and bind the click and open the sibling ul
		li.removeClass('V')
			.addClass('H')
			.children('ul')
			.removeClass('expanded')
			.addClass('collapsed')
			.slideUp();
	}
});
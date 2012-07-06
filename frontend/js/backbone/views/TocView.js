// Aic Namespace Initialization //
if (typeof OsciTk === 'undefined'){OsciTk = {};}
if (typeof OsciTk.views === 'undefined'){OsciTk.views = {};}
// Aic Namespace Initialization //

Aic.views.Toc = OsciTk.views.BaseView.extend({
	id: 'toc-view',
	template: OsciTk.templateManager.get('toc'),
	initialize: function() {
		this.navTree = null;
		this.isOpen = false;
		
		app.dispatcher.on('referenceImageLoaded', function(referenceImageView) {
			this.referenceImageUrl = referenceImageView.imageUrl;
			this.render();
		}, this);
		
		app.dispatcher.on('navigationLoaded', function(navigationItems) {
			this.navTree = this.renderNavTree();
		}, this);

		// when a section is loaded, find and highlight the matching navigation item
		app.dispatcher.on('sectionLoaded', function(section) {
			var li = this.$el.find('li[data-section_id="' + section.id + '"]');
			li.css('font-weight', 'bold');
			// find any vertical nav arrows and click them to close
			this.$el.find('li.V').click();
			// find parents of the li that are horizontal and click
			li.parents('ul').each(function() {
				$(this).children('li.H').click();
			});
		}, this);
	},
	switchDrawer: function() {
		if (this.isOpen) {
			this.$el.animate({ left: '-200px' });
			this.isOpen = false;
		}
		else {
			this.$el.animate({ left: '0px'});
			this.isOpen = true;
		}
	},
	render: function() {
		this.$el.html(this.template({
			referenceImageUrl: this.referenceImageUrl,
			navTree: this.navTree
		}));
		this.renderCollapsibleList();
		
		// bind handle to open/close panel
		this.$el.find('#toc-handle').on('click', this, function(event) {
			event.data.switchDrawer();
		});

		// bind section titles to navigate
		this.$el.find('#toc-navigation li div.navTitle').on('click', function(event) {
			var sectionId = $(this).parent().attr('data-section_id');
			app.router.navigate("/section/" + sectionId, {trigger: true});
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
			.append('<div class="navArrowContainer"></div>')
			.append('<div class="navTitle">' + item.get('title') + '</div>');
		// get the children of this item and render them too
		var children = app.collections.navigationItems.where({parent: item});
		for (var i = 0; i < children.length; i++) {
			var ul = $('<ul></ul>')
				.append(this.renderNavSubTree(children[i]));
			itemMarkup = itemMarkup.after(ul);
		}
		return itemMarkup;
	},
	renderCollapsibleList: function() {
		var lists = this.$el.find('ul.collapsibleList');
		for (var i = 0; i < lists.length; i++) {
			var list = $(lists[i]);
			// hide all but the top level items
			list.find('ul').addClass('collapsed').hide();
			
			// for each li that has a sibling ul, bind it's click to show the below listings
			list.find('li + ul')
				.prev()
				.addClass('navArrow H')
				.bind('click', {view: this}, this.toggleCollapsibleList);

			// bind the mouseover of each li to fire a change event for the reference image
			list.find('li')
				.bind('mouseenter', this.changeReferenceImage)
				.bind('mouseleave', this.restoreReferenceImage);
		}
	},
	changeReferenceImage: function(event) {
		var itemId = $(event.currentTarget).attr('data-section_id');
		var item  = app.collections.navigationItems.get(itemId);
		var thumb = item.get('thumbnail');
		if (thumb) {
			app.dispatcher.trigger('referenceImageChange', thumb);
		}
	},
	restoreReferenceImage: function(event) {
		app.dispatcher.trigger('referenceImageRestore');
	},
	toggleCollapsibleList: function(event) {
		// determine status of clicked li
		var li = $(event.currentTarget);
		var closed = li.hasClass('H');
		if (closed) {
			event.data.view.showCollapsibleList(li);
		}
		else {
			event.data.view.hideCollapsibleList(li);
		}
	},
	showCollapsibleList: function(li) {
		// reclass as Vertical Arrow, bind the click, and open the siblings
		li.removeClass('H')
			.addClass('V')
			// unhide the sibling ul
			.siblings('ul')
			.removeClass('collapsed')
			.addClass('expanded')
			.slideDown();
	},
	hideCollapsibleList: function(li) {
		// reclass as Horizontal Arrow and bind the click and open the sibling ul
		li.removeClass('V')
			.addClass('H')
			.siblings('ul')
			.removeClass('expanded')
			.addClass('collapsed')
			.slideUp();
	}
});
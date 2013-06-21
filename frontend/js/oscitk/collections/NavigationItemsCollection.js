OsciTk.collections.NavigationItems = OsciTk.collections.NavigationItems.extend({
	parseChildren: function(items, parent, depth) {
		if (_.isArray(items) === false) {
			items = [items];
		}
		for (var i = 0, numItems = items.length; i < numItems; i++) {
			var item = items[i];
			if (item.a) {
				var parsedItem = {
					id: item.a['data-section_id'],
					parent: parent,
					depth: depth,
					previous: this.at(this.length - 1) || null,
					next: null,
					length: item.a['data-length'] || null,
					title: item.a['value'],
					subtitle: item.a['data-subtitle'],
					thumbnail: item.a['data-thumbnail'],
					timestamp: item.a['data-timestamp'],
					uri: item.a['href'],
					active: (item.a['data-active'] == "1") ? true : false,
					subHeadings: JSON.parse(item.a['data-subHead'])
				};
				// if thumbnail is from figure, note the index
				if (typeof(item.a['data-thumbnail_figure_index']) !== 'undefined') {
					parsedItem.thumbnail_figure_index = item.a['data-thumbnail_figure_index'];
				}
				this.add(parsedItem);

				var navItem = this.at(this.length - 1);
				if (navItem.get('previous') !== null) {
					navItem.get('previous').set('next', navItem);
				}

				// if 'ol' tag is present, sub sections exist, process:
				if (item.ol && item.ol.li) {
					var children;
					// due to the way the xml is parsed, it comes back as an array or a direct object
					if (item.ol.li.length) {
						children = item.ol.li;
					}
					else {
						children = [item.ol.li];
					}
					var nextDepth = depth + 1;
					for (var h = 0, numChildren = children.length; h < numChildren; h++) {
						this.parseChildren(children[h], navItem, nextDepth);
					}
				}
			}
			if (item.li) {
				this.parseChildren(item.li, parent, depth);
			}
		}
	}
});
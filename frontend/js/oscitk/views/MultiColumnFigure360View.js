OsciTk.views.figureTypeRegistry["360_slider"] = "MultiColumnFigure360";

OsciTk.views.MultiColumnFigure360 = OsciTk.views.MultiColumnFigure.extend({
	events: {},
	renderContent: function(callback) {
		var container = this.$el.find(".figure_content");
		var containerHeight = container.height();
		var containerWidth = container.width();
		container.html(this.model.get("content"));
		container.children("img").css({
			height: containerHeight + "px",
			width: containerWidth + "px"
		});
		this.contentRendered = true;
	},
	fullscreen:function() {
		//var content = this.$el.find(".threesixty");
		var content = this.model.get("content");
		content = $(content);
		var width = content[0].getAttribute('data-360-width');
		var height = content[0].getAttribute('data-360-height');
		$.fancybox.open({
			padding: 0,
			minWidth  : width,
			minHeight : height,
            content: this.model.get('content'),
			title: this.model.get('caption'),
				helpers: {
				title: {
					type : 'inside'
					}
				}
        });
	}
});
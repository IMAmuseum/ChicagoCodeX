OsciTk.views.figureTypeRegistry["rti_viewer"] = "MultiColumnFigureRTI";

OsciTk.views.MultiColumnFigureRTI = OsciTk.views.MultiColumnFigure.extend({
	renderContent: function() {
		var container = this.$el.find(".figure_content");
		var containerHeight = container.height();
		var containerWidth = container.width();
		container.html(this.model.get("content"));
		this.contentRendered = true;
	},
	fullscreen:function() {
		return null;
	}
});
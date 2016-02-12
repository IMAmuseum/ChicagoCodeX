OsciTk.views.figureTypeRegistry["rti_viewer"] = "MultiColumnFigureRTI";

OsciTk.views.MultiColumnFigureRTI = OsciTk.views.MultiColumnFigure.extend({
	events: {},
	renderContent: function() {
		var container = this.$el.find(".figure_content");
		container.html(this.model.get("content"));
		this.contentRendered = true;
	},
	fullscreen:function() {
		var content = this.model.get("content");
		content = $(content);
		var windowWidth = $(window).width() - 200;
	    var windowHeight = $(window).height() - 200;
	    var canvasFullscreenName = content.data('rti-name') + '_fullscreen';
	    var fullscreenCode = '<div class="figure_content" style="width:'+ windowWidth+'px; height: '+windowHeight+'px;"><div class="rtiViewer" data-rti-div = "rtiViewer" data-rti-name = "'+canvasFullscreenName+'" data-rti-url = "'+content.data('rti-url')+'" data-rti-width = "'+content.data('rti-width')+'" data-rti-height = ""'+content.data('rti-height')+'"" ></div><script>createRtiViewer(true);</script></div>';
		$.fancybox.open({
		  padding: 0,
		  scrolling: 'no',
          content: fullscreenCode,
		  title: this.model.get('caption'),
		    helpers: {
			  title: {
			    type : 'inside'
				}
			}
        });
	}
});

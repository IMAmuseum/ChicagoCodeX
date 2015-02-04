OsciTk.collections.Figures = OsciTk.collections.BaseCollection.extend({
    model: OsciTk.models.Figure,

    initialize: function() {
        this.listenTo(Backbone, 'figuresAvailable', function(figures) {
            this.populateFromMarkup(figures);
            Backbone.trigger('figuresLoaded', this);
        });
    },

    comparator: function(figure) {
        return figure.get('delta');
    },

    /**
     * Populates the collection from an array of figure markup
     */
    populateFromMarkup: function(data) {
		
        var figures = [];

        var override = false;
        var sectionClasses = app.models.section.get('classes');
        var needsOverride = ['node-figure-gallery'];
        if (_.isArray(sectionClasses) && _.intersection(sectionClasses, needsOverride).length) {
            override = true;
        }

        _.each(data, function(markup) {
            var idComponents = markup.id.match(/\w+-(\d+)-(\d+)/);
            var $markup = $(markup);

            var position;
            var columns;
            if (override) {
                position = 'i';
                columns = 1;
                $markup.find('.figure_number').remove();
            } else {
                position = $markup.data('position');
                columns = $markup.data('columns');
            }

            var figure = {
                id:         markup.id,
                rawData:    markup,
                body:       markup.innerHTML,
                section_id: idComponents[1],
                delta:      idComponents[2],
                title:      $markup.attr('title'),
                caption:    $markup.find('figcaption').html(),
                content:    $markup.find('.figure_content').html(),
                position:   position,
                columns:    columns,
                options:    $markup.data('options'),
                thumbnail_url: undefined, // Defaults to image defined in css
                type:       $markup.data('figure_type'),
                aspect:     $markup.data('aspect'),
                order:      $markup.data('order'),
                count:      $markup.data('count'),
				alt:		$markup.data('alt')
            };

            // First, check for a preview uri in the figure options
            if (figure.options.previewUri) {
                figure.thumbnail_url = figure.options.previewUri;
                figure.preview_url = figure.options.previewUri;
            }
            else {
                // Second, check for an explicit thumbnail
                var thumbnail = $markup.children('img.thumbnail').remove();
                if (thumbnail.length) {
                    figure.thumbnail_url = thumbnail.attr('src');
                    figure.preview_url = thumbnail.attr('src');
					figure.alt = thumbnail.attr('alt');
                }
                else {
                    // No explicit thumbnail, default to the first image in the figure content
                    var image = $('.figure_content img', markup);
                    if (image.length) {
                        figure.thumbnail_url = image.attr('src');
                        figure.preview_url = image.attr('src');
                    }
                    // TODO: Default to the figure type default? Also via css?
                }
            }

            // add the figure to the array for adding to the collection
            figures.push(figure);

        }, this);

        // populate the collection
        this.reset(figures);
    }
});
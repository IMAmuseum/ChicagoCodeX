(function ($) {
    /****************************************
     * Figure Image Handling
     */
    $(document).bind("osci_layout_complete", function(e) {
        $('.figureContent img').each(function() {
            $(this).width($(this).parents('.figureContent').width());
            $(this).height($(this).parents('.figureContent').height());
        });

    });

    $(document).ready(function() {
        $('.figureContent a').fancybox();

        $(".osci_reference_image a").fancybox();
        /***************************************
         * Hot key popup image
         */

        var keyCode = 70;
        var checkKey = false;
        var titleLink = '<a target="_blank" href="' + $('.field-name-field-primary-image a').attr('href') + '">Open in new window</a>';
        
        $('.field-name-field-primary-image a').fancybox({ 
            speedIn: 100, 
            speedOut: 100, 
            scroll: 'no',
            title: titleLink 
        });

        $(document).keydown(function(e) {
            if (e.keyCode == keyCode && e.ctrlKey === true && checkKey === false) {
                checkKey = true;
                $('.field-name-field-primary-image a').click();
                $(".everpresent a").click();
                e.preventDefault();
            } else if (e.keyCode == keyCode && checkKey === true) {
                checkKey = false;
                $('#fancybox-close').click();
                $(".everpresent a").click();
                e.preventDefault();
            }
        });
        /* KEYUP
        $(document).keyup(function(e) {
            if (e.keyCode == keyCode && checkKey == true) {
                checkKey = false;
                $('#fancybox-close').click();
                e.preventDefault();
            }
        });
        */

    });

    /**************************************************
     * CKEditor Paste from word and create footnotes
     */

    if (typeof(CKEDITOR) === 'undefined') return;

    CKEDITOR.timestamp = ( new Date() ).valueOf();
    $(document).ready(function() {

        $('.field-type-osci-body-copy').each(function() {
            var id = $(this).attr('id');
            listenForPaste($('#' + id + ' textarea').attr('id'));
        });

        function listenForPaste(selector) {
            var editor = CKEDITOR.instances[selector];

            // Load paste from word function if we don't already have it
            if (!CKEDITOR.cleanWord) {
                CKEDITOR.scriptLoader.load(CKEDITOR.basePath + 'plugins/pastefromword/filter/default.js');
            }

            editor.on('paste', function(evt) {
                //  replace footnotes with data
                var data = $('<span>' + evt.data.html + '</span>');
                // Search for footnote links in body text
                $('a', data).each(function(idx, val) {
                    var name = $(this).attr('name');

                    if (name.indexOf('_ftnref') === 0) {
                        $('#' + selector).parents('.fieldset-wrapper').find('.footnote-add-another').trigger('click', true);
                        var newIdSelector = $('#' + selector).parents('.fieldset-wrapper').find('.footnote-wrapper').last().attr('id');
                        var footnote = name.replace('ref', '');
                        var content  = data.find('#' + footnote.replace('_', ''));
                        $('a', content).remove();
                        content = $(content).text();
                        if (content !== null) {
                            content = CKEDITOR.cleanWord(content, editor);
                        }

                        $(val).replaceWith('[footnote:' + newIdSelector + ']');
                        $('#' + newIdSelector + ' textarea').html(content);
                        data.find('#' + footnote.replace('_', '')).remove();
                    } else {
                        $(this).next().html('');
                        $(this).html('');
                    }
                }); 
                evt.data.html = data.html();
            });
        }

    });
})(jQuery);

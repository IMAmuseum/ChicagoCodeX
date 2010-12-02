var newIdSelector = '';

(function ($) {
    $(document).ready(function() {
        var config = Drupal.settings.wysiwyg.configs.ckeditor.formatfootnote;
        $('.footnotes-wrapper .fieldset-wrapper').tabs({
            add : function (e, ui) {
                //$(this).tabs("select", ui.panel.id);
            },
            selected : 1
        });

        $("<a />", {
            "class" : "footnote-remove",
            text : "remove",
            "src" : "#"
        }).appendTo($("label",".footnotes-wrapper"));

        $('div[id$="footnote-blank"]').hide();
        $("li:first", "ul.ui-tabs-nav").hide();

        $(".footnote-remove").live("click", function(e) {
            e.preventDefault();
            //$("textarea", $(this).parent().parent()).remove();
            var $tabs = $(this).parents(".ui-tabs");
            $tabs.tabs("remove", $tabs.tabs('option', 'selected'));
        });

        $("a.footnote-add-another").click(function(e, noEditor) {
            e.preventDefault();
            var container = $(this).parents("div.ui-tabs");
            var hiddenCountElem = $('[type="hidden"]', container);
            var count = parseFloat(hiddenCountElem.val()) + 1;
            var newElement = $('div[id$="footnote-blank"]', container).clone().show();

            var newHtml = newElement.wrap("<span />").parent().html();
            newHtml = newHtml.replace(/footnote-blank/gi, count);
            newIdSelector = "#" + $(newHtml).attr("id");

            container.append(newHtml);

            container.tabs("add", newIdSelector, count);
            hiddenCountElem.val(count);

            if (noEditor !== true) {
                container.tabs('select', newIdSelector);
            }
        });

        /**************************************************
         * CKEDITOR 
         */
        $('.footnotes-wrapper textarea.first').ckeditor(function() {}, config);
        $('.ui-tabs').live('tabsselect', function(e, ui) {
            initCKeditor(ui.tab.hash + ' textarea');
        });

        function initCKeditor(obj) {
            $('.footnotes-wrapper textarea').each(function() {
                // Find all editor instances and destroy them
                var instance = $(this).data('ckeditorInstance');
                if (instance != undefined) {
                    var editor = $(this).ckeditorGet();
                    editor.destroy();
                }
            });
            $(obj).ckeditor(function() {}, config);
        }
    });
})(jQuery);

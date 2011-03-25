

(function ($) {
	
	function getPreviewDiv(id, target) {
		// send nid to server to fetch preview
		$.get(Drupal.settings.baseUrl + 'ajax/figurepreview/' + id,
			function (data) {
				$('.figure_reference_preview', 
					$(target).parents(".fieldset-wrapper:first")).html(data.div);
			},
			"json"
		);
	}
	
	
	
    $(document).ready(function() {
    	var config = Drupal.settings.wysiwyg.configs.ckeditor.formatfootnote;

    	function initCKeditor(obj) {
    		var obj = $(obj);
    		var wrapper = obj.parents('.footnotes-wrapper');
    		var textareas = $('textarea', wrapper);
    		textareas.each(function() {
    			// Find all editor instances and destroy them
                var instance = $(this).data('ckeditorInstance');
                if (instance !== undefined && instance.destroy && $.isFunction(instance.destroy)) {
                    instance.destroy();
                }
    		});
            obj.ckeditor(function() {}, config);
        }
    	
        
        /**************************************************
         * CKEDITOR 
         */
        $('.ui-tabs').live('tabsselect', function(e, ui) {
            initCKeditor(ui.tab.hash + ' textarea');
            var field = $('.figure_reference_field', ui.tab.hash);
            var val = field.val();
            if (val == parseInt(val)) {
            	getPreviewDiv(val, field);
            }
        });
        
        
        var footWrapper = $('.footnotes-wrapper .fieldset-wrapper').tabs();
        footWrapper.each(function() {
        	var wrapper = $(this);
        	if (wrapper.tabs("length") > 1) {
        		wrapper.tabs("select", 1);
        	}
        });

        var figureWrapper = $('.figures-wrapper .fieldset-wrapper').tabs();
        figureWrapper.each(function() {
        	var wrapper = $(this);
        	if (wrapper.tabs("length") > 1) {
        		wrapper.tabs("select", 1);
        	}
        });
        
        $("<a />", {
            "class" : "footnote-remove",
            text : "remove",
            "src" : "#"
        }).appendTo($("label",".footnotes-wrapper"));

        $("<a />", {
            "class" : "figure-remove",
            text : "remove",
            "src" : "#"
        }).appendTo($("div.figure_identifier",".figures-wrapper"));

        $('div[id$="footnote_blank"]').hide();
        $("li:first", "ul.ui-tabs-nav").hide();
        $('div[id$="figure_blank"]').hide();

        $(".footnote-remove, .figure-remove").live("click", function(e) {
            e.preventDefault();
            //$("textarea", $(this).parent().parent()).remove();
            var $tabs = $(this).parents(".ui-tabs");
            $tabs.tabs("remove", $tabs.tabs('option', 'selected'));
        });

        $("a.footnote-add-another, a.figure-add-another").click(function(e, noEditor) {
            e.preventDefault();
            var newIdSelector, container, hiddenCountElem, count, selectorText, newElement, newHtml;

            container = $(this).parents("div.ui-tabs");
            hiddenCountElem = $('[type="hidden"]:first', container);
            count = parseFloat(hiddenCountElem.val()) + 1;
            selectorText = $(this).attr('class').split('-');

            newElement = $('div[id$="' + selectorText[0] + '_blank"]', container).clone().show();
            
            if (selectorText[0] === "figure") {
                $(".autocomplete-processed", newElement).removeClass("autocomplete-processed");
            }
            newHtml = newElement.wrap("<span />").parent().html();
            newHtml = newHtml.replace(new RegExp(selectorText[0] + "_blank", 'gi'), count);
            newHtml = newHtml.replace(new RegExp(selectorText[0] + "-blank", 'gi'), count);
            newIdSelector = "#" + $(newHtml).attr("id");

            container.append(newHtml);

            if (selectorText[0] === "figure") {
                Drupal.behaviors.autocomplete.attach(newIdSelector, null); 
            }

            container.tabs("add", newIdSelector, count);
            hiddenCountElem.val(count);

            if (noEditor !== true) {
                container.tabs('select', newIdSelector);
            }
        });



        
        
        /**************************************************
         * Figure Preview
         */
        $('.figure_reference_field').live({
        	'keyup': function(event) {
	        	// wait a second to see if anything else was pressed
	        	var origVal = event.target.value;
	        	setTimeout(function() {
	        		var currentVal = event.target.value;
	        		if (currentVal == origVal && currentVal != "" && currentVal == parseInt(currentVal)) {
	            		getPreviewDiv(currentVal, event.target);
	        		}
	        	}, 1250);
        	},
	        'blur': function(event) {
	        	setTimeout( function() {
	        		var currentVal = event.target.value;
	            	if (currentVal == parseInt(currentVal)) {
	            		getPreviewDiv(currentVal, event.target);
	            	}
	
	        	}, 500);
	        }
        });
    });
})(jQuery);

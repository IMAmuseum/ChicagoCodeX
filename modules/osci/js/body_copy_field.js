

(function ($) {
	
	
	function getPreviewDiv(id, target) {
		// retrieve options
		var options = $.parseJSON($('.figure_options', $(target).parents(".fieldset-wrapper:first")).val());
		
		// send nid to server to fetch preview
		$.get(Drupal.settings.baseUrl + 'ajax/figurepreview/' + id,
			function (data) {
				var dest = $('.figure_reference_preview', $(target).parents(".fieldset-wrapper:first"));
				dest.html(data.div);
				
				// replace the image with the preview url if it's in the options
				if (options.previewUrl) {
					dest.find('img:first').attr('src', options.previewUrl);
				}
				
				// reClass the asset so it is not autoloaded
				dest.find('.conservation-asset').addClass('noload');
				
				// build a figure options breakout button
				var button = $('<input type="button">');
				button.val('Figure Options')
					.css('float', 'right')
					.addClass('ui-button')
					.addClass('figure_options_button');
				
				// replace the current button if it's there
				var orig_button = $('.figure_options_button', dest.parent());
				if (orig_button.length > 0) {
					orig_button.replaceWith(button);
				}
				else{
					dest.after(button);
				}
				// the figure options button fires off a modal with a rendered
				// conservation asset - use new ConservationAsset()
				button.click(function() {
					var optionsInput = dest.parent().find('input.figure_options');
					var conservationAssetClone = dest
						.find('.conservation-asset')
						.clone()
						.attr('id', 'conservation-asset-figure-options');
					var aspect = dest.find('.conservation-asset').parent().attr('data-aspect');
					var figureId = dest.siblings('.figure_identifier:first').find('span')
						.html()
						.match(/\[\w+:(.+)\]/);
					// check for this value, we must have it to continue properly
					figureId = figureId[1] ? figureId[1] : null
					if (figureId) {
						figureOptions(optionsInput, conservationAssetClone, aspect, figureId, dest);
					}
				});
				
			},
			"json"
		);
		
	}
	
	
	function figureOptions(optionsInput, figureContents, aspect, figureId, dest) {
		var options = JSON.parse(optionsInput.val());
		// we're editing, so mark that in the options
		options.editing = true;
		
		// set up new modal dialog
		var modal = $('<div>');
		modal.append('<span class="modal-title">Set Initial Frame</span>');
		
		// add a figure container with the passed options
		var figureWidth = 600;
		var figureHeight = Math.floor(figureWidth / aspect);
		var figureContainer = $('<figure>');
		figureContainer.attr('data-options', JSON.stringify(options))
			.css({
				margin: '0 auto',
				width: figureWidth + 'px',
				height: figureHeight + 'px'
			})
			.html(figureContents);
		modal.append(figureContainer);
		 
		// options fieldset
		var fieldset = $('<fieldset class="figure_options">').append('<legend>Reader Options</legend>');
		
		// insert polymap options
		// interaction control
		var interactionContainer = $('<div>');
		var interactionLabel = $('<label>').html('Disable Interaction');
		var interactionToggle = $('<input type="checkbox">')
			.addClass('interaction_toggle');
		if (options.interaction == false) {
			interactionToggle.attr('checked', 'checked');
		}
		interactionContainer.append(interactionToggle).append(interactionLabel);
		fieldset.append(interactionContainer);
		
		// clear between elements
		fieldset.append($('<div>').addClass('clear').html('&nbsp;'));
		
		// insert annotation overlay options
		// inset annotation control
		var annotationContainer = $('<div>');
		var annotationLabel = $('<label>').html('Disable Annotation Selection');
		var annotationToggle = $('<input type="checkbox">');
		if (options.annotation == false) {
				annotationToggle.attr('checked', 'checked');
		}
		annotationContainer.append(annotationToggle).append(annotationLabel);
		fieldset.append(annotationContainer);
		
		// clear between elements
		fieldset.append($('<div>').addClass('clear').html('&nbsp;'));
		
		// thumbnail
		var thumbContainer = $('<div class="thumbContainer">');
		var thumbLabel = $('<label>').html('Thumbnail Image');
		var thumbFileField = $('<input type="file" id="thumbFileField">');
		
		thumbContainer.append(thumbLabel).append(thumbFileField);
		if (options.previewUrl) {
			var thumbRemoveContainer = $('<div>');
			var thumbRemove = $('<input type="checkbox" id="thumbRemove" />')
				.appendTo(thumbRemoveContainer)
				.after('<label>Remove Thumbnail</label>');
			var thumbImage = $('<img>')
				.attr('src', options.previewUrl)
				.appendTo(thumbContainer)
				.wrap('<div>');
			thumbContainer.append(thumbRemoveContainer);
			
			// thumbRemove should disable the file input
			thumbRemove.bind('click', function() {
				var checkbox = $(this);
				console.log(checkbox.attr('checked'));
				if (checkbox.attr('checked')) {
					thumbFileField.attr('disabled', true);
					thumbImage.addClass('image_opaque');
				}
				else {
					thumbFileField.attr('disabled', false);
					thumbImage.removeClass('image_opaque');
				}
			});
		}
		fieldset.append(thumbContainer);
		
		
		// add input to track originating figure
		var wrapperId = $('<input type="hidden" />');
		wrapperId.val(figureId);
		fieldset.append(wrapperId);
		
		// add options fieldset to modal
		modal.append(fieldset);
		
		modal.dialog({
			title: 'Figure Options',
			width: figureWidth + 25,
			modal: true,
			close: function(event, ui) {
				// remove the CA from the global collection
				window.caCollection.remove(jQuery('.conservation-asset', event.target).attr('id'));
				jQuery(this).remove();
			},
			buttons: [
			    { 
			    	text: 'Cancel', 
			    	click: function(){ $(this).dialog('close') }
			    },
			    { 
			    	text: 'Restore Defaults',
			    	click: function() {
			    		// trigger get_map event on map container 
		        		$('.conservation-asset', figureContainer).trigger({type: "restore_default_map"});
		        		$('input', fieldset).removeAttr('checked');
		        	}
		        },
		        {
		        	text: 'Finish', 
		        	click: function(event) {
		        		var button = $(event.currentTarget);
		        		// is the button already locked? 
		        		var locked = button.attr('data-locked');
		        		if (locked) {
		        			return false;
		        		}
		        		else {
		        			// lock the button
		        			button.attr('data-locked', 1);
		        			// make the button appear disabled
		        			button.css('background', '#333');
		        			button.text('Uploading ...');
		        		}
		        		// if a thumbnail was specified, upload it and get back the file path
		        		// inlcude the path in the options below
		        		if (thumbFileField.val() != "" && !thumbFileField.attr('disabled')) {
		        			var reader = new FileReader();
		        			// declare onload for reader
		        			reader.onload = function(e) {
		        				// get the dataURI
		        				var fileDataURI = e.target.result;
		        				// send the image to the server
		        				var post = {
		        					fileDataURI: fileDataURI,
		        					figureId: figureId
		        				};
		        				$.ajax({
		        					type: 'POST',
		        					url: Drupal.settings.baseUrl + "ajax/figurethumb/save",
		        					data: post,
		        					success: function(data) {
		        						// get the current figure options, add or replace the url
		        						// and resave the options to the dom.
	        					  		var data = JSON.parse(data);
	        					  		var figureOptions = JSON.parse(dest.siblings('.figure_options:first').val());
	        					  		figureOptions.previewUrl = data.url;
	        					  		dest.siblings('.figure_options:first').val(JSON.stringify(figureOptions));
	        					  		  
	        					  		// swap out the original preview image
	        					  		var imageElem = dest.find('img:first');
	        					  		// force a timestamp here to force reload
	        					  		imageElem.attr('src', data.url + "?" + new Date().getTime())
	        					  			.css('display', 'block');
	        					  		 
	        					  		modal.dialog('close');
		        					}
		        				});
		        			};
		        			// read in the file to activate the onload function
		        			reader.readAsDataURL(thumbFileField[0].files[0]);
		        		}
		        		
		        		// alias the figure options map
		        		var ca = caCollection.find('conservation-asset-figure-options');
		        		// get extents of map
		        		var extents = ca.getExtents();
		        		// set up the new options
		        		var newOptions = JSON.parse(dest.siblings('.figure_options:first').val());
		        		newOptions.swLon 			= extents.swLon;
		        		newOptions.swLat 			= extents.swLat;
                    	newOptions.neLon 			= extents.neLon;
                    	newOptions.neLat 			= extents.neLat;
                    	newOptions.interaction 		= (!interactionToggle.attr('checked'));
                    	newOptions.annotation 		= (!annotationToggle.attr('checked'));
                    	newOptions.annotationPreset	= ca.getVisibleAnnotationIds();
                    	newOptions.sliderPosition	= ca.getSliderPosition();
                    	newOptions.baseLayerPreset	= ca.getVisibleBaseLayerIds();
                    	if (thumbRemove && thumbRemove.attr('checked')) {
                    		newOptions.previewUrl = false;
                    		dest.find('.preview_image').css('display', 'none');
                    	}
                    	newOptions = JSON.stringify(newOptions);
                    	
		        		// inject into hidden form
                    	var input = $('.figure_options', dest.parents(".fieldset-wrapper:first"));
                    	input.val(newOptions);
                    	// update the preview figure
                    	dest.attr('data-options', newOptions);
		        		// close the modal
		        		if (thumbFileField.val() == "" || thumbFileField.attr('disabled')) {
		        			modal.dialog('close');
		        		}
		        		  
		        		if (dest.find('.figure_warning').length == 0) {
		        			var warn = $('<div>')
		        				.addClass('figure_warning')
					  		 	.html("Figure Options Set<br>Don't forget to save this node")
					  			.css({
					  				'font-size': 'smaller',
			    			  		'color' : '#F00'
					  			});
					  		warn.prependTo(dest);
		        		}
		        	}
		        }
			]
		});
		
		// initialize conservation asset
		new ConservationAsset(figureContents);
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
                if (instance !== undefined && instance !== null && instance.destroy && $.isFunction(instance.destroy)) {
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
            var field = $('[id^="edit-field-osci-body-und"]', ui.tab.hash).filter('[id$="figure-reference"]');
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
	        			// remove figure options and get new preview
	            		jQuery(event.target).parents('.figure-wrapper').find('.figure_options').val("{}");
	            		getPreviewDiv(currentVal, event.target);

	        		}
	        	}, 1250);
        	},
	        'blur': function(event) {
	        	setTimeout( function() {
	        		var currentVal = event.target.value;
	            	if (currentVal == parseInt(currentVal)) {
	            		// remove figure options and get new preview
	            		jQuery(event.target).parents('.figure-wrapper').find('.figure_options').val("{}");
	            		getPreviewDiv(currentVal, event.target);
	            	}
	        	}, 500);
	        }
        });
        
    });
})(jQuery);

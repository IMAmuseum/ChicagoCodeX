(function ($) {

	$.fn.highlight = function(options) { 
		var settings = $.extend({
			wrapperElement: 'span',
			wrapperClass: 'highlight',
		}, options);
		
		// Listen for mouse up event, capture text, and highlight it
	    $(this).mouseup(function() {
	        var selectionRange = getSelected();
	        var parentNode = selectionRange.commonAncestorContainer;
	        var foundStart = false;
	        var foundEnd = false;

	        /* 
	         * A single node will have itself as the common ancestor.
	         */
	        if (parentNode.isSameNode(selectionRange.startContainer)) {
	        	/*
	        	 * nodeType 1 = textNode
	        	 * nodeType 3 = htmlNode
	        	 */
	        	if (this.nodeType == 1) { 
		        	processTxtNode(parentNode, 'start', selectionRange.startOffset);
		        	processTxtNode(parentNode, 'end', selectionRange.endOffset);
	        	} else if (this.nodeType == 3) {
	        		processHtmlNode(parentNode.parentElement, 'start', selectionRange.startOffest);
	        		processHtmlNode(parentNode.parentElement, 'end', selectionRange.endOffset);
	        	}
		    } else { 
		        $(parentNode).contents().each(function() {
		            // Text Nodes
		            if (selectionRange.startContainer.isSameNode(this) && !foundStart) {
		            	processTxtNode(this, 'start', selectionRange.startOffset);
		                foundStart = true;
		            } else if (selectionRange.endContainer.isSameNode(this) && !foundEnd) {
		            	processTxtNode(this, 'end', selectionRange.endOffset);
		                foundEnd = true;
		            } else if (this.nodeType == 3 && foundStart == true && foundEnd !== true) {
		            	processTxtNode(this, 'middle');
		            }
	
		            // HTML Nodes
		            if (selectionRange.startContainer.parentElement.isSameNode(this) && !foundStart) {
		            	processHtmlNode(this, 'start', selectionRange.startOffset)
		                foundStart = true;
		            } else if (selectionRange.endContainer.parentElement.isSameNode(this) && !foundEnd) {
		            	processHtmlNode(this, 'end', selectionRange.endOffset);
		                foundEnd = true;
		            } else if (this.nodeType == 1 && foundStart == true && foundEnd !== true) {
		            	processHtmlNode(this, 'middle');
		            }
		        });
		    }
	    });
	    
	    // Get selected text and return the selection range object
	    
	    var getSelected = function() {
	        if (window.getSelection) { // W3C compliant browser.  aka, not IE
	            var selection = window.getSelection();
	        } else { // IE
	            var selection = document.selection && document.selection.createRange();
	        }
	        
	        if (selection == '') return false;

	        if (selection.getRangeAt)
	            var range = selection.getRangeAt(0);
	        else { // Safari!
	            var range = document.createRange();
	            range.setStart(selection.anchorNode,selection.anchorOffset);
	            range.setEnd(selection.focusNode,selection.focusOffset);
	        }

	        return range;
	    }
	    
	    // Process a text node with a wrapper
	    var processTxtNode = function(textNode, position, offset) {
	        var wrapper = document.createElement(settings.wrapperElement);
	        wrapper.className = settings.wrapperClass;

	    	switch(position) {
	    		case 'start':
	    			var preText = document.createTextNode(textNode.nodeValue.substring(0, offset));
	    			wrapper.appendChild(document.createTextNode(textNode.nodeValue.substring(offset, textNode.length)));
	    			textNode.parentNode.insertBefore(preText, textNode);
	    	        textNode.parentNode.replaceChild(wrapper, textNode);
	    			break;
	    		case 'middle':
	    			wrapper.appendChild(document.createTextNode(textNode.nodeValue));
	    	        textNode.parentNode.replaceChild(wrapper, textNode);
	    			break;
	    		case 'end':
	    			wrapper.appendChild(document.createTextNode(textNode.nodeValue.substring(0, offset)));
	    			var postText = document.createTextNode(textNode.nodeValue.substring(offset, textNode.length));
	    			textNode.parentNode.insertBefore(wrapper, textNode);
	    	        textNode.parentNode.replaceChild(postText, textNode);
	    			break;
	    	}
	    	
	    }

	    // Process html node with a wrapper
	    var processHtmlNode = function(htmlNode, position, offset) {
	    	switch(position) {
	    		case 'start':
	    			var newHtml = $(htmlNode).html().substring(0, offset) 
	                	+ '<span>' 
	                	+ $(htmlNode).html().substring(offset, htmlNode.length) 
	                	+ '</span>';
	    			$(htmlNode).html(newHtml);
	    			break;
	    		case 'middle':
	                $(htmlNode).html('<span>' + $(htmlNode).html() + '</span>');
	    			break;
	    		case 'end':
	    			var newHtml = '<span>'
	                    + $(htmlNode).html().substring(0, offset) 
	                    + '</span>'
	                    + $(htmlNode).html().substring(offset, htmlNode.length);
	                $(htmlNode).html(newHtml);
	    			break;
	    	}
	    }
    }
})(jQuery);


(function ($) {

	$.fn.highlight = function(options) { 
		var settings = $.extend({
			wrapperElement: 'span',
			wrapperClass: 'highlight',
            eventListen: 'mouseup',
            eventTarget: this,
            success: function() {} 
		}, options);
		
		// Listen for mouse up event, capture text, and highlight it
	    $(settings.eventTarget).bind(settings.eventListen, function() {
	        var selectionRange = getSelected();
	        var parentNode = selectionRange.commonAncestorContainer;
	        var foundStart = false;
	        var foundEnd = false;

	        /* 
	         * A single node will have itself as the common ancestor.
	         */
	        if (parentNode.isSameNode(selectionRange.startContainer)) {
		       	processTxtNode(parentNode, 'node', selectionRange.startOffset, selectionRange.endOffset);
            /* 
             * Multiple nodes have been selected
             */
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

            settings.success(this);
	    });
	    
	    // Get selected text and return the selection range object
	    var getSelected = function() {
	        if (window.getSelection) { // W3C compliant browser.  aka, not IE
	            var selection = window.getSelection();
	        } else { // IE
	            var selection = document.selection && document.selection.createRange();
	        }
	        
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
	    var processTxtNode = function(textNode, position, offset, offset2) {

	    	switch(position) {
	    		case 'start':
	    			var preText = document.createTextNode(textNode.nodeValue.substring(0, offset));
                    var wrapper = wrapTxt(document.createTextNode(textNode.nodeValue.substring(offset, textNode.length)));

	    			textNode.parentNode.insertBefore(preText, textNode);
	    	        textNode.parentNode.replaceChild(wrapper, textNode);
	    			break;
	    		case 'middle':
                    var wrapper = wrapTxt(document.createTextNode(textNode.nodeValue));

	    	        textNode.parentNode.replaceChild(wrapper, textNode);
	    			break;
	    		case 'end':
                    var wrapper     = wrapTxt(document.createTextNode(textNode.nodeValue.substring(0, offset)));
	    			var postText    = document.createTextNode(textNode.nodeValue.substring(offset, textNode.length));

	    			textNode.parentNode.insertBefore(wrapper, textNode);
	    	        textNode.parentNode.replaceChild(postText, textNode);
	    			break;
                case 'node':
                    var wrapper     = wrapTxt(document.createTextNode(textNode.nodeValue.substring(offset, offset2)));
                    var preText     = document.createTextNode(textNode.nodeValue.substring(0, offset));
                    var postText    = document.createTextNode(textNode.nodeValue.substring(offset2, textNode.length));
                    var newText     = document.createDocumentFragment();
                    newText.appendChild(preText);
                    newText.appendChild(wrapper);
                    newText.appendChild(postText);
                    textNode.parentNode.replaceChild(newText, textNode);
                    break;
	    	}
	    	
	    }

	    // Process html node with a wrapper
	    var processHtmlNode = function(htmlNode, position, offset) {
	    	switch(position) {
	    		case 'start':
	    			var preHtml = htmlNode.innerHTML.substring(0, offset);
                    var wrapper = wrapHtml(htmlNode.innerHTML.substring(offset, htmlNode.innerHTML.length));
	    			htmlNode.innerHTML = preHtml; 
                    htmlNode.appendChild(wrapper);
	    			break;
	    		case 'middle':
                    var wrapper = wrapHtml(htmlNode.innerHTML);
                    htmlNode.innerHTML = '';
                    htmlNode.appendChild(wrapper);
	    			break;
	    		case 'end':
	                var postHtml = htmlNode.innerHTML.substring(offset, htmlNode.innerHTML.length);
                    var wrapper = wrapHtml(htmlNode.innerHTML.substring(0, offset));
                    htmlNode.innerHTML = '';
                    htmlNode.insertBefore(wrapper);
                    htmlNode.innerHTML += postHtml;
	    			break;
	    	}
	    }
    
        var wrapTxt = function(txt) {
            var wrapper = document.createElement(settings.wrapperElement);
            wrapper.className = settings.wrapperClass;
            wrapper.appendChild(txt);
            return wrapper;
        }

        var wrapHtml = function(html) {
            var wrapper = document.createElement(settings.wrapperElement);
            wrapper.className = settings.wrapperClass;
            wrapper.innerHTML = html;
            return wrapper;
        }
    }
})(jQuery);


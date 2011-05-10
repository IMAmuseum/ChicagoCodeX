(function ($) {

	$.fn.highlight = function(options) { 
		var settings = $.extend({
			wrapperElement: 'span',
			wrapperClass: 'highlight-temp',
            eventListen: 'mouseup',
            eventTarget: this,
            parentNode: 'p',
            onSelection: function() {},
            onEmptySelection: function() { return false; },
		}, options);
		
		var selectionRange = false;
		
		// Listen for mouse up event, capture text, and highlight it
	    $(settings.eventTarget).bind(settings.eventListen, function(e) {
	        var selectionRange = getSelected();
            if (!selectionRange) return settings.onEmptySelection();

            var parentNode  = $(selectionRange.startContainer).parents(settings.parentNode)[0];
            var properties  = {
                selection:      selectionRange.toString(),
                startNode:      selectionRange.startContainer.nodeValue,
                startOffset:    selectionRange.startOffset,
                endNode:        selectionRange.endContainer.nodeValue,
                endOffset:      selectionRange.endOffset,
                parentOffset:   parentNode.innerText.indexOf(selectionRange.startContainer.nodeValue),
                paragraphId:    $(parentNode).data('paragraph_id')
            }

            highlighting = $.highlighter.highlightNode(parentNode, properties);

            // TODO: crashes browser when highlighting heading
            while (highlighting === true) {
                parentNode = $(parentNode).next(parentNode)[0];
                highlighting = $.highlighter.highlightNode(parentNode, properties, true);
            }

            settings.onSelection(this, e, properties);
	    });
	    
	    // Get selected text and return the selection range object
	    var getSelected = function() {
	        if (window.getSelection) { // W3C compliant browser.  aka, not IE
	            var selection = window.getSelection();
	        } else { // IE
	            var selection = document.selection && document.selection.createRange();
	        }

            if (selection.toString() == '') {
                $('.highlight-temp').each(function() {
                    $(this).replaceWith($(this).html());
                });
                return false;
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
	    var processTxtNode = function(textNode, startOffset, endOffset) {

	    	var preText     = document.createTextNode(textNode.nodeValue.substring(0, startOffset));
            var wrapper     = wrapTxt(document.createTextNode(textNode.nodeValue.substring(startOffset, endOffset)));
            var postText    = document.createTextNode(textNode.nodeValue.substring(endOffset, textNode.length));
            var newText     = document.createDocumentFragment();
            newText.appendChild(preText);
            newText.appendChild(wrapper);
            newText.appendChild(postText);
            textNode.parentNode.replaceChild(newText, textNode);
	    }

	    // Process html node with a wrapper
	    var processHtmlNode = function(htmlNode, startOffset, endOffset) {
                var preHtml         = htmlNode.innerHTML.substring(0, startOffset);
	    		var wrapHtmlTxt     = htmlNode.innerHTML.substring(startOffset, endOffset);
                var postHtml        = htmlNode.innerHTML.substring(endOffset, htmlNode.innerHTML.length); 
                wrapHtmlTxt         = wrapHtml(wrapHtmlTxt);
                htmlNode.innerHTML  = preHtml + wrapHtmlTxt.outerHTML + postHtml; 
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
	
    $.highlighter = {};

	$.highlighter.highlightNode = function(obj, properties, processNode) {
    	processNode = (processNode) ? processNode : false;

        $(obj).contents().each(function() {
            if ($(this).text() == '') return;

            var isStartNode = properties.startNode.indexOf($(this).text());
            var isEndNode   = properties.endNode.indexOf($(this).text());
            var startOffset = 0;
            var endOffset   = $(this).text().length;

            // Find the start node
            if (isStartNode == 0) {
                startOffset = properties.startOffset;
                processNode = true;
            }

            if (processNode === false) return;

            // Find the end node
            if (isEndNode == 0) {
                endOffset = properties.endOffset;
                var foundEnd = true;
            }

            if (this.nodeType == 1 && processNode === true) { // HTML
                processHtmlNode(this, startOffset, endOffset);
            } else if (this.nodeType == 3 && processNode === true) { // Text
                processTxtNode(this, startOffset, endOffset);
            }

            if (foundEnd === true) processNode = false;
        });
        
        return processNode; 
    }
})(jQuery);


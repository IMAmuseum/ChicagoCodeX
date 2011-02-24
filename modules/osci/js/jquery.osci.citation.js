(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.citation = function(options)
    {
        var base = this.citation;

        base.init = function()
        {
            base.options = $.extend({}, $.osci.citation.defaultOptions, options);
            base.panel = $("#" + base.options.citationPanelId);

            $(document).bind("osci_layout_complete", function(e) {

                $('#osci-citation-dialog').dialog({ 
                    title:      'Add a citation', 
                    autoOpen:   false,
                    modal:      true,
                    draggable:  false,
                    close: function() {
                        $('ul.selection-toolbar').remove();
                    }
                });

                $('#osci_viewer p.osci_paragraph').hover(
                    function() {
                        var id = $(this).data('paragraph_id');
                        $('span.osci_paragraph_' + id).css('color', '#000');
                        $('p.osci_paragraph_' + id).addClass('cite-paragraph');
                    },
                    function() {
                        var id = $(this).data('paragraph_id');
                        $('span.osci_paragraph_' + id).css('color', '#999');
                        $('p.osci_paragraph_' + id).removeClass('cite-paragraph');
                    }
                );

                $('#osci_viewer p.osci_paragraph').click(function() {
                    if (getSelection() !== '') {
                        return;
                    }

                    //var id = $(this).data('paragraph_id');
                    //$('span.osci_paragraph_' + id).append('<div class="osci-citation-dialog"><a href="#note">Add Note</a></div>');

                });

                $('#osci_viewer p.osci_paragraph').mouseup(function() {
                    $('.osci-citation-dialog').remove();

                    var selection = getSelected();
                    if (selection === '') { 
                        $('ul.selection-toolbar').remove();
                        return;
                    }

                    // build dialog and open
                    $('#edit-citation--2').html(selection);

                    //selection = '';
                    //$('#osci-citation-dialog').dialog('open');
                    $(this).prepend('<ul class="selection-toolbar"><li><a href="#highlight">Highlight</a></li><li><a href="#note">Note</a></li></ul>');
                    
                });

                $('a[href="#highlight"]').live('click', function() {
                    highlightTxt($(this).parents('.osci_paragraph'));
                });
                
                $('a[href="#note"]').live('click', function() {
                    $('#edit-citation').html(getSelected());
                    $('#osci-citation-dialog').dialog('open');
                });
            });
            
            base.panel.bind("osci_citation_toggle", function(e) {
                var $this = $(this);

                if (($this.hasClass("open") && !e.osci_citation_open) || e.osci_citation_close) {
                    $this.css({
                        "-webkit-transform" : "translate(" + ($this.outerWidth() - base.options.panelPixelsClosed) + "px, 0)",
                        "-moz-transform" : "translate(" + ($this.outerWidth() - base.options.panelPixelsClosed) + "px, 0)",
                        "transform" : "translate(" + ($this.outerWidth() - base.options.panelPixelsClosed) + "px, 0)"
                    });
                    
                    $this.removeClass("open");
                } else {
                    $this.css({
                        "-webkit-transform" : "translate(0px, 0)",
                        "-moz-transform" : "translate(0px, 0)",
                        "transform" : "translate(0px, 0)"
                    });

                    $this.addClass("open");
                }
            }).addClass("open");
        };
        
        function highlightTxt(obj) {
            var selection = getSelected(),
                txt = $(obj),
                len = txt.html().length,
                start = txt.html().indexOf(selection),
                end = start + selection.length,
                replacementTxt;
            
            $(selection).find('span').remove();
            replacementTxt = '<span class="highlighter">' + selection + '</span>';
            txt.html(txt.html().substring(0, start) + replacementTxt + txt.html().substring(end, len));
            $('ul.selection-toolbar').remove();
        }

        /* attempt to find a text selection */ 
        function getSelected() { 
            var selection = false;
            if (window.getSelection) { 
                selection = window.getSelection(); 
            } else if (document.getSelection) { 
                selection = document.getSelection(); 
            }else { 
                selection = document.selection && document.selection.createRange(); 
                if (selection.text) { 
                    selection = selection.text; 
                } 
            } 
            selection =  new String(selection).replace(/^\s+|\s+$/g,'');
            return selection; 
        }

        base.init();
    };

    $.osci.citation.defaultOptions = {
        citationPanelId : "osci_citation_panel_wrapper",
        panelPixelsClosed : 20
    };

})(jQuery);
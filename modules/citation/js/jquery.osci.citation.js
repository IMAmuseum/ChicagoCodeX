(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.citation = function(options)
    {
        var base = this.citation;
        var selection = '';

        base.init = function()
        {
            base.options = $.extend({}, $.osci.citation.defaultOptions, options);
            base.panel = $("#" + base.options.citationPanelId);

            $(document).bind("osci_layout_complete", function(e) {

                base.addCitations();

                /*************************************************
                 * Dialog interaction
                 */

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

                $('#osci_viewer p.osci_paragraph').mouseup(function() {
                    var selection = base.getSelected();
                    //TODO: rethink this part
                    var markup = '<ul class="selection-toolbar"><li><a class="use-ajax" href="' + Drupal.settings.basePath + 'ajax/citation/highlight">Highlight</a></li><li><a class="use-modal" href="' + Drupal.settings.basePath + 'ajax/citation/note">Note</a></li></ul>';
                    $('ul.selection-toolbar').remove();
            
                    $.osci.citation.selection = selection;
                    $(this).prepend(markup);

                    if (selection === '') { 
                        $('ul.selection-toolbar').remove();
                        return;
                    }

                });

                /*
                $('a[href=$"osci/citation/highlight"]').live('click', function(e) {
                    e.preventDefault();
                    base.highlightTxt($(this).parents('.osci_paragraph'));
                });
                
                $('a[href=$"osci/citation/note"]').live('click', function(e) {
                    e.preventDefault();
                    $('#edit-citation').html(base.getSelected());
                });
                */
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
        
        base.addCitations = function() {
            var citationLinkMarkup = '<div id="citation-${cid}" class="citationTitle">${body}</div>';
            $.template('citationLink', citationLinkMarkup);

            $.ajax({
                url: Drupal.settings.basePath + 'ajax/citation/user',
                dataType: 'json',
                success: function(data) {
                    $.tmpl('citationLink', data).appendTo(base.panel);
                }
            });

        }

        base.highlightTxt = function(obj) {
            var selection = base.getSelected(),
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
        base.getSelected = function() { 
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

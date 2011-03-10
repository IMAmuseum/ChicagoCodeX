(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.citation = function(options)
    {
        var base = this.citation;
        var selection = '';
        var activeParagraph = 0;
        var toolbar = {};

        base.init = function()
        {
            base.options = $.extend({}, $.osci.citation.defaultOptions, options);
            base.panel = $("#" + base.options.citationPanelId);

            $(document).bind("osci_layout_complete", function(e) {

                base.addCitations();

                /*************************************************
                 * Dialog interaction
                 */
                $.osci.citation.toolbar = $('ul.selection-toolbar').detach();
                //$.osci.citation.toolbar = $('ul.selection-toolbar').detach();

                $('a.citation-highlight').live('click', function(e) {
                    e.preventDefault();
                    var data = base.highlightTxt($(this).parents('.osci_paragraph'), $.osci.citation.selection);
                    var wordCount = $.osci.citation.activeParagraph.html().substring(0, data.start).split(' ').length;
                });

                $(document).bind('CToolsAttachBehaviors', function(e, modal) {
                    // TODO: update 
                    var data = base.highlightTxt($.osci.citation.activeParagraph, $.osci.citation.selection);
                    var wordCount = $.osci.citation.activeParagraph.html().substring(0, data.start).split(' ').length;

                    $("input[name='original_text']").val($.osci.citation.selection);
                    $("input[name='nid']").val(Drupal.settings.osci.nid);
                    $("input[name='word_count']").val(wordCount);
                    $("#edit-testing").val(wordCount);
                    $("input[name='letter_count']").val(data.start);
                    $("input[name='paragraph_count']").val($.osci.citation.activeParagraph.data('paragraph_id'));
                    $("#edit-paragraph-count").val($.osci.citation.activeParagraph.data('paragraph_id'));
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

                $('#osci_viewer .osci_paragraph').mouseup(function() {
                    $.osci.citation.selection = base.getSelected();
                    $.osci.citation.activeParagraph = $(this);
                    $.osci.citation.toolbar.detach();

                    if ($.osci.citation.selection === '') return; 

                    //var toolbar = $('ul.selection-toolbar').show();
                    $.osci.citation.toolbar.appendTo(this); 

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
        
        base.addCitations = function() {
            var citationLinkMarkup = '<div id="citation-${cid}" class="citationTitle">${body}</div>';
            $.template('citationLink', citationLinkMarkup);

            $.ajax({
                url: base.options.userCitationCallback + '/' + Drupal.settings.osci.nid,
                dataType: 'json',
                success: function(data) {
                    $.tmpl('citationLink', data).appendTo(base.panel);
                    //todo 
                    for (var i = 0; i < data.length; i++) {
                        var activeParagraph = $('p.osci_paragraph_' + data[i].paragraph_count);
                        base.highlightTxt(activeParagraph, data[i].original_text);
                    }
                }
            });

        }

        base.highlightTxt = function(txt, selection) {
            $.osci.citation.toolbar.detach();
            var data = {
                length: txt.html().length,
                start:  txt.html().indexOf(selection),
                end:    txt.html().indexOf(selection) + selection.length,
            }
            
            var replacementTxt = '<span class="highlighter">' + selection + '</span>';
            txt.html(txt.html().substring(0, data.start) + replacementTxt + txt.html().substring(data.end, data.len));

            return data;
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

        base.stripTags = function(txt) {
            return txt.replace(/<\/?[^>]+(>|$)/g, '');
        }

        base.init();
    };

    $.osci.citation.defaultOptions = {
        citationPanelId : "osci_citation_panel_wrapper",
        panelPixelsClosed : 20,
        citationCallback : '/ajax/citation/add',
        userCitationCallback : '/ajax/citation'
    };
})(jQuery);

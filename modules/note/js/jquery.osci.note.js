(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.note = function(options)
    {
        var base = this.note;
        var selection = '';
        var activeParagraph = 0;
        var toolbar = {};

        base.init = function()
        {
            base.options = $.extend({}, $.osci.note.defaultOptions, options);
            base.panel = $("#" + base.options.notePanelId);

            $(document).bind("osci_layout_complete", function(e) {

                base.addNotes();

                /*************************************************
                 * Dialog interaction
                 */
                $.osci.note.toolbar = $('ul.selection-toolbar').detach();

                $('a.note-highlight').live('click', function(e) {
                    e.preventDefault();
                    var data = base.highlightTxt($(this).parents('.osci_paragraph'), $.osci.note.selection);
                    var wordCount = $.osci.note.activeParagraph.html().substring(0, data.start).split(' ').length;
                });

                $(document).bind('CToolsAttachBehaviors', function(e, modal) {
                    // TODO: update 
                    var data = base.highlightTxt($.osci.note.activeParagraph, $.osci.note.selection);
                    var wordCount = $.osci.note.activeParagraph.html().substring(0, data.start).split(' ').length;

                    $("input[name='original_text']").val($.osci.note.selection);
                    $("input[name='nid']").val(Drupal.settings.osci.nid);
                    $("input[name='word_count']").val(wordCount);
                    $("input[name='letter_count']").val(data.start);
                    $("input[name='paragraph_count']").val($.osci.note.activeParagraph.data('paragraph_id'));
                    $("#edit-paragraph-count").val($.osci.note.activeParagraph.data('paragraph_id'));
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
                    $.osci.note.selection = base.getSelected();
                    $.osci.note.activeParagraph = $(this);
                    $.osci.note.toolbar.detach();

                    if ($.osci.note.selection === '') return; 

                    //var toolbar = $('ul.selection-toolbar').show();
                    $.osci.note.toolbar.appendTo(this); 

                });

            });
            
            base.panel.bind("osci_note_toggle", function(e) {
                var $this = $(this);

                if (($this.hasClass("open") && !e.osci_note_open) || e.osci_note_close) {
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
        
        base.addNotes = function() {
            var noteLinkMarkup = '<div id="note-${onid}" class="noteTitle">' +
                '<a class="use-ajax" href="' + Drupal.settings.basePath + 'ajax/note/load/${onid}">${body}</a></div>';

            $.template('noteLink', noteLinkMarkup);

            $('.noteTitle').remove();

            $.ajax({
                url: base.options.userNoteCallback + '/' + Drupal.settings.osci.nid,
                dataType: 'json',
                success: function(data) {
                    if (data == null) return;

                    $.tmpl('noteLink', data).appendTo(base.panel);

                    for (var i = 0; i < data.length; i++) {
                        var activeParagraph = $('p.osci_paragraph_' + data[i].paragraph_count);
                        base.highlightTxt(activeParagraph, data[i].original_text);
                    }

                    Drupal.detachBehaviors();
                    Drupal.attachBehaviors();
                }
            });

        }

        base.highlightTxt = function(txt, selection) {
            $.osci.note.toolbar.detach();
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

    $.osci.note.defaultOptions = {
        notePanelId : "osci_note_panel_wrapper",
        panelPixelsClosed : 20,
        noteCallback : '/ajax/note/add',
        userNoteCallback : '/ajax/note'
    };
})(jQuery);

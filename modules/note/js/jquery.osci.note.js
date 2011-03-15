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
            var noteLinkMarkup = '<div id="note-link-${onid}" class="noteTitle">' +
                '<a class="use-ajax" href="' + Drupal.settings.basePath + 'ajax/note/load/${onid}">${body}</a></div>';

            $.template('noteLink', noteLinkMarkup);

            $(document).bind("osci_layout_complete", function(e) {

                base.addNotes();

                /************************************************
                 * Highlight/Note hover handling
                 */

                $('p').delegate('span.highlight-note', 'hover', function(e) {
                    var onid = $(this).data('onid');
                    $('#note-link-' + onid).toggleClass('note-link-hover');
                    if (e.type == 'mouseenter') {
                        $('#note-link-' + onid + ' a').click();
                    }
                });

                $('p').delegate('span.highlight', 'hover', function() {
                    $(this).toggleClass('highlight-hover');
                });

                /*************************************************
                 * Dialog interaction
                 */

                $.osci.note.toolbar = $('ul.selection-toolbar').detach();

                /**
                 * Save a highlight
                 */
                $('a.note-highlight').live('click', function(e) {
                    e.preventDefault();

                    var data = base.getSelectionData($.osci.note.activeParagraph, $.osci.note.selection);
                    var data = {
                        original_text:      $.osci.note.selection,
                        nid:                Drupal.settings.osci.nid,
                        word_count:         $.osci.note.activeParagraph.html().substring(0, data.start).split(' ').length,
                        letter_count:       data.start,
                        paragraph_count:    $.osci.note.activeParagraph.data('paragraph_id'),
                    }

                    $.ajax({
                        type: 'post',
                        dataType: 'json',
                        url: base.options.noteSaveCallback,
                        data: data,
                        success: base.addNotes(),
                    });
                });

                /**
                 * Update form fields when submitting a note
                 */
                $(document).bind('CToolsAttachBehaviors', function(e, modal) {
                    var data = base.getSelectionData($.osci.note.activeParagraph, $.osci.note.selection);
                    var wordCount = $.osci.note.activeParagraph.html().substring(0, data.start).split(' ').length;

                    $("input[name='original_text']").val($.osci.note.selection);
                    $("input[name='nid']").val(Drupal.settings.osci.nid);
                    $("input[name='word_count']").val(wordCount);
                    $("input[name='letter_count']").val(data.start);
                    $("input[name='paragraph_count']").val($.osci.note.activeParagraph.data('paragraph_id'));
                });

                /**
                 * Paragraph hover styles
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

                /**
                 * Handle selection dialog
                 */
                $('#osci_viewer .osci_paragraph').mouseup(function() {
                    $.osci.note.selection = base.getSelected();
                    $.osci.note.activeParagraph = $(this);
                    $.osci.note.toolbar.detach();

                    if ($.osci.note.selection === '') return; 

                    //var toolbar = $('ul.selection-toolbar').show();
                    $.osci.note.toolbar.appendTo(this); 

                });

                /*************************************
                 * handle note dialog
                 */

                $('.note-close-link').live('click', function(e) {
                    e.preventDefault();
                    $(this).parents('.note').remove();
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

            $('.noteTitle').remove();

            $.ajax({
                url: base.options.userNoteCallback + '/' + Drupal.settings.osci.nid,
                dataType: 'json',
                success: function(data) {
                    if (data == null) return;

                    $.tmpl('noteLink', data).appendTo(base.panel);

                    for (var i = 0; i < data.length; i++) {
                        var activeParagraph = $('p.osci_paragraph_' + data[i].paragraph_count);
                        base.highlightTxt(activeParagraph, data[i]);
                    }

                    Drupal.detachBehaviors();
                    Drupal.attachBehaviors();
                }
            });

        }

        base.highlightTxt = function(txt, note) {
            $.osci.note.toolbar.detach();
    
            //TODO work in note data settings
            var data = base.getSelectionData(txt, note.original_text);
            var class = (note.body !== null) ? 'highlight-note' : 'highlight';
            var replacementTxt = '<span data-onid="' + note.onid + '" class="' + class + '">' + note.original_text + '</span>';
            txt.html(txt.html().substring(0, data.start) + replacementTxt + txt.html().substring(data.end, data.len));

            return data;
        }

        base.getSelectionData = function(txt, selection) {
            var data = {
                length: txt.html().length,
                start:  txt.html().indexOf(selection),
                end:    txt.html().indexOf(selection) + selection.length,
            }

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
        userNoteCallback : '/ajax/note',
        noteSaveCallback : '/ajax/note/save'
    };
})(jQuery);

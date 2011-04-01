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
            var noteLinkMarkup = '{{if body}}<div id="note-link-${onid}" data-onid=${onid} class="noteTitle">' +
                '<a class="use-ajax" href="' + Drupal.settings.basePath + 'ajax/note/load/${onid}">${body}</a>' +
                '</div>{{/if}}';

            $.template('noteLink', noteLinkMarkup);

            $(document).bind("osci_layout_complete", function(e) {

                base.addNotes();

                /************************************************
                 * Highlight/Note hover handling
                 */

                //$('.osci_paragraph').delegate('span.highlight', 'hover', function(e) {
                $('span.highlight').live('hover', function(e) {
                    var onid = $(this).data('onid');
                    if (e.type == 'mouseenter') {
                        $('.note-close-link').click();
                        $('#note-link-' + onid + ' a').css({ opacity: 1 });
                        $(this).addClass('highlight-note');
                    } else {
                        $('#note-link-' + onid + ' a').css({ opacity: 0.5 });
                        $(this).removeClass('highlight-note');
                    }
                });

                $('.noteTitle').live('hover', function(e) {
                    var onid = $(this).data('onid');
                    if (e.type == 'mouseenter') {
                        $('span#span-note-' + onid).addClass('highlight-note');

                    } else {

                        $('span#span-note-' + onid).removeClass('highlight-note');
                    }
                });

                $('p').delegate('span.highlight-note', 'click', function() {
                    var onid = $(this).data('onid');
                    $('#note-link-' + onid + ' a').click();
                });

                $('p').delegate('span.highlight', 'click', function(e) {
                    /*
                    $(this).toggleClass('highlight-note');
                    var onid = $(this).data('onid');
                    var link = '<a href="' + Drupal.settings.basePath + 'ajax/note/delete/' + onid +'" class="note-delete-link use-ajax">Delete</a>';
                    $(this).prepend(link);
                    Drupal.detachBehaviors();
                    Drupal.attachBehaviors();
                    */
                });

                /*************************************************
                 * Dialog interaction
                 */

                $.osci.note.toolbar = $('ul.selection-toolbar').detach();

                /**
                 * Save a highlight
                 */
                $('a.note-highlight').live('click', function(e) {
                    //TODO this section should happen in the success callback of the highlight
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
                        success: function(data) {
                            base.processNotes(data);
                        } 
                    });
                });

                /**
                 * Update form fields when submitting a note
                 */
                $(document).bind('CToolsAttachBehaviors', function(e, modal) {
                    var id = $(modal).find('form').attr('id');
                    switch(id) {
                        case 'note-form':
                            var data = base.getSelectionData($.osci.note.activeParagraph, $.osci.note.selection);
                            var wordCount = $.osci.note.activeParagraph.html().substring(0, data.start).split(' ').length;

                            $("input[name='original_text']").val($.osci.note.selection);
                            $("input[name='nid']").val(Drupal.settings.osci.nid);
                            $("input[name='word_count']").val(wordCount);
                            $("input[name='letter_count']").val(data.start);
                            $("input[name='paragraph_count']").val($.osci.note.activeParagraph.data('paragraph_id'));
                            break;
                        case 'citation-form':
                            //$('#edit-citation-text').html($.osci.note.selection);
                            //$('#edit-citation-url').val(window.location);
                            $('#edit-citation-text, #edit-citation-url').click(function(e) {
                                e.preventDefault();
                                $(this).select();
                            });

                            break;
                    }
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
/*
                $('#osci_viewer .osci_paragraph').highlight({
                    success: function(obj) {
                        $.osci.note.toolbar.appendTo(obj);
                    }
                });
*/
                $('#osci_viewer .osci_paragraph').mouseup(function() {
                    $.osci.note.selection = base.getSelected();
                    $.osci.note.activeParagraph = $(this);
                    $.osci.note.toolbar.detach();

                    if ($.osci.note.selection === '') return; 

                    $.osci.note.toolbar.appendTo(this);

                });

                /*************************************
                 * handle note dialog
                 */

                $('.note-close-link').live('click', function(e) {
                    e.preventDefault();
                    $(this).parents('.note').remove();
                });

                $('.highlight .note-delete-link').live('click', function(e) {
                    e.preventDefault();
                    $(this).remove();
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
            $.ajax({
                url: base.options.userNoteCallback + '/' + Drupal.settings.osci.nid,
                dataType: 'json',
                success: function(data) {
                    base.processNotes(data);
                } 
            });
        }

        base.processNotes = function(data) {
            if (data == null) return;

            $('.noteTitle').remove();
            $.tmpl('noteLink', data).appendTo(base.panel);

            for (var i = 0; i < data.length; i++) {
                var activeParagraph = $('p.osci_paragraph_' + data[i].paragraph_count);
                base.highlightTxt(activeParagraph, data[i]);
            }

            Drupal.detachBehaviors();
            Drupal.attachBehaviors();

        }

        base.highlightTxt = function(txt, note) {
            $.osci.note.toolbar.detach();
    
            //TODO work in note data settings
            if (!$('span#span-note-' + note.onid).length) {
                var data = base.getSelectionData(txt, note.original_text);
                var replacementTxt = '<span id="span-note-' + note.onid + '" data-onid="' + note.onid + '" class="highlight">' + note.original_text + '</span>';
                txt.html(txt.html().substring(0, data.start) + replacementTxt + txt.html().substring(data.end, data.len));
            }

            return data;
        }

        base.getSelectionData = function(txt, selection) {
            if (txt.html() == '') return;

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
            } else { 
                selection = document.selection && document.selection.createRange(); 
                if (selection.text) { 
                    selection = selection.text; 
                } 
            } 
            selection = base.getSelectionHTML(selection); 

            return selection; 
        }

        base.getSelectionHTML = function(selection) {
            var range = (document.all ? selection.createRange() : selection.getRangeAt(selection.rangeCount - 1).cloneRange());

            if (document.all) {
                return range.htmlText;
            } else {
                var clonedSelection = range.cloneContents();
                var div = document.createElement('div');
                div.appendChild(clonedSelection);
                return div.innerHTML;
            }
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

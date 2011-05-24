(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.note = function(options)
    {
        var base = this.note;
        var activeParagraph = 0;
        var toolbar = {};
        var selection = '';
        
        base.init = function()
        {
            base.options = $.extend({}, $.osci.note.defaultOptions, options);
            base.panel = $("#" + base.options.notePanelId);
            var noteLinkMarkup = '{{if body}}<div id="note-link-${onid}" data-onid=${onid} class="noteTitle">' +
                '<a class="use-ajax" href="' + Drupal.settings.basePath + 'ajax/note/load/${onid}">${body}</a>' +
                '</div>{{/if}}';

            $.template('noteLink', noteLinkMarkup);

            amplify.subscribe("osci_navigation_complete", function(data) {
                $('.noteTitle').hide();
                $('.osci_page_' + data.page).find('.highlight').each(function() {
                    var pageHeight = $(this).parents('.osci_page').height();
                    if ($(this).position().top > 0 && $(this).position().top < pageHeight) {
                        var onid = $(this).data('onid');
                        $('#note-link-' + onid).show();
                    }
                });
            });

            amplify.subscribe("osci_layout_complete", function() {

                /**
                * Handle text highlighting
                */
                $('#osci_viewer .osci_paragraph').highlight({
                    onSelection: function(obj, e, properties) {
                        $.osci.note.toolbar.appendTo($('body'));
                        $.osci.note.selection = properties;

                        var left    = e.clientX - ($.osci.note.toolbar.outerWidth() / 2);
                        var top     = e.clientY - $.osci.note.toolbar.outerHeight() - parseInt($('.osci_paragraph').css('lineHeight'));
                        $.osci.note.toolbar.css('left', left);
                        $.osci.note.toolbar.css('top', top); 

                        $('a.note-highlight').unbind('click');
                        $('a.note-highlight').click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();

                            properties.nid = $.osci.navigation.data.nid;

                            $.ajax({
                                type: 'post',
                                dataType: 'json',
                                url: base.options.noteSaveCallback,
                                data: properties,
                                success: function() {
                                    base.addNotes();
                                }
                            });
                        });

                        // Cleanup Toolbar
                        $('ul.selection-toolbar a').click(function() {
                            $.osci.note.toolbar.detach();
                        });

                    },
                    onEmptySelection: function() {
                        $.osci.note.toolbar.detach();
                    }
                });


                base.addNotes();

                /************************************************
                 * Highlight/Note hover handling
                 */

                $('span.highlight').live('hover', function(e) {
                    var onid = $(this).data('onid');
                    if (e.type == 'mouseenter') {
                        $('.note-close-link').click();
                        $('#note-link-' + onid + ' a').css({ opacity: 1 });
                        $('span.note-' + onid).addClass('highlight-note');
                    } else {
                        $('#note-link-' + onid + ' a').css({ opacity: 0.5 });
                        $('span.note-' + onid).removeClass('highlight-note');
                    }
                });

                $('.noteTitle').live('hover', function(e) {
                    var onid = $(this).data('onid');
                    if (e.type == 'mouseenter') {
                        $('span.note-' + onid).addClass('highlight-note');
                    } else {
                        $('span.note-' + onid).removeClass('highlight-note');
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

                // Hide toolbar on load
                if (!$.osci.note.toolbar) {
                    $.osci.note.toolbar = $('ul.selection-toolbar').detach();
                }

                /**
                 * Update form fields when submitting a note
                 */
                $(document).bind('CToolsAttachBehaviors', function(e, modal) {
                    var id = $(modal).find('form').attr('id');
                    switch(id) {
                        case 'note-form':
                            $("input[name='nid']").val(Drupal.settings.osci.nid);
                            $("input[name='selection']").val($.osci.note.selection.selection);
                            $("input[name='end_node']").val($.osci.note.selection.end_node);
                            $("input[name='end_offset']").val($.osci.note.selection.end_offset);
                            $("input[name='paragraph_id']").val($.osci.note.selection.paragraph_id);
                            $("input[name='parent_offset']").val($.osci.note.selection.parent_offset);
                            $("input[name='start_node']").val($.osci.note.selection.start_node);
                            $("input[name='start_offset']").val($.osci.note.selection.start_offset);
                            break;
                        case 'citation-form':
                            $('#edit-citation-text').html($.osci.note.selection.selection);
                            $('#edit-citation-url').val($('a.osci_paragraph_' + $.osci.note.selection.paragraph_id).attr('href'));
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
            
            amplify.subscribe("osci_note_toggle", function(data) {
                if (!data) {
                    data = {};
                }
                
                if ((base.panel.hasClass("open") && !data.osci_note_open) || data.osci_note_close) {
                    base.panel.css({
                        "-webkit-transform" : "translate(" + (base.panel.outerWidth() - base.options.panelPixelsClosed) + "px, 0)",
                        "-moz-transform" : "translate(" + (base.panel.outerWidth() - base.options.panelPixelsClosed) + "px, 0)",
                        "transform" : "translate(" + (base.panel.outerWidth() - base.options.panelPixelsClosed) + "px, 0)"
                    });
                    
                    base.panel.removeClass("open");
                } else {
                    base.panel.css({
                        "-webkit-transform" : "translate(0px, 0)",
                        "-moz-transform" : "translate(0px, 0)",
                        "transform" : "translate(0px, 0)"
                    });

                    base.panel.addClass("open");
                }
            });
            base.panel.addClass("open");
//            base.panel.bind("osci_note_toggle", function(e) {
//                var $this = $(this);
//
//                if (($this.hasClass("open") && !e.osci_note_open) || e.osci_note_close) {
//                    $this.css({
//                        "-webkit-transform" : "translate(" + ($this.outerWidth() - base.options.panelPixelsClosed) + "px, 0)",
//                        "-moz-transform" : "translate(" + ($this.outerWidth() - base.options.panelPixelsClosed) + "px, 0)",
//                        "transform" : "translate(" + ($this.outerWidth() - base.options.panelPixelsClosed) + "px, 0)"
//                    });
//                    
//                    $this.removeClass("open");
//                } else {
//                    $this.css({
//                        "-webkit-transform" : "translate(0px, 0)",
//                        "-moz-transform" : "translate(0px, 0)",
//                        "transform" : "translate(0px, 0)"
//                    });
//
//                    $this.addClass("open");
//                }
//            }).addClass("open");
        };
        
        base.addNotes = function() {
            $.ajax({
                url: base.options.userNoteCallback + '/' + Drupal.settings.osci.nid,
                dataType: 'json',
                success: function(data) {
                    base.processNotes(data);

                    if (data == null) return;
                
                    $('.highlight').each(function() {
                        $(this).replaceWith($(this).text());
                    });

                    for (var i = 0; i < data.length; i++) {
                        var activeParagraph = $('p.osci_paragraph_' + data[i].paragraph_id);
                        $.highlighter.highlight(activeParagraph, data[i]);
                    }

                    $('.highlight-temp').addClass('highlight');
                    $('.highlight-temp').removeClass('highlight-temp');

                } 
            });
        }

        base.processNotes = function(data) {
            $('.noteTitle').remove();

            if (data == null) return;

            $.tmpl('noteLink', data).appendTo(base.panel);

            Drupal.detachBehaviors();
            Drupal.attachBehaviors();


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

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

            // APA Style
            var citationAPA = '1. ${author}. (${pubDate}). ${articleTitle} In ${bookTitle} (${publisher}) para: ${paragraph}';
            $.template('citationAPA', citationAPA);

            // MLA Style
            var citationMLA = '${author}. "${articleTitle}" ${bookTitle}. para ${paragraph}. ${publisher}, ${pubDate}';
            $.template('citationMLA', citationMLA);

            // Chicago style
            var citationChicago = '${author}. ${pubDate} ${articleTitle}. In ${bookTitle}, ${paragraph}. ${publisher}';
            $.template('citationChicago', citationChicago);

            amplify.subscribe("osci_navigation_complete", function(data) {
                base.updatePageNotes(data.page);
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
                    $.osci.note.toolbar.css('display', 'inline');
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
                            var data = {
                                author: 'Jane Doe',
                                pubDate: '2011, May 21',
                                bookTitle: $('.osci_book_title').text(),
                                publisher: 'University of Chicago Press',
                                articleTitle: $('.osci_book_section_title').text(),
                                paragraph: $.osci.note.selection.paragraph_id
                            };

                            $('a[href$="#citation-format-apa"]').click(function(e) {
                                e.preventDefault();
                                $('#edit-citation-text').html($.tmpl('citationAPA', data));
                                $('#edit-citation-options ul li').removeClass('active');
                                $(this).parent().addClass('active');
                            });

                            $('a[href$="#citation-format-apa"]').click(); //default

                            $('a[href$="#citation-format-mla"]').click(function(e) {
                                e.preventDefault();
                                $('#edit-citation-text').html($.tmpl('citationMLA', data));
                                $('#edit-citation-options ul li').removeClass('active');
                                $(this).parent().addClass('active');
                            });

                            $('a[href$="#citation-format-chicago"]').click(function(e) {
                                e.preventDefault();
                                $('#edit-citation-text').html($.tmpl('citationChicago', data));
                                $('#edit-citation-options ul li').removeClass('active');
                                $(this).parent().addClass('active');
                            });

                            $('#edit-citation-selection').html($.osci.note.selection.selection);
                            $('#edit-citation-url').val($('a.osci_paragraph_' + $.osci.note.selection.paragraph_id).attr('href'));
                            $('#edit-citation-text, #edit-citation-url, #edit-citation-selection').click(function(e) {
                                e.preventDefault();
                                $(this).select();
                            });

                            break;
                    }

                    /**
                     * Prevent pagination when modal is open
                     */
                    $('#modalContent').keydown(function(e) {
                        e.stopPropagation();
                    });
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
                
                    $('.highlight, .highlight-temp').each(function() {
                        $(this).replaceWith($(this).text());
                    });

                    for (var i = 0; i < data.length; i++) {
                        var activeParagraph = $('p.osci_paragraph_' + data[i].paragraph_id);
                        $.highlighter.highlight(activeParagraph, data[i]);
                    }

                    $('.highlight-temp').addClass('highlight');
                    $('.highlight-temp').removeClass('highlight-temp');

                    base.updatePageNotes($.osci.navigation.data.currentPage);

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

        base.updatePageNotes = function(page) {
            $('.noteTitle').hide();
            $('.osci_page_' + page).find('.highlight').each(function() {
                var pageHeight = $(this).parents('.osci_page').height();
                // The highlight needs to be in the viewable plain, and the parent should be a paragraph
                if ($(this).position().top >= 0 && $(this).position().top < pageHeight && $(this).parent().hasClass('osci_paragraph')) {
                    var onid = $(this).data('onid');
                    $('#note-link-' + onid).show();
                }
            });
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

(function($) {
    $(document).ready(function() {

        $('#osci-citation-dialog').dialog({ 
            title:      'Add a citation', 
            autoOpen:   false,
            modal:      true,
            draggable:  false
        });

        $('p').mouseup(function() {
            var selection = getSelected();
            if (selection == '') return;

            // alter the body text
            var txt = $(this);
            var len = txt.html().length;
            var start = txt.html().indexOf(selection);
            var end = start + selection.length;
            var replacementTxt = '<span class="highlighter">' + selection + '</span>';
            txt.html(txt.html().substring(0, start) + replacementTxt + txt.html().substring(end, len));

            // build dialog and open
            $('#edit-citation').html(selection);
            $('#edit-citation').appendTo('<textarea id="copyTxt">' + selection + '</textarea>';
            $('#copyTxt').select();
            var CopiedTxt = document.selection.createRange();
            CopiedTxt.execCommand("Copy");

            //selection = '';
            $('#osci-citation-dialog').dialog('open');
            
            // reset variable
        });



        $('#content').bind('copy', function(e) {
            console.log(e);
        });


    });

})(jQuery);

/* attempt to find a text selection */ 
function getSelected() { 
    var selection = false;
    if(window.getSelection) { selection = window.getSelection(); } 
    else if(document.getSelection) { selection = document.getSelection(); } 
    else { 
        var selection = document.selection && document.selection.createRange(); 
        if(selection.text) { selection = selection.text; } 
    } 
    selection =  new String(selection).replace(/^\s+|\s+$/g,'');
    return selection; 
} 

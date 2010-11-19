(function ($) {
    $(document).ready(function() {
        

        $("<a />", {
            "class" : "footnote-remove",
            text : "remove",
            "src" : "#",
            "click" : function(e){
                e.preventDefault();
                $(this).parent().parent().remove();
            }
        }).appendTo($("label",".footnotes-wrapper"));

        $("a.footnote-add-another").click(function(e){
            e.preventDefault();
            var container = $(this).parents("div.fieldset-wrapper:first");
            var hiddenCountElem = $('[type="hidden"]', container);
            var count = parseFloat(hiddenCountElem.val()) + 1;
            var newElement = $('.form-item:first', container).clone();
            var replaceText = $("label", newElement).html().trim(); 
            var newText = replaceText.substr(0, replaceText.lastIndexOf("-") + 1) + count;
console.log(newElement);
console.log(replaceText);
console.log(newText);

            var newHtml = newElement.wrap("<span>").parent().html();
            newHtml = newHtml.replace(new RegExp(replaceText, "gi"), newText);

            replaceText = replaceText.replace("_", "-");
            newText = newText.replace("_", "-");
            newHtml = newHtml.replace(new RegExp(replaceText, "gi"), newText);

            $(this).parent().before(newHtml);
            hiddenCountElem.val(count);
        });
    });
})(jQuery);

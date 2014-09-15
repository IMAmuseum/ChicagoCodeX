<html>
    <head>
        <link rel="stylesheet" href="<?php echo $path;?>js/external/jquery-ui/jquery-ui.min.css">
        <link rel="stylesheet" href="/sites/all/ChicagoCodeX/frontend/css/common.css">
        <link rel="stylesheet" href="<?php echo $path;?>css/layered_image.css">
        <link rel="stylesheet" href="/sites/all/ChicagoCodeX/frontend/css/layered_image.css">
        <script type="text/javascript" src="<?php echo $path; ?>js/external/json2.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/jquery.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/jquery-ui/jquery-ui.min.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/polymaps.min.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/oscitk/osci_tk_layered_image.js"></script>
        <script type="text/javascript" src="<?php echo $path;?>js/external/jquery.qtip.js" type="text/javascript"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
            }
        </style>
    </head>
    <body>
        <div style="width:100%;height:100%;">
            <?php echo $content; ?>
        </div>
        <script type="text/javascript">
            $(document).ready(function() {
                var type = '<?php echo $type;?>';
                var figure = $('figure');
 				//temporary fix for image_asset not showing up - 9/5/2014
               /* if (type === 'image_asset') {
                    // remove floating image path text
                    figure.html(figure.children());
                    figure.css('text-align', 'center');
                    var img = figure.find('img');
					console.log(img, 'img');
                    var imgTimer = setInterval(function() {
                        if (img.height() > 0) {
                            figure.find('figcaption').css({
                                'text-align': 'left',
                                'max-width': '100%',
                                'padding': '2px 15px',
                                'color': '#ccc',
                                'background': '#000'
                            });
                            // resize image to fit in window
                            img.css({
                                'max-height': (window.innerHeight - figure.find('figcaption').outerHeight()) + "px",
                                'max-width': window.innerWidth + "px"
                            });
                            clearInterval(imgTimer);
                        }
                    }, 100);
                }*/
                if (type === 'iip_asset' || type === 'layered_image' || type === 'image_asset') {
                    // append the caption if present
                    var caption = '<?php echo $caption; ?>';
                    if (caption) {
                        var figCaption = $('<figcaption></figcaption>')
                            .html(caption)
                            .css({
                                'text-align': 'left',
                                'max-width': '100%',
                                'padding': '2px 15px',
                                'color': '#ccc',
                                'background': '#000'
                            })
                            .insertAfter(figure.parent());
                        // reduce size of figure container to make room for caption
                        figure.parent().css({
                            'height': (window.innerHeight - figCaption.outerHeight()) + 'px' 
                        });
                    }
                    // initialize any layered_image
                    var li = $(".layered_image-asset").first(); 
                    if (li.length > 0) {
                        new LayeredImage(li);
                    }
                }
                
            });
        </script>
    </body>
</html>
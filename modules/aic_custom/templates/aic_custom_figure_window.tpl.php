<html>
    <head>
        <link rel="stylesheet" src="/sites/default/ChicagoCodeX/frontend/css/common.css">
        <link rel="stylesheet" src="/sites/default/ChicagoCodeX/frontend/css/layered_image.css">
        <link rel="stylesheet" src="'.$path.'js/external/jquery-ui.custom.css">
        <script type="text/javascript" src="<?php echo $path; ?>js/external/json2.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/jquery.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/jquery-ui-1.8.23.custom.min.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/polymaps.min.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/oscitk/osci_tk_layered_image.js"></script>
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
            <script type="text/javascript">var li=$(".layered_image-asset").first(); new LayeredImage(li);</script>
        </div>
    </body>
</html>
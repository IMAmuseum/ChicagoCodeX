<html>
    <head>
    	<link rel="shortcut icon" href="/sites/default/files/favicon.ico" type="image/vnd.microsoft.icon">
        <link rel="stylesheet" href="<?php echo $path;?>js/external/jquery-ui/jquery-ui.min.css">
        <link rel="stylesheet" href="/sites/all/ChicagoCodeX/frontend/css/common.css">
        <link rel="stylesheet" href="<?php echo $path;?>css/layered_image.css">
        <link rel="stylesheet" href="/sites/all/ChicagoCodeX/frontend/css/layered_image.css">
        <link rel="stylesheet" href="<?php echo $path;?>js/external/jquery.qtip.css">
        <link rel="stylesheet" href="/sites/all/ChicagoCodeX/frontend/css/figures.css">
        <link rel="stylesheet" href="/sites/all/modules/aic_360/css/threesixty.css">   
        <script type="text/javascript" src="<?php echo $path; ?>js/external/json2.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/jquery.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/jquery-ui/jquery-ui.min.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/external/polymaps.min.js"></script>
        <script type="text/javascript" src="<?php echo $path; ?>js/oscitk/osci_tk_layered_image.js"></script>
        <script type="text/javascript" src="<?php echo $path;?>js/external/jquery.qtip.js" type="text/javascript"></script>
        <script type="text/javascript" src="/sites/all/ChicagoCodeX/frontend/js/d3.min.js" type="text/javascript"></script>
        <script type="text/javascript" src="/sites/all/modules/aic_360/js/threesixty.js" type="text/javascript"></script>
		<script type="text/javascript" src="/sites/all/modules/aic_360/js/360render.js" type="text/javascript"></script>
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
				// initialize any layered_image
				if (type === 'iip_asset' || type === 'layered_image' || type === 'image_asset') {
					var li = $(".layered_image-asset").first(); 
					if (li.length > 0) {
						new LayeredImage(li);
					}
                } 
				if (type == '360_slider') {
					var figureTop = ($(window).height() - $('.threesixty').height())/2;
					figure.css({top: figureTop, position: 'relative'});	
					}
            });
        </script>
    </body>
</html>
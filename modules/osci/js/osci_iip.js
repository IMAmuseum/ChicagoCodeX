var tile_size = 256; // tile size
var iip_ep = 'http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi?fif=/opt/iip/images/test.ptif&jtl=';

// These are retrieved later
var image_w; // image width
var image_h; // image height
var zoom_max; // zoom layers max
var ptiff; // path to ptiff, aka FIF in iip parlance
var iipsrv; // url to the iip server

var po = org.polymaps;

(function($) {
	
	
	$(document).ready(function()
	{
		
		var mapdiv = $('#map');
		console.log(mapdiv);
		console.log("test");
		ptiff = mapdiv.attr('data-ptiff');
		image_w = mapdiv.attr('data-iw');
		image_h = mapdiv.attr('data-ih');
		zoom_max = mapdiv.attr('data-zl') - 1;
		iipsrv = mapdiv.attr('data-iipsrv');
		
		var map = po.map()
				.container($('#map')[0].appendChild(po.svg('svg')))
			    .zoomRange([1, zoom_max])
				.zoom(1);
				
		var image = po.image();
		image.url(tile_loader);
		map.add(image);
		map.add(po.interact());
		map.add(po.hash());
		map.add(po.compass().pan("none"));
	});	
}) (jQuery);

/**
 * Load an IIP image tile into polymaps
 */
function tile_loader(c) {
	// Determine the scale factor of this zoom
	var scale = Math.pow(2, zoom_max - c.zoom);
	
	// Figure out the w/h of the image at this zoom
	var mw = Math.round(image_w / scale);
	var mh = Math.round(image_h / scale);
	
	// Figure out how many tiles are at this zoom
	var tw = Math.ceil(mw / tile_size);
	var th = Math.ceil(mh / tile_size);
	
	// Everything above this point should be cached per zoom level
	
	// Bail out if this tile if out of range
	// console.log("z:"+c.zoom+" c:"+c.column+" r:"+c.row);
	if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return;
	
	// If this is an edge case, we need to adjust the size
	if (c.row == (th - 1)) {
		c.element.setAttribute('height', mh % tile_size);		
	}
	if (c.column == (tw - 1)) {
		c.element.setAttribute('width', mw % tile_size);
	}
	
	return iip_ep + c.zoom + ',' + ((c.row * tw) + c.column);
}
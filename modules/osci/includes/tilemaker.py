#!/usr/bin/env python
import sys
import os
import Image
import math
import time

if __name__ == '__main__':
    if len(sys.argv[1:]) < 2:
        print "usage: tilething.py <image_file> <output_path>"
        print
        sys.exit(-1)
    
    TILE_SIZE = 256
    image_file = sys.argv[1]
    output_path = os.path.abspath(sys.argv[2])
    
    try:
        image = Image.open(image_file)
    except:
        print "Sorry, couldn't understand that file"
        print
        sys.exit(-1)
    try:
        os.chdir(output_path)
    except:
        print "Had trouble with the output path"
        print
        sys.exit(-1)
    # find or create the output directory    
    try:
        output_path = os.path.join(output_path,  (os.path.basename(image_file) + '_tiles'))
        os.stat(output_path)
    except:
        # directory not found, create
        try:
            print "Creating output directory %s" % output_path
            os.mkdir(output_path)
        except:
            print "Sorry, couldn't create output directory"
            print
            sys.exit(-1)
    print "Found %s image, %dx%d..." % (image.format, image.size[0], image.size[1])
    
    #start at zoom 0
    zoom_levels = 0
    num_tiles = 0
    time_start = time.time()
    width = image.size[0]
    height = image.size[1]
    
    # bring the image down to the right size for this zoom level
    while (width > TILE_SIZE) or (height > TILE_SIZE):
        # print "w: %d, h: %d, z: %d" % (width, height, zoom_levels)
        zoom_levels += 1
        width = width / 2
        height = height / 2
    # print "w: %d, h: %d, z: %d" % (width, height, zoom_levels)
    print "%d total zoom levels" % (zoom_levels + 1)
    for zoom in range(zoom_levels, -1, -1):
        scale = zoom_levels - zoom + 1
        width = image.size[0]
        height = image.size[1]
        print "generating zoom layer %d at scale %d" % (zoom, scale)
        for i in range(scale - 1):
            width = width / 2
            height = height / 2
        # don't eat up ram duplicating the whole image for the first pass
        if scale == 1:
            scaled_image = image
        else:
            print "scaling image..."
            scaled_image = image.resize((width , height), Image.ANTIALIAS)
        # now start tiling
        tiles_wide = int(math.ceil(scaled_image.size[0] / float(TILE_SIZE)))
        tiles_high = int(math.ceil(scaled_image.size[1] / float(TILE_SIZE)))
        print "%dx%d - %d tiles wide, %d tiles high" % (scaled_image.size[0], 
                                                        scaled_image.size[1], 
                                                        tiles_wide, 
                                                        tiles_high)
        for row in range(tiles_high):
            for column in range(tiles_wide):
                box = (
                       column * TILE_SIZE,
                       row * TILE_SIZE,
                       column * TILE_SIZE + TILE_SIZE,
                       row * TILE_SIZE + TILE_SIZE,
                )
                tile = scaled_image.crop(box)
                # save the tile
                # format should be output_path/{zoom}/{row}/{column}
                # first check that the directories are there
                output_dir = os.path.join(output_path, "zoom"+str(zoom), "row"+str(row))
                if not os.path.exists(output_dir):
                    # create the dir
                    try:
                        os.makedirs(output_dir)
                    except:
                        print "Couldn't make the tile directories, sorry"
                        sys.exit(-1)
                final_path = output_dir + "/col" + str(column) + ".jpg"
                tile.save(final_path)
                num_tiles += 1
                sys.stdout.write('.')
                sys.stdout.flush() 
            print
    # save manifest.json
    
    time_stop = time.time()
    print "finished - generated %d tiles in %.2f seconds" % (num_tiles, time_stop - time_start)
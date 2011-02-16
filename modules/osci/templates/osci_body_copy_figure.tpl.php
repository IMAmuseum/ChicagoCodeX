<figure id="<?php print $figure['id']; ?>" <?php print $data; ?> class="<?php print $type; ?>">
    <a name="<?php print $figure['id']; ?>"></a>
    <div class="figureContent">
        <?php print $content; ?>
    </div>
    <?php if (isset($thumbnail)) { ?>
    <div class="figureThumbnail">
        <?php print $thumbnail; ?>
        <span class="figure_number">Fig. <?php print isset($figure['figCount']) ? $figure['figCount'] : $figure['id']; ?></span>
    </div>
    <?php } ?>
    <figcaption>
        <span class="figure_number">Fig. <?php print isset($figure['figCount']) ? $figure['figCount'] : $figure['id']; ?></span>
        <?php print $caption; ?>
    </figcaption>
</figure>

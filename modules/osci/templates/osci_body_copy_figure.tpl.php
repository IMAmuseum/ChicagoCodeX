<a name="<?php print $figure['id']; ?>"></a>
<figure id="<?php print $figure['id']; ?>" <?php print $data; ?> class="<?php print $type; ?>">
    <div class="figureContent">
        <?php print $content; ?>
    </div>
    <figcaption>
        <span class="figure_number">Fig <?php print isset($figure['figCount']) ? $figure['figCount'] : $figure['id']; ?></span>
        <?php print $caption; ?>
    </figcaption>
</figure>

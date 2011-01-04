<?php 
$data = '';
foreach($figData as $k => $v) {
    $data .= 'data-' . $k . '="' . $v . '" ';
}
?>
<a name="<?php print $figId; ?>"></a>
<figure id="<?php print $figId; ?>" <?php print $data; ?> class="<?php print $figType; ?>">
    <div class="figureContent">
        <?php print $figContent; ?>
    </div>
    <figcaption><?php print $figCaption; ?></figcaption>
</figure>

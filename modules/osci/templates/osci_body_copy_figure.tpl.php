<?php 
$data = '';
foreach($figure['data'] as $k => $v) {
    $data .= 'data-' . $k . '="' . $v . '" ';
}
?>
<a name="<?php print $figure['id']; ?>"></a>
<figure id="<?php print $figure['id']; ?>" <?php print $data; ?> class="<?php print $figType; ?>">
    <div class="figureContent">
        <?php print $figContent; ?>
    </div>
    <figcaption><?php print $figCaption; ?></figcaption>
</figure>

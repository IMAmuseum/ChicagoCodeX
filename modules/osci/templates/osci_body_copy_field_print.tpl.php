<?php
$classes = '';
if (isset($element['#attributes']['class'])) {
    $classes = ' class="' . implode(' ', $element['#attributes']['class']) . '"';
}
?>
<div <?php print $classes; ?>>
    <div class="content">
        <?php print $element[0]['#markup']; ?>
    </div>
</div>

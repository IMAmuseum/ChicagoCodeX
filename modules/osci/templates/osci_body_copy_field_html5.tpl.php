<?php 
$classes = '';
if (isset($element['#attributes']['class'])) {
    $classes = ' class="' . implode(' ', $element['#attributes']['class']) . '"';
}
?>
<section id="<?php print $element['#field_name']; ?>"<?php print $classes; ?>>
    <header>
        <h2><?php print $element['#title']; ?></h2>
    </header>
    <section class="content">
        <?php print $element[0]['#markup']; ?>
    </section>
</section>

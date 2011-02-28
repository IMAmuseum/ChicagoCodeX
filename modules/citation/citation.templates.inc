<?php

function theme_citation(&$vars) {
    $citation   = $vars['citation'];
    $children   = element_children($citation->content);
    $output     = check_plain($citation->body);

    foreach($children as $theme) {
        $output .= drupal_render($citation->content[$theme]);
    }

    return $output;
}

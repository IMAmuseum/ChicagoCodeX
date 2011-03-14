<?php

function theme_note(&$vars) {
    $note   = $vars['note'];
    $children   = element_children($note->content);
    $output     = check_plain($note->body);

    foreach($children as $theme) {
        $output .= drupal_render($note->content[$theme]);
    }
    
    $output = '<div class="note">' . $output . '</div>';
    return $output;
}

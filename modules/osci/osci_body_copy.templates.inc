<?php

function osci_body_copy_preprocess_body_copy_figure(&$vars) {
dpm($vars);
    $figure = $vars['figure'];
    $node = node_load($figure['figure_reference']);
    node_build_content($node);
dpm($node);

    $vars['figure']['caption'] = (empty($figure['caption'])) ? $node->title : check_markup($figure['caption'], $vars['body_copy_format']);
    $vars['content'] = drupal_render($node->content['field_image']);
}

<?php

function osci_body_copy_preprocess_body_copy_figure(&$vars) {
    $figure = $vars['figure'];
    $node = node_load($figure['figure_reference']);
    node_build_content($node);

    $data = array('position' => $figure['position'], 'columns' => $figure['columns'], 'aspect' => $node->field_aspect_ratio['und'][0]['value']);
    $vars['data'] = '';
    foreach($data as $k => $v) {
        $vars['data'] .= 'data-'.$k.'="'.$v.'" ';
    }
    
    $vars['type'] = $node->type;
    $vars['caption'] = (empty($figure['caption'])) ? $node->title : check_markup($figure['caption'], $vars['body_copy_format']);
    $vars['content'] = drupal_render($node->content['field_image']);
}

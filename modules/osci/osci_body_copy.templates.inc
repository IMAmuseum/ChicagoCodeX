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
    $vars['caption'] = (empty($figure['caption'])) ? $node->title : check_markup($figure['caption'], $figure['format']);
    if ($node->type == 'image') {
    	$vars['content'] = _osci_iip_create_iip_div($node, $figure['id']);
    }
    else {
	    	
    }
}

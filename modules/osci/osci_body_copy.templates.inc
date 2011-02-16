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
    	if (!isset($node->field_ptiff['und'][0]) && isset($node->field_image['und'][0]))
    	{
    		// ptiff is empty, use the image field for display
    		$vars['content'] = l(theme_image(array(
    			'path' => $node->field_image['und'][0]['uri'],
    			'attributes' => ''
    		)), file_create_url($node->field_image['und'][0]['uri']), array('html' => true));
    	}
    	elseif (isset($node->field_ptiff['und'][0]))
    	{
    		$vars['content'] = _osci_iip_create_iip_div($node, $figure['id']);
    	}

    	$vars['thumbnail'] = theme_image_style(array(
    	    'style_name' => "osci_thumbnail_100w",
			'path' => $node->field_image['und'][0]['uri'],
    	    'alt' => $node->title,
			'attributes' => array(
    	        'data-figure_id' => $figure['id'],
    	        'data-figure_number' => $figure['figCount']
    	    )
		));
    }
    else {

    }
}

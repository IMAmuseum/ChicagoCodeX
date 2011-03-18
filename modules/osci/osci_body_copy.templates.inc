<?php

function osci_body_copy_preprocess_body_copy_figure(&$vars) {
    $figure = $vars['figure'];
    $node = node_load($figure['figure_reference']);
    node_build_content($node);

    $data = array(
    	'position' => $figure['position'],
    	'columns' => $figure['columns'],
    	'aspect' => $node->field_aspect_ratio['und'][0]['value'],
        'vertical_position' => substr($figure['position'], 0, 1),
        'horizontal_position' => strlen($figure['position']) > 1 ? substr($figure['position'], 1, 1) : "na"
    );

    $vars['data'] = '';
    foreach($data as $k => $v) {
        $vars['data'] .= 'data-'.$k.'="'.$v.'" ';
    }

    $vars['type'] = $node->type;
    $vars['caption'] = (empty($figure['caption'])) ? '' : check_markup($figure['caption'], $figure['format']);
    $title = isset($vars['number_template']) ? $vars['number_template'] : '';
    $title .= $vars['caption'];

    switch ($node->type) {
        case 'image':
        	if (!isset($node->field_ptiff['und'][0]) && isset($node->field_image['und'][0]) || $vars['osci_static_image'])
        	{
        		// ptiff is empty, use the image field for display
        		if (isset($vars['osci_image_cache'])) {
        		    $image = theme_image_style(array(
                	    'style_name' => $vars['osci_image_cache'],
            			'path' => $node->field_image['und'][0]['uri'],
                	    'alt' => $title,
        		    	'title' => $title,
            			'attributes' => ''
            		));
        		} else {
        		    $image = theme_image(array(
            			'path' => $node->field_image['und'][0]['uri'],
        		        'alt' => $title,
        		        'title' => $title,
            			'attributes' => ''
            		));
        		}

        		$vars['content'] = l($image, file_create_url($node->field_image['und'][0]['uri']), array('html' => true, 'attributes' => array('title' => $title)));
        	}
        	elseif (isset($node->field_ptiff['und'][0]))
        	{
        	    $vars['type'] = "iip_image";
        		$vars['content'] = _osci_iip_create_iip_div($node, $figure['id']);
        	}

        	$vars['thumbnail'] = theme_image_style(array(
        	    'style_name' => "osci_thumbnail_165w",
    			'path' => $node->field_image['und'][0]['uri'],
        	    'alt' => $node->title,
    			'attributes' => array(
        	        'data-figure_id' => $figure['id'],
        	        'data-figure_number' => $figure['figCount']
        	    )
    		));
    		break;
        case 'html_figure':
            $vars['content'] = check_markup($node->field_osci_figure_content['und'][0]['value'], $node->field_osci_figure_content['und'][0]['format']);
            break;
    }
}

function osci_body_copy_preprocess_body_copy_figure_print(&$vars) {
    $vars['osci_static_image'] = true;
    $vars['osci_image_cache'] = "osci_print";
    osci_body_copy_preprocess_body_copy_figure($vars);
}

function template_preprocess_osci_book_export_pdf(&$variables) {
    global $base_url, $language;

    $variables['title'] = check_plain($variables['title']);
    $variables['base_url'] = $base_url;
    $variables['language'] = $language;
    $variables['language_rtl'] = ($language->direction == LANGUAGE_RTL);
    $variables['head'] = drupal_get_html_head();
}

function template_preprocess_osci_book_node_export_pdf(&$variables) {
    $variables['depth'] = $variables['node']->book['depth'];
    $variables['title'] = check_plain($variables['node']->title);
    $variables['content'] = $variables['node']->rendered;
}
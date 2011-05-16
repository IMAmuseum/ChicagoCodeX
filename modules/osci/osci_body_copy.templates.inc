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
        'horizontal_position' => strlen($figure['position']) > 1 ? substr($figure['position'], 1, 1) : "na",
        'figure_type' => $node->type,
    	'options' => htmlspecialchars($figure['figure_options']),
        'occurences' => $figure['figOccurences']
    );
    // store the options as they are, then strip out the url since it's
    // only needed on the thumbnail
    $options = json_decode(htmlspecialchars_decode($data['options']));
    $tempOptions = json_decode(htmlspecialchars_decode($data['options']));
    unset($tempOptions->previewUrl);
    $data['options'] = htmlspecialchars(json_encode($tempOptions));
    $vars['data'] = '';
    foreach($data as $k => $v) {
        $vars['data'] .= 'data-'.$k.'="'.$v.'" ';
    }

    $vars['type'] = $node->type;
    $vars['caption'] = (empty($figure['caption'])) ? '' : trim(check_markup($figure['caption'], $figure['format']));
    $title = isset($figure['number_template']) ? $figure['number_template'] : '';
    $title = trim(strip_tags($title . $vars['caption']));
    switch ($node->type) {
    	
        case 'image':
        	if (!isset($node->field_ptiff['und'][0]) && isset($node->field_image['und'][0]) || $vars['osci_static_image'])
        	{
        	    $image = array();
        		// ptiff is empty, use the image field for display
        		if (isset($vars['osci_image_cache'])) {
        		    $image[] = theme_image_style(array(
                	    'style_name' => $vars['osci_image_cache'],
            			'path' => $node->field_image['und'][0]['uri'],
                	    'alt' => $title,
        		    	'title' => $title,
            			'attributes' => array(
        		            'class' => $vars['osci_image_cache']
        		        )
            		));
        		} else {
        		    $image[] = theme_image(array(
            			'path' => $node->field_image['und'][0]['uri'],
        		        'alt' => $title,
        		        'title' => $title,
            			'attributes' => array(
        		            'class' => 'osci_image_full'
        		        )
            		));
        		}

        		$imageStyles = array("osci_image_256", "osci_image_512", "osci_image_1024");
        		foreach($imageStyles as $imgStyle) {
        		    $image[] = theme_image_style(array(
                	    'style_name' => $imgStyle,
            			'path' => $node->field_image['und'][0]['uri'],
                	    'alt' => $title,
        		    	'title' => $title,
            			'attributes' => array(
        		            'class' => $imgStyle
        		        )
            		));
        		}

        		$vars['content'] = l(
        		    implode(" ",$image),
        		    file_create_url($node->field_image['und'][0]['uri']),
        		    array(
        		    	'html' => true,
        		    	'attributes' => array('title' => $title)
        		    )
        		);
        	}
        	elseif (isset($node->field_ptiff['und'][0]))
        	{
        	    $vars['type'] = "iip_image";
        		$vars['content'] = _osci_iip_create_iip_div($node, $figure['id']);
        	}
        	// test is a preview url is available.  If so, use it in the thumbnail below
        	
        	if ($options && $options->previewUrl && $options->previewUrl != '') {
        		$vars['thumbnail'] = theme_image_style(array(
	        	    'style_name' => "osci_thumbnail_165w",
	    			'path' => 'public://'.str_ireplace('sites/default/files/', '', $options->previewUrl),
	        	    'alt' => $node->title,
	    			'attributes' => array(
	        	        'data-figure_id' => $figure['id'],
	        	        'data-figure_number' => $figure['figCount'],
        		        'data-occurences' => $figure['figOccurences']
	        	    )
    			));
        	}
        	else {
        		$vars['thumbnail'] = theme_image_style(array(
	        	    'style_name' => "osci_thumbnail_165w",
	    			'path' => $node->field_image['und'][0]['uri'],
	        	    'alt' => $node->title,
	    			'attributes' => array(
	        	        'data-figure_id' => $figure['id'],
	        	        'data-figure_number' => $figure['figCount'],
        		        'data-occurences' => $figure['figOccurences']
	        	    )
    			));
        	}
        	
        	
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

<?php
/**
 * @file
 * aic_rti_viewer_feature.features.inc
 */

/**
 * Implements hook_node_info().
 */
function aic_rti_viewer_feature_node_info() {
  $items = array(
    'rti_viewer' => array(
      'name' => t('RTI Viewer'),
      'base' => 'node_content',
      'description' => t('View RTI images via the web.'),
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
  );
  return $items;
}

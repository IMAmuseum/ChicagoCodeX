<?php
/**
 * @file
 * three_sixty_slider_feature.features.inc
 */

/**
 * Implements hook_node_info().
 */
function three_sixty_slider_feature_node_info() {
  $items = array(
    '360_slider' => array(
      'name' => t('360 Slider'),
      'base' => 'node_content',
      'description' => t('View an object as a 360 degree image rotator.'),
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
  );
  return $items;
}

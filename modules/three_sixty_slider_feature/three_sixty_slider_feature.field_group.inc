<?php
/**
 * @file
 * three_sixty_slider_feature.field_group.inc
 */

/**
 * Implements hook_field_group_info().
 */
function three_sixty_slider_feature_field_group_info() {
  $export = array();

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_images|node|360_slider|form';
  $field_group->group_name = 'group_images';
  $field_group->entity_type = 'node';
  $field_group->bundle = '360_slider';
  $field_group->mode = 'form';
  $field_group->parent_name = '';
  $field_group->data = array(
    'label' => 'Upload Images',
    'weight' => '1',
    'children' => array(
      0 => 'field_360_images',
      1 => 'field_alt_tag',
    ),
    'format_type' => 'tabs',
    'format_settings' => array(
      'formatter' => '',
      'instance_settings' => array(
        'classes' => '',
      ),
    ),
  );
  $export['group_images|node|360_slider|form'] = $field_group;

  return $export;
}

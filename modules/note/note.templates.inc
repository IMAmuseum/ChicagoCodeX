<?php

function note_preprocess_note(&$vars) {
    $note               = $vars['note'];
    $vars['content']    = check_plain($note->body);
    $children           = element_children($note->content);

    foreach($children as $theme) {
        $vars['meta'] .= drupal_render($note->content[$theme]);
    }
    
    $links = array(
        l('Edit', 'ajax/note/' . $note->onid . '/edit', 
            array(
                'attributes' => array(
                    'class' => array('note-edit-link'),
                ),
            )
        ),
        l('Delete', 'ajax/note/' . $note->onid . '/delete', 
            array(
                'attributes' => array(
                    'class' => array(
                        'note-delete-link',
                    ),
                ),
            )
        ),
        l('Close', 'ajax/note/' . $note->onid . '/close', 
            array(
                'attributes' => array(
                    'class' =>array(
                        'note-close-link',
                    ),
                ),
            )
        ),
    );
    $vars['links'] = theme('item_list', array('items' => $links));
}

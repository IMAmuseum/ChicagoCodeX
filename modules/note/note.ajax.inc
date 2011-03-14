<?php

function note_ajax_add() {
    ctools_include('modal');

    $form_state = array(
        'ajax'  => TRUE,
        'title' => 'Create a note',
    );

    $output = ctools_modal_form_wrapper('note_form', $form_state);

    if ($form_state['executed']) {
        $output = array();
        $script = '<script type="text/javascript">$.osci.note.addNotes();</script>';
        $output[] = ajax_command_append('head', $script);
        $output[] = ctools_modal_command_dismiss();
    }

    print ajax_render($output);
    exit;
}


function note_ajax_load($onid) {
    ctools_include('modal');
    
    $note = note_load($onid);
    $note = note_view($note);

    $content = drupal_render($note[$onid]->content);
    $output[] = ajax_command_remove('.note');
    $output[] = ajax_command_prepend('#note-' . $onid, $content);

    print ajax_render($output); 
    exit;
}

function user_notes_ajax($node) {
    if (!user_access('view own notes')) return;
    return drupal_json_output(user_notes($node));
}

function note_highlight() {
    return drupal_json_output(array('success'));
}

function note_note() {
    return drupal_json_output(array());

}

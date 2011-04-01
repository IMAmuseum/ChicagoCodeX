<?php

function note_ajax_add() {
    ctools_include('modal');
    $args = func_get_args();
    if ($args[0]) {
        $note = note_load($args[0]);
    }

    $form_state = array(
        'ajax'  => TRUE,
        'title' => 'Create a note',
        'note'  => $note[$args[0]],
    );

    $output = ctools_modal_form_wrapper('note_form', $form_state);

    if ($form_state['executed']) {
        $output = array();
        $script = '<script type="text/javascript">$.osci.note.addNotes();</script>';
        $output[] = ajax_command_remove('.note');
        $output[] = ajax_command_append('head', $script);
        $output[] = ctools_modal_command_dismiss();
    }

    print ajax_render($output);
    exit;
}

function note_ajax_save($onid = null) {
    note_save($_POST);
    $node = node_load($_POST['nid']); 

    return drupal_json_output(user_notes($node));
}

function note_ajax_load($onid) {
    ctools_include('modal');
    
    $note = note_load($onid);
    $note = note_view($note);

    $content = drupal_render($note[$onid]->content);
    $output[] = ajax_command_remove('.note');
    $output[] = ajax_command_after('#note-link-' . $onid, $content);

    print ajax_render($output); 
    exit;
}

function note_ajax_delete($onid) {
    if (!is_numeric($onid)) return;

    ctools_include('modal');
    note_delete($onid);

    $script = '<script type="text/javascript">
            var highlightSpan = $("span#span-note-'.$onid.'");
            highlightSpan.find(".note-delete-link").remove();
            highlightSpan.replaceWith(highlightSpan.html());
            $.osci.note.addNotes();
        </script>';
    $output[] = ajax_command_remove('.note');
    $output[] = ajax_command_append('head', $script);

    print ajax_render($output);
}

function user_notes_ajax($node) {
    return drupal_json_output(user_notes($node));
}

function citation_ajax() {
    ctools_include('modal');

    $form_state = array(
        'ajax'  => TRUE,
        'title' => 'Citations',
    );

    $output = ctools_modal_form_wrapper('citation_form', $form_state);

    if ($form_state['executed']) {
        $output = array();
        $output[] = ctools_modal_command_dismiss();
    }

    print ajax_render($output);
    exit;
}

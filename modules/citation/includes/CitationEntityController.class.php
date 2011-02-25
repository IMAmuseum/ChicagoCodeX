<?php

/***********************************************
 * Class to provide CRUD functions for citation entity
 */
class CitationEntityController extends DrupalDefaultEntityController {

    public function save($citation) {
        $primary_key = (!empty($citation->cid)) 'cid' : null;
        drupal_write_record('citation', $citation, $primary_key);
    }

    public function load($cid) {

    }

    public function view($citation) {

    }

    public function delete($cid) {

    }

    public function access($citation) {

    }
}

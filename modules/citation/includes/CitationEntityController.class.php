<?php

/***********************************************
 * Class to provide CRUD functions for citation entity
 */
class CitationEntityController extends DrupalDefaultEntityController {

    public function access($op, $cid) {
        // TODO: implement
        if (user_access('administer citations')) return TRUE;
        switch($op) {
            case 'view':
            case 'edit':
            case 'create':
        }
        return TRUE;
    }

    public function save($citation) {
        $transaction = db_transaction();
        $citation = (object)$citation;
        field_attach_presave('citation', $citation);

        try {
            if ($citation->cid) {
                drupal_write_record('citation', $citation, 'cid');
                field_attach_update('citation', $citation);
            } else {
                drupal_write_record('citation', $citation);
                field_attach_insert('citation', $citation);
            }

            return $citation;
        }
        catch (Exemption $e) {
            $transaction->rollback('citation');
            watchdog_exception('citation', $e);
            throw $e;
        }
        
    }

    public function view($citations, $view_mode = 'full') {
        global $user;

        foreach ($citations as $cid => $citation) {
            if (!$this->access($cid)) continue;

            $citations[$cid]->content = array();

            field_attach_prepare_view('citation', array($cid => $citation), $view_mode);
            entity_prepare_view('citation', array($cid => $citation));
            $citations[$cid]->content += field_attach_view('citation', $citation, $view_mode);
            $citations[$cid]->content += array(
                '#theme'        => 'citation',
                '#citation'     => $citations[$cid],
                '#view_mode'    => $view_mode,
                '#children'     => field_attach_view('citation', $citation, $view_mode),
            );

        }
        return $citations;
    }

    public function build($citations) {
        $citations = $this->view($citations);
        $output = '';

        foreach($citations as $cid => $citation) {
dpm($citation->content);
             $output .= drupal_render($citation->content);
        }
        
        return $output;
    }

    public function delete($cid) {
        $citation = citation_load($cid);

        if ($citation) {
            $transaction = db_transaction();

            try {
                db_delete('citation')->condition('cid', $cid, 'IN')->execute();
                field_attach_delete('citation', $citation);
            }
            catch (Exception $e) {
                $transaction->rollback();
                watchdog_exception('citation', $e);
                throw $e;
            }
        }
    }

}

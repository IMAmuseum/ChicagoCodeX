<?php 

function aic_custom_drush_command() {
	$commands['aic-import'] = array(
		'description' => 'Imports content from JSON export',
		'arguments' => array('file'),
		'required-arguments' => TRUE,
	);
	return $commands;
}

function aic_custom_drush_help($section) {
	switch ($section) {
		case 'drush:aic-import':
			return 'Import content from JSON export.  Must provide path to json file as argument';
	}
}

function drush_aic_custom_aic_import($path = NULL) {
	if (!$path) {
		print "Cannot operate without a file to import\n";
		return;
	}
	$contents = file_get_contents($path);
	if (!$contents) {
		print "Could not read import file\n";
		return;
	}
	
	global $json, $copyFields;
	$json = json_decode($contents);
	$copyFields = array();
	
	// first import the files
	print "Importing Files...\n";
	for ($i = 0; $i < count($json->files); $i++) {
		$file = $json->files[$i];
		
		// test if the uri already exists in the database
		$existing = db_query("SELECT * FROM {file_managed} f WHERE f.uri = :uri", array(':uri' => $file->uri))->fetchObject();
		if ($existing) {
			// there is an existing record. assign new_fid in the import data
			// to the same as fid ad the record in the db so later we can 
			// reference this existing file from the import data
			$json->files[$i]->new_id = $existing->fid;
			continue;
		}
		
		// no existing, create a new file object and save to database
		$newFile = new stdClass();
		$newFile->uid = 0;
		$newFile->uri = $file->uri;
		$newFile->filename = $file->filename;
		$newFile->filemime = $file->filemime;
		$newFile->filesize = $file->filesize;
		$newFile->status = 1;
		file_save($newFile);
		
		// store new id in import data for later reference
		$json->files[$i]->new_id = $newFile->fid;
	}
	
	// import Images as Image Assets
	print "Importing Images...\n";
	for ($i = 0; $i < count($json->images); $i++) {
		$asset = _objectToArray($json->images[$i]);
		$node = new stdClass();
		$node->type = 'image_asset';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		// copy field_image, replacing owner and setting proper new fid
		$node->field_image = $asset['field_image'];
		if (isset($node->field_image['und'][0]['fid'])) {
			$node->field_image['und'][0]['uid'] = 0;
			$node->field_image['und'][0]['fid'] = _getNewFileId($node->field_image['und'][0]['fid']);
		}
		// save node, keep the node id for later referrals
		node_save($node);
		$json->images[$i]->new_id = $node->nid;
	}
	
	// import Image assets
	print "Importing Image Assets...\n";
	for ($i = 0; $i < count($json->imageAssets); $i++) {
		$asset = _objectToArray($json->imageAssets[$i]);
		$node = new stdClass();
		$node->type = 'image_asset';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		// copy field_image, replacing owner and setting proper new fid
		$node->field_image = $asset['field_image'];
		if (isset($node->field_image['und'][0]['fid'])) {
			$node->field_image['und'][0]['uid'] = 0;
			$node->field_image['und'][0]['fid'] = _getNewFileId($node->field_image['und'][0]['fid']);
		}
		// save node, keep the node id for later referrals
		node_save($node);
		$json->imageAssets[$i]->new_id = $node->nid;
	}
	
	// import SVG assets
	print "Importing SVG Assets...\n";
	for ($i = 0; $i < count($json->svgAssets); $i++) {
		$asset = _objectToArray($json->svgAssets[$i]);
		$node = new stdClass();
		$node->type = 'svg_asset';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		// copy field_svg, replacing owner and setting proper new fid
		$node->field_svg = $asset['field_svg'];
		if (isset($node->field_svg['und'][0]['fid'])) {
			$node->field_svg['und'][0]['uid'] = 0;
			$node->field_svg['und'][0]['fid'] = _getNewFileId($node->field_svg['und'][0]['fid']);
		}
		// save and keep the node id for later referrals
		node_save($node);
		$json->svgAssets[$i]->new_id = $node->nid;
	}
	
	// import IIP assets
	print "Importing IIP Assets...\n";
	for ($i = 0; $i < count($json->iipAssets); $i++) {
		$asset = _objectToArray($json->iipAssets[$i]);
		$node = new stdClass();
		$node->type = 'iip_asset';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_ptiff_path = $asset['field_ptiff_path'];
		$node->field_ptiff_attr = $asset['field_ptiff_attr'];
		$node->field_iip_server = $asset['field_iip_server'];
		// copy field_image, replacing owner and setting proper new fid
		$node->field_image = $asset['field_image'];
		if (isset($node->field_image['und'][0]['fid'])) {
			$node->field_image['und'][0]['uid'] = 0;
			$node->field_image['und'][0]['fid'] = _getNewFileId($node->field_image['und'][0]['fid']);
		}
		// save and keep the node id for later referrals
		node_save($node);
		$json->iipAssets[$i]->new_id = $node->nid;
	}
	
	// import File assets
	print "Importing File Assets...\n";
	for ($i = 0; $i < count($json->fileAssets); $i++) {
		$asset = _objectToArray($json->fileAssets[$i]);
		$node = new stdClass();
		$node->type = 'file_asset';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		// copy field_file, replacing owner and setting proper new fid
		$node->field_file = $asset['field_file'];
		if (isset($node->field_file['und'][0]['fid'])) {
			$node->field_file['und'][0]['uid'] = 0;
			$node->field_file['und'][0]['fid'] = _getNewFileId($node->field_file['und'][0]['fid']);
		}
		// save and keep the node id for later referrals
		node_save($node);
		$json->fileAssets[$i]->new_id = $node->nid;
	}
	
	// import HTML figures
	print "Importing HTML Figures...\n";
	for ($i = 0; $i < count($json->htmlFigures); $i++) {
		$asset = _objectToArray($json->htmlFigures[$i]);
		$node = new stdClass();
		$node->type = 'html_figure';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_figure_content = $asset['field_osci_figure_content'];
		$node->field_aspect_ratio = $asset['field_aspect_ratio'];
		// copy field_image, replacing owner and setting proper new fid
		if (isset($node->field_image['und'][0]['fid'])) {
			$node->field_image['und'][0]['uid'] = 0;
			$node->field_image['und'][0]['fid'] = _getNewFileId($node->field_image['und'][0]['fid']);
		}
		// save and keep the node id for later referrals
		node_save($node);
		$json->htmlFigures[$i]->new_id = $node->nid;
	}
	
	// import Conservation assets after other asset types as they nodereference other assets
	// types and need the newer nids created above
	print "Importing Conservation Assets...\n";
	for ($i = 0; $i < count($json->conservationAssets); $i++) {
		$asset = _objectToArray($json->conservationAssets[$i]);
		$node = new stdClass();
		$node->type = 'layered_image';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_data = $asset['field_data'];
		// $node->field_aspect_ratio = $asset['field_aspect_ratio']; # not used
		// copy field_image, replacing owner and setting proper new fid
		$node->field_image = $asset['field_image'];
		if (isset($node->field_image['und'][0]['fid'])) {
			$node->field_image['und'][0]['uid'] = 0;
			$node->field_image['und'][0]['fid'] = 
				_getNewFileId($node->field_image['und'][0]['fid']);
		}
		// copy field_assets, replacing old nid with post-import nid
		$node->field_assets = $asset['field_assets'];
		if (is_array($node->field_assets['und'])) {
			foreach ($node->field_assets['und'] as &$ref) {
				$ref['nid'] = _getNewNodeId($ref['nid']);
			}
		}
		// save and keep the node id for later referrals
		node_save($node);
		$json->conservationAssets[$i]->new_id = $node->nid;
	}
	
	// import Collectors
	print "Importing Collectors...\n";
	for ($i = 0; $i < count($json->collectors); $i++) {
		$asset = _objectToArray($json->collectors[$i]);
		$node = new stdClass();
		$node->type = 'collector';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_navigation_title = $asset['field_osci_navigation_title'];
		// $node->field_content_length = $asset['field_osci_content_length'];
		$node->field_active = $asset['field_active'];
		// if plate image is present, make it the first figure
		if (isset($asset['field_osci_plate_image']['und'][0]['nid'])) {
			$node->field_figure['und'][] = _createFigureFromNid($asset['field_osci_plate_image']['und'][0]['nid'], TRUE);
		}
		// if there are attached files, reattach to new node with new id
		if (isset($asset['field_attached_files']['und'])) {
			$node->field_file = array('und' => array());
			foreach ($asset['field_attached_files']['und'] as $file) {
				$file['fid'] = _getNewFileId($file['fid']);
				$node->field_file['und'][] = $afile;
			}
		}
		// save and keep the node id for later referrals
		node_save($node);		
		$json->collectors[$i]->new_id = $node->nid;
		// transmute body copy fields
		_transmuteBodyCopyField($asset['field_osci_body'], $node, 'field_curatorial_entry');
		node_save($node);
	}
	
	// import Title Pages
	print "Importing Title Pages...\n";
	for ($i = 0; $i < count($json->titlePages); $i++) {
		$asset = _objectToArray($json->titlePages[$i]);
		$node = new stdClass();
		$node->type = 'title_pages';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_navigation_title = $asset['field_osci_navigation_title'];
		// $node->field_content_length = $asset['field_osci_content_length'];
		$node->field_active = $asset['field_active'];
		// if plate image is present, make it the first figure
		if (isset($asset['field_osci_plate_image']['und'][0]['nid'])) {
			$node->field_figure['und'][] = _createFigureFromNid($asset['field_osci_plate_image']['und'][0]['nid'], TRUE);
		}
		// save and keep the node id for later referrals
		node_save($node);
		$json->titlePages[$i]->new_id = $node->nid;
		// transmute body copy fields (requires the nid to be populated, hence the save first) 
		_transmuteBodyCopyField($asset['field_osci_authors'], $node, 'field_authors');
		node_save($node);
	}
	
	// import About This Catalogue
	print "Importing About This Catalogues...\n";
	for ($i = 0; $i < count($json->aboutThisCatalogues); $i++) {
		$asset = _objectToArray($json->aboutThisCatalogues[$i]);
		$node = new stdClass();
		$node->type = 'about_this_catalogue';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_navigation_title = $asset['field_osci_navigation_title'];
		// $node->field_content_length = $asset['field_osci_content_length'];
		$node->field_active = $asset['field_active'];
		// if plate image is present, make it the first figure
		if (isset($asset['field_osci_plate_image']['und'][0]['nid'])) {
			$node->field_figure['und'][] = _createFigureFromNid($asset['field_osci_plate_image']['und'][0]['nid'], TRUE);
		}
		// save the node (need a node id to continue)
		node_save($node);
		$json->aboutThisCatalogues[$i]->new_id = $node->nid;
		// transmute body copy fields
		_transmuteBodyCopyField($asset['field_osci_directors_statement'], $node, 'field_directors_statement');
		_transmuteBodyCopyField($asset['field_osci_acknowledgments'], $node, 'field_acknowledgments');
		_transmuteBodyCopyField($asset['field_osci_contributors'], $node, 'field_contributors');
		_transmuteBodyCopyField($asset['field_osci_glossary'], $node, 'field_glossary');
		_transmuteBodyCopyField($asset['field_osci_using_this_catalogue'], $node, 'field_using_this_catalogue');
		node_save($node);
	}
	
	// import Sections
	print "Importing Sections...\n";
	for ($i = 0; $i < count($json->sections); $i++) {
		$asset = _objectToArray($json->sections[$i]);
		$node = new stdClass();
		$node->type = 'section';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_navigation_title = $asset['field_osci_navigation_title'];
		// $node->field_content_length = $asset['field_osci_content_length'];
		$node->field_active = $asset['field_active'];
		// if plate image is present, make it the first figure
		if (isset($asset['field_osci_plate_image']['und'][0]['nid'])) {
			$node->field_figure['und'][] = _createFigureFromNid($asset['field_osci_plate_image']['und'][0]['nid'], TRUE);
		}
		// if there are attached files, reattach to new node with new id
		if (isset($asset['field_attached_files']['und'])) {
			$node->field_file = array('und' => array());
			foreach ($asset['field_attached_files']['und'] as $file) {
				$file['fid'] = _getNewFileId($file['fid']);
				$node->field_file['und'][] = $afile;
			}
		}
		// save the node (need a node id to continue)
		node_save($node);
		$json->sections[$i]->new_id = $node->nid;
		// transmute body copy fields
		_transmuteBodyCopyField($asset['field_osci_body'], $node, 'field_body');
		node_save($node);
	}
	
	// Don't import volumes, as they are shell nodes for books
	// import Volumes
	// print "Importing Volumes...\n";
	// for ($i = 0; $i < count($json->volumes); $i++) {
	// 	$asset = _objectToArray($json->volumes[$i]);
	// 	$node = new stdClass();
	// 	$node->type = 'volume';
	// 	$node->language = 'und';
	// 	node_object_prepare($node);
	// 	// copy fields
	// 	$node->title = $asset['title'];
	// 	// $node->field_content_length = $asset['field_osci_content_length'];
	// 	$node->field_active = $asset['field_active'];
	// 	$node->field_editor = $asset['field_osci_editor'];
	// 	// if plate image is present, make it the first figure
	// 	if (isset($asset['field_osci_plate_image']['und'][0]['nid'])) {
	// 		$node->field_figure['und'][] = _createFigureFromNid($asset['field_osci_plate_image']['und'][0]['nid'], TRUE);
	// 	}
	// 	// if there are attached files, reattach to new node with new id
	// 	if (isset($asset['field_attached_files']['und'])) {
	// 		$node->field_file = array('und' => array());
	// 		foreach ($asset['field_attached_files']['und'] as $file) {
	// 			$file['fid'] = _getNewFileId($file['fid']);
	// 			$node->field_file['und'][] = $afile;
	// 		}
	// 	}
	// 	// would copy over identifier to new field, but there is no identifier content, so skipping
	// 	//
	// 	// save the node (need a node id to continue)
	// 	node_save($node);
	// 	$json->volumes[$i]->new_id = $node->nid;
	// 	// transmute body copy fields
	// 	_transmuteBodyCopyField($asset['field_osci_body'], $node, 'field_curatorial_entry');
	// 	_transmuteBodyCopyField($asset['field_osci_credits'], $node, 'field_credits');
	// 	node_save($node);
	// }
		
	// import Works of Art - Must come after Collector (nodereference)
	print "Importing Works of Art...\n";
	for ($i = 0; $i < count($json->workOfArts); $i++) {
		$asset = _objectToArray($json->workOfArts[$i]);
		$node = new stdClass();
		$node->type = 'work_of_art';
		$node->language = 'und';
		node_object_prepare($node);
		// copy fields
		$node->title = $asset['title'];
		$node->field_navigation_title = $asset['field_osci_navigation_title'];
		// $node->field_content_length = $asset['field_osci_content_length'];
		$node->field_catalogue_number = $asset['field_osci_catalogue_number'];
		$node->field_active = $asset['field_active'];
		$node->field_creator = $asset['field_osci_creator'];
		$node->field_work_title = $asset['field_osci_work_title'];
		$node->field_creation = $asset['field_osci_creation'];
		$node->field_materials = $asset['field_osci_materials'];
		$node->field_credit_line = $asset['field_osci_credit_line'];
		$node->field_accession = $asset['field_osci_accession'];
		$node->field_authors_tombstone = $asset['field_author_tombstone'];
		$node->field_author_curatorial_entry = $asset['field_author_body'];
		$node->field_author_technical_report = $asset['field_author_technical_analysis'];
		// copy collector nodereference
		if (isset($asset['field_osci_donated_by']['und'][0]['nid'])) {
			$node->field_donated_by['und'][0]['nid'] = _getNewNodeId($asset['field_osci_donated_by']['und'][0]['nid']);
		}
		// if plate image is present, make it the first figure
		if (isset($asset['field_osci_plate_image']['und'][0]['nid'])) {
			$node->field_figure['und'][] = _createFigureFromNid($asset['field_osci_plate_image']['und'][0]['nid'], TRUE);
		}
		// if there are attached files, reattach to new node with new id
		if (isset($asset['field_attached_files']['und'])) {
			$node->field_file = array('und' => array());
			foreach ($asset['field_attached_files']['und'] as $file) {
				$file['fid'] = _getNewFileId($file['fid']);
				$node->field_file['und'][] = $file;
			}
		}
		// save the node (need a node id to continue)
		node_save($node);
		$json->workOfArts[$i]->new_id = $node->nid;
		// transmute body copy fields
		_transmuteBodyCopyField($asset['field_osci_tombstone'], $node, 'field_tombstone');
		_transmuteBodyCopyField($asset['field_osci_body'], $node, 'field_curatorial_entry');
		_transmuteBodyCopyField($asset['field_osci_technical_analysis'], $node, 'field_technical_report');
		_transmuteBodyCopyField($asset['field_osci_provenance'], $node, 'field_provenance');
		_transmuteBodyCopyField($asset['field_osci_exhibitions'], $node, 'field_exhibitions');
		_transmuteBodyCopyField($asset['field_osci_references'], $node, 'field_references');
		_transmuteBodyCopyField($asset['field_osci_other_documentation'], $node, 'field_other_documentation');
		node_save($node);
	}
	
	// Use Book module data to form our Publication nodes
	print "Importing Books...\n";
	for ($i = 0; $i < count($json->books); $i++) {
		$asset = _objectToArray($json->books[$i]);
		$pub = new stdClass();
		$pub->type = 'publication';
		$pub->language = 'und';
		node_object_prepare($pub);
		// copy title
		$pub->title = $asset['link']['link_title'];
		// copy identifier field
		if (!empty($asset['field_osci_isbn'])) {
			$pub->field_osci_tk_identifier['und'][] = array(
				'identifier_type' => 'isbn',
				'identifier' => $asset['field_osci_isbn']['und'][0]['value']	
			);
		}
		if (!empty($asset['field_osci_doi'])) {
			$pub->field_osci_tk_identifier['und'][] = array(
				'identifier_type' => 'doi',
				'identifier' => $asset['field_osci_doi']['und'][0]['value']
			);
		}
		// build nodetree from book data
		$pub->field_nodetree = array();
		_nodetreeFromBook(array($asset), $pub->field_nodetree);
		node_save($pub);
	}

	// Relink node references in copy fields
	print "Relinking node references in copy fields...\n";
	$allNodes = node_load_multiple(FALSE);
	foreach ($allNodes as $node) {
		$modified = FALSE;
		// test if this node has copy fields
		foreach ($copyFields as $copyField) {
			if (isset($node->$copyField)) {
				// parse link tags for this copy field
				$ncf = $node->$copyField;
				preg_match_all('/\[link:(\d+)[^\]]*\]/', $ncf['und'][0]['value'], $matches);
				for ($i = 0; $i < count($matches[0]); $i++) {
					$search = "/link:{$matches[1][$i]}/";
					$replace = "link:" . _getNewNodeId($matches[1][$i]);
					$ncf['und'][0]['value'] = preg_replace($search, $replace, $ncf['und'][0]['value']);
					$modified = TRUE;
				}
				$node->$copyField = $ncf;
			}
		}
		if ($modified) {
			node_save($node);
		}
	}
}

function _nodetreeFromBook($assets, &$fieldNodetree) {
	foreach ($assets as $asset) {
		$nodetree = array();
		// set target nid
		$nodetree['target_nid'] = _getNewNodeId($asset['link']['nid']);
		// set parent nid
		if ($asset['link']['depth'] === 1) {
			$nodetree['parent_nid'] = '';
		}
		else {
			// step backwards in the array until we find depth-1
			for ($i = (count($fieldNodetree['und']) - 1); $i >= 0; $i--) {
				$instance = $fieldNodetree['und'][$i];
				if ($instance['depth'] < ($asset['link']['depth'] - 1)) {
					$nodetree['parent_nid'] = $instance['target_nid'];
					break;
				}
			}
		}
		// set weight
		$nodetree['weight'] = isset($asset['link']['weight']) ? $asset['link']['weight'] : 0;
		// set depth
		$nodetree['depth'] = $asset['link']['depth'] - 1;
		// append to nodetree field
		$fieldNodetree['und'][] = $nodetree;
		// process children
		if (count($asset['below']) > 0) {
			// print_r(array_keys($asset['below']));
			_nodetreeFromBook($asset['below'], $fieldNodetree);
		}
	}
}

function _getNewFileId($fid) {
	global $json;
	foreach ($json->files as $file) {
		if ($file->fid === $fid) {
			return (int) $file->new_id;
		}
	}
	die("Could not find old file {$fid}\n");
}

function _getNewNodeId($nid) {
	global $json;
	$contentTypes = get_object_vars($json);
	foreach ($contentTypes as $contentType) {
		foreach ($contentType as $node) {
			if (isset($node->nid) && $node->nid == $nid) {
				return (int) $node->new_id;
			}
		}
	}
	print "Could not find new node id for nid: {$nid}\n";
	return FALSE;
}

function _createFigureFromNid($nid, $plate = FALSE) {
	// global $json;
	// set up a base figure
	$figure = array(
		'asset_reference' => '',
		'number_template' => 'Fig. cat#.fig#',
		'caption'         => '',
		'position'        => 'n',
		'columns'         => '50%',
		'options'         => '{}'	
	);
	// replace asset reference with new id of passed in nid
	$figure['asset_reference'] = _getNewNodeId($nid);
	if ($plate) {
		$figure['position'] = 'plate';
	}
	return $figure;
}

function _transmuteBodyCopyField($bcField, $node, $newFieldName) {
	// track body copy fields for end of migration parsing (_relinkCopyFields)
	global $copyFields;
	if (!in_array($newFieldName, $copyFields)) {
		$copyFields[] = $newFieldName;
	}

	// if no data, just set the newFieldName to a blank string
	if (!isset($bcField['und'][0])) {
		$newField = array();
		$newField['und'][0]['value'] = '';
		$node->$newFieldName = $newField;
		return;
	}
	// Body Copy fields are only single value
	$bc = $bcField['und'][0];
	// a place to store references between figure names and their nids
	$refs = array(
		'figures' => array(),
		'footnotes' => array()
	);
	// extract the figure data
	$figures = unserialize($bc['figures']);
	if ($figures) {
		foreach ($figures as $figRef => $fig) {
			$newFig = array(
				'number_template' => $fig['number_template'],
				'caption' => $fig['caption'],
				'position' => $fig['position'],
				'columns' => $fig['columns'],
				'options' => '{}'
			);
			// find figures new nid
			$newFig['asset_reference'] = _getNewNodeId($fig['figure_reference']);
			if (!is_numeric($newFig['asset_reference'])) {
				print "- Invalid figure reference in node {$node->nid}\n";
				continue;
			}
			// parse figure options
			// find and replace nids
			$figOptions = json_decode($fig['figure_options']);
			if (is_array($figOptions->annotationPreset)) {
				foreach ($figOptions->annotationPreset as &$presetNid) {
					$presetNid = _getNewNodeId($presetNid);
				}
			}
			if (is_array($figOptions->baseLayerPreset)) {
				foreach ($figOptions->baseLayerPreset as &$presetNid) {
					$presetNid = _getNewNodeId($presetNid);
				}
			}
			// some options renamed
			if (isset($figOptions->annotation) && $figOptions->annotation == FALSE) {
				$figOptions->disable_annotation = TRUE;
			} else {
				$figOptions->disable_annotation = FALSE;
			}
			unset($figOptions->annotation);
			if (isset($figOptions->interaction) && $figOptions->interaction == FALSE) {
				$figOptions->disable_interaction = TRUE;
			} else {
				$figOptions->disable_interaction = FALSE;
			}
			unset($figOptions->interaction);

			$newFig['options'] = json_encode($figOptions);
			// add the new figure to the node, and store a reference for later lookup
			$node->field_figure['und'][] = $newFig;
			$refs['figures'][$figRef] = count($node->field_figure['und']) - 1;
		}
	}
	// extract footnote data
	$footnotes = unserialize($bc['footnotes']);
	if ($footnotes) {
		foreach ($footnotes as $footRef => $footnote) {
			// add new footnote to the node and store a reference for later lookup
			$footnoteArr = array('value' => $footnote, 'format'=> 'osci_tk_format');
			$node->field_footnote['und'][] = $footnoteArr;
			$refs['footnotes'][$footRef] = count($node->field_footnote['und']) - 1;
		}
	}
	// process body copy to replace old figure and footnote references with new
	// step through all figure refs 
	foreach ($refs['figures'] as $figRef => $figIndex) {
		// find the string in the body copy and replace with updated reference
		$search = "[figure:{$figRef}]";
		$replace = "[figureref:fig-{$node->nid}-{$figIndex}]";
		$bc['body_copy'] = str_replace($search, $replace, $bc['body_copy']);
		
	}
	// step through all footnote refs
	foreach ($refs['footnotes'] as $footRef => $footIndex) {
		// find the string in the body copy and replace with updated reference
		$search = "[footnote:{$footRef}]";
		$replace = "[footnoteref:fn-{$node->nid}-{$footIndex}]";
		$bc['body_copy'] = str_replace($search, $replace, $bc['body_copy']);
	}
	$bodyField = array();
	$bodyField['und'][0]['value'] = $bc['body_copy'];
	$bodyField['und'][0]['format'] = 'osci_tk_format';
	$node->$newFieldName = $bodyField;
}


function _objectToArray($d) {
	if (is_object($d)) {
		// Gets the properties of the given object
		// with get_object_vars function
		$d = get_object_vars($d);
	}

	if (is_array($d)) {
		// Return array converted to object
		// Using __FUNCTION__ (Magic constant)
		// for recursive call
		return array_map(__FUNCTION__, $d);
	}
	else {
		// Return array
		return $d;
	}
}
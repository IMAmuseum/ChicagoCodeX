<!DOCTYPE HTML>
<html>
    <head>
        <title><?php print $element['#node']->title; ?></h1></title>
    </head>
    <body>
        <article>
            <header>
                <h1><?php print $element['#node']->title; ?></h1>
        </header>
<?php
    foreach ($element as $k => $v) {
        if (strpos($k, 'field_osci_') === 0) {
            print render($v);
        }
    }
?>

        </article>
    </body>
</html>

<div id="osci_viewer_wrapper">
    <div id="osci_header">
        <h1 class="osci_book_title"></h1>
        <h2 class="osci_book_section_title"><span class="loading">Loading</span> <span class="section_title"></span></h2>
        <div id="osci_header_controls">
        	<div id="osci_increase_font"></div>
        	<div id="osci_decrease_font"></div>
            <div id="osci_print"></div>
            <div id="user_link"></div>
            <div class="tooltip">
                <?php if(user_is_logged_in()): ?>
                    <a href="/user/logout?destination=<?php print current_path(); ?>" class="logout-link">Logout</a>
                    <a href="/user/<?php print $user->uid; ?>" class="profile-link">Profile</a>
                <?php else: ?>
                    <a href="/user/login?destination=<?php print current_path(); ?>" class="login-link">Login</a>
                <?php endif; ?>
            </div>
            <div id="search"></div>
        </div>
    </div>
    <div id="osci_table_of_contents_wrapper">
        <a href="#" class="osci_table_of_contents_handle">Contents</a>
    </div>
    <div id="osci_viewer"></div>
    <div id="osci_note_panel_wrapper">
        <div class="osci_reference_image everpresent" data-image_preset="thumbnail_100w_url"></div>
        <?php print $notes; ?>
    </div>
    <div id="osci_navigation_wrapper">
        <div id="osci_navigation">
            <div id="osci_navigation_tools">
                <div id="osci_navigation_section"></div>
            </div>
            <div id="osci_navigation_buttons">
                <a href="#" id="osci_nav_prev">&lsaquo; prev</a>
                <a href="#" id="osci_nav_next">next &rsaquo;</a>
            </div>
        </div>
    </div>
    <div id="osci_more_wrapper">
        <a href="#" class="osci_more_handle">More</a>
    </div>
</div>

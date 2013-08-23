OsciTk.views.App = OsciTk.views.BaseView.extend({
	id: 'reader',
	
	initialize: function() {
		$('body').append(this.el);
		
		OsciTk.templates['navigation'] = OsciTk.templateManager.get('aic-navigation');

		// Add the toolbar to the appView
		app.views.toolbarView = new OsciTk.views.Toolbar();
		this.addView(app.views.toolbarView);
		
		// Add the title view to the appView
		app.views.titleView = new OsciTk.views.Title();
		this.addView(app.views.titleView);
		
		// Add the reference image view to the AppView
		app.views.referenceImageView = new OsciTk.views.ReferenceImage();
		this.addView(app.views.referenceImageView);
		
		// Add the table of contents view
		app.views.tocView = new OsciTk.views.Toc();
		this.addView(app.views.tocView);
		
		// Add the footnotes tab
		app.views.footnotesView = new OsciTk.views.Footnotes();
		this.addView(app.views.footnotesView);
		
		// Add the figures tab
		app.views.figuresView = new OsciTk.views.Figures();
		this.addView(app.views.figuresView);

		// Add the glossary tab
		app.views.glossaryView = new OsciTk.views.Glossary();
		this.addView(app.views.glossaryView);

		// set the default section view
		var sectionViewClass = OsciTk.views.Section;

		// allow a custom section view to be used
		if (app.config.get('sectionView') && OsciTk.views[app.config.get('sectionView')]) {
			sectionViewClass = OsciTk.views[app.config.get('sectionView')];
		}
		var sectionViewOptions = {};
		if (app.config.get('sectionViewOptions')) {
			sectionViewOptions = app.config.get('sectionViewOptions');
		}
		app.views.sectionView = new sectionViewClass(sectionViewOptions);
		this.addView(app.views.sectionView);

		// Add the navigation view to the AppView
		app.views.navigationView = new OsciTk.views.Navigation();
		this.addView(app.views.navigationView);

		// Add the inline notes view to the AppView
		app.views.inlineNotesView = new OsciTk.views.InlineNotes();
		this.addView(app.views.navigationView);

		// Add the citation view to the AppView
		app.views.citationView = new OsciTk.views.Citation();

		// Add the fullscreen figure view to the AppView
		//app.views.fsFigureView = new OsciTk.views.FullscreenFigureView();
		//this.addView(app.views.fsFigureView);

		// Add the persistent notes view
		app.views.persistentNotesView = new OsciTk.views.PersistentNotesView();
		this.addView(app.views.persistentNotesView);

        // setup glossary tooltips
        app.views.glossaryTooltipView = new OsciTk.views.GlossaryTooltip();

        // Setup search
		app.views.searchView = new OsciTk.views.Search();
		this.addView(app.views.searchView);
	}
});

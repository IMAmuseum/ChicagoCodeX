// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.App = OsciTk.views.BaseView.extend({
	id: 'reader',
	
	initialize: function() {
		$('body').append(this.el);
		
		// Add the toolbar to the appView
		app.views.toolbarView = new Aic.views.Toolbar();
		this.addView(app.views.toolbarView);
		
		// Add the title view to the appView
		app.views.titleView = new Aic.views.Title();
		this.addView(app.views.titleView);
		
		// Add the reference image view to the AppView
		app.views.referenceImageView = new Aic.views.ReferenceImage();
		this.addView(app.views.referenceImageView);
		
		// Add the table of contents view
		app.views.tocView = new Aic.views.Toc();
		this.addView(app.views.tocView);
		
		// Add the footnotes tab
		app.views.footnotesView = new Aic.views.Footnotes();
		this.addView(app.views.footnotesView);
		
		// Add the figures tab
		app.views.figuresView = new Aic.views.Figures();
		this.addView(app.views.figuresView);

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
		// app.views.inlineNotesView = new OsciTk.views.InlineNotes();

		// Add the fullscreen figure view to the AppView
		// app.views.fsFigureView = new OsciTk.views.FullscreenFigureView();

	}
});
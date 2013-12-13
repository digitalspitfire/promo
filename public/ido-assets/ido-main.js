function loadTemplate(templateName){
	console.log('template name: '+ templateName);
	$.get( templateName+'.html', function( content ) {
  		$('.page-content .row:not(#page-header)').remove();
  		$('.page-content').append(content);
  		init[templateName]();
	});
}
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

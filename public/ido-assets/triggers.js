function initTriggers(){
   App.init();
   FormComponents.init();
   FormSamples.init();
   $('.toggle').parent().bootstrapSwitch();
   loadTriggers(1);
   generateToolTipsFromDb(toolTips['triggers']);

}
function loadTriggers(managerId){
	aGet('/api/triggers/'+managerId, function(data){
		if(data){
			console.log('triggers from server:');
			console.log(data);
			$.each(data,function(i,t){						
				var cntr=$('div[data-trigger-type='+t.type+']');
				cntr.find('textarea[name=text]').val(t.text);
				cntr.find('input[name=link]').val(t.link);
				cntr.find('select[name=sound]').val(t.sound);
				cntr.find('input[name=minInterval]').val(t.minInterval);
				if(!t.isActive){
					$('#isActive-'+t.type).bootstrapSwitch('setState', false);
				}
			});
		}
	});
}


$(function(){
	$('body').on('click', '.btn-save-trigger', function(){	
		var cntr = $('.tab-pane.active');
		var t = {};
		t.type = cntr.attr('data-trigger-type');
		t.text = $(cntr.find('textarea')[0]).val();
		t.link = $(cntr.find('input[name="link"]')[0]).val();
		t.localMinTimeGap = $(cntr.find('input[name="minInterval"]')[0]).val();
		console.log(t);
		/*$.ajax({
			type: "post",
			url: '/api/triggers/1',	//TODO add dynamic managerId
			data: t,
			success: function(newId) {
				console.log('trigger update');
			}
		});*/
		aPost('/api/triggers/1',t,function(newId){console.log('trigger update');});
	});
});


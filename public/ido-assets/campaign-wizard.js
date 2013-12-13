function allInputsStateChange(wizard,isDisabling){
	$.each(wizard.find('input'),function(index,i){
		$(i).prop('disabled',isDisabling);
	});
	$.each(wizard.find('textarea'),function(index,i){
		$(i).prop('disabled',isDisabling);
	});
	$.each(wizard.find('select'),function(index,i){
		$(i).prop('disabled',isDisabling);
	});
}

function loadDataTable(selector,aaData){
	if($(selector).hasClass('initialized')){
		oTable.fnDestroy();
	}
	oTable = $('#tbl-campaigns').addClass('initialized').dataTable( {
		"aaData":aaData,
		"bFilter": true,
		"bInfo": false,
		"bPaginate": false,
		"oLanguage": {
			 "sSearch": "חיפוש: ",
			 "sZeroRecords": "לא נמצאו תוצאות"
		},
		"aoColumns": [
		{ "asSorting": [ "desc", "asc"] },
		{ "asSorting": [ "desc", "asc"] },
		{ "asSorting": [ "desc", "asc"] },
		{ "asSorting": [ "desc", "asc"] },
		{ "asSorting": [] }
		]
	});	
}

function loadCampaigns(managerId,campaignId){
		var id = campaignId ? campaignId : '';
		if(id){
			var parseCampaigns = function(data){
				console.log('campaign data from server: ');
				console.log(data);

				//Restarting the wizard:
				$('#campaign-filters .panel').remove();
				$('.form-wizard ul.steps > li:first-child a').trigger('click');
				//the manger filters must come BEFORE the campaigns data:
				var attrIndex=0;
				$.each(data.managerFilters, function(a,o){
					var str ='';
					str+='<div class="panel panel-default">';
					str+='<div class="panel-heading">';
					str+='<h4 class="panel-title">';
					str+='<a class="accordion-toggle" data-toggle="collapse" data-parent="#campaign-filters" href="#collapse_'+attrIndex+'">'+a+'</a>';
					str+='</h4>';
					str+='</div>';
					str+='<div id="collapse_'+attrIndex+'" class="panel-collapse collapse">';
					str+='<div class="panel-body">';
					str+='<div class="form-group user-data-filter">';
					/*str+='<label class="control-label col-md-3">'+a+'</label>';*/
					str+='<div class="col-md-9">';
					str+='<div class="checkbox-list" name="'+a+'">';
					$.each(o.values,function(val, count){
						/*str+='<label><input type="checkbox" name="'+val+'">'+val++'-'+parseInt(100*parseInt(count)/parseInt(o.total))+'%</label>';*/
						var percentage = parseInt(100*parseInt(count)/parseInt(o.total));
						str+='<label> ( '+percentage+'% )<input type="checkbox" value="'+val+'" data-attr="'+a+'">'+val+'</label>';
					});	
					str+='</div>';
					str+='</div>';
					str+='</div>';
					str+='</div>';
					str+='</div>';
					str+='</div>';
					$('#campaign-filters').append(str);
					attrIndex++;
				});

				var wizard = $('#edit-item');
				wizard.attr('data-id',campaignId);
				var statusDisplay=wizard.find('.portlet-title .tools');
				var textInputs = wizard.find('input[type="text"]');
				var chbxInputs = wizard.find('input[type="checkbox"]');
				var selectInputs = wizard.find('select');
				var textAreas = wizard.find('textarea');
				var checboxesFilters = wizard.find('#campaign-filters input[type="checkbox"]');

				//Campaigns data:

				$.each(textInputs, function(index,i){
					i = $(i);
					var fieldName = i.attr('name');
					i.val(data[fieldName]);
				});
				$.each(chbxInputs, function(index,i){
					i = $(i);
					var fieldName = i.attr('name');
					i.prop('checked', data[fieldName] ? true : false);
				});
				$.each(selectInputs, function(index,i){
					i=$(i);
					var fieldName = i.attr('name');
					if(data[fieldName]){i.val(data[fieldName]);}
				});
				$.each(textAreas, function(index,i){
					i=$(i);
					var fieldName = i.attr('name');
					i.val(data[fieldName]);				
				});

				/*var sent = JSON.parse(data.sent);
				$('#sms-history .number').html(sent ? sent.sms : '0');
				$('#roost-history .number').html(sent ? sent.roost : '0');*/
				var filters = JSON.parse(data.filters);
				/*console.log(filters);*/
				$.each(checboxesFilters, function(index,v){
					v = $(v);
					var attr = v.attr('data-attr');
					var val = v.val();
					console.log(attr+'---'+val);
					if(filters){
						if(filters[attr]){
							if(filters[attr].indexOf(val)>-1){
								v.trigger('click');		
							}
						}					
					}
				});
				var status;
				if(data.isTerminated){
					status='<span class="label label-danger">הסתיים</span>';
					$('#isActive-input > div:first-child').hide();
					$('#isActive-input .label-cntr').show();
				}
				else{
					$('#isActive-input > div:first-child').show();
					$('#isActive-input .label-cntr').hide();	
					if(data.isActive){
						status =  '<span class="label label-success">פעיל</span>';
					}
					else{ //TODO- this should happen automatically !!!
						wizard.find('input[name=isActive]').prop('checked',false);	
						wizard.find('input[name=isActive]').parent().removeClass('switch-on').addClass('switch-off'); 
					}
				}
				if(data.isTerminated || data.isActive){
					$('.progress-bar').hide();
					allInputsStateChange(wizard,true);	
				}else{
					$('.progress-bar').show();
					allInputsStateChange(wizard,false);	
				}

				statusDisplay.html(status);
				$('#items-list').hide();
				$('#edit-item').show();
			}
		}else{
			var parseCampaigns =  function(data){
				console.log('campaigns data from server: ');
				console.log(data);
				var tbody = $('#tbl-campaigns > tbody');
				var aaData = [];
				$.each(data,function(index,i){
					var status;
					if(i.isTerminated==1){status='<span class="label label-danger">הסתיים</span>';}
					else{status = '<span class="label label-success">פעיל</span>';}
					var editCell = '<button class="btn default btn-xs edit" data-id="'+i.id+'">Edit</button>';
					var item = [i.name,i.category,i.createdAt,status,editCell];
					aaData.push(item);
				});
				loadDataTable('#tbl-campaigns', aaData);
				$('#edit-item').hide();
				$('#items-list').show();

				
			}
		}
		
		$.ajax({
			type: "get",
			url: '/api/campaigns/'+managerId+'/'+id,
			success: parseCampaigns
		});
}

function initCampaings(){
   App.init();
   FormComponents.init();
   FormWizard.init();
   $('.toggle').parent().bootstrapSwitch();

   $('select#locationBase').on('change',function(){
	$('#localMinTimeGap-input').hide();
	if($(this).val()=='0'){
		$('#localMinTimeGap-input').show();
	}
	});	
	$('select#recurring').on('change',function(){
		$('#dayOfWeek-input').show();
		if($(this).val()=='1'){
			$('#dayOfWeek-input').show();
		}
	});	
	//TODO the 2 above can be made one function

	$('#btn-all-items').on('click',function(){ //TODO add dynamic managerId
			loadCampaigns(1);
	}); 
	//Add new campaign:
	$('#add-new-campaign:not(.creating-campaign)').on('click',function(){
		$(this).addClass('creating-campaign');
		$.ajax({
				type: "post",
				url: '/api/campaigns/1',	//TODO add dynamic managerId
				data: {},
				success: function(newId) {
					alert(newId);
					loadCampaigns(1,newId);	//TODO this could be made with just one call...					
					$('#campaigns-list').hide();
					$('#edit-campaign').show();
				}
			});
	});

	//save campaign:
	$('input#btn-activate-campaign').on('change',function(){
		var data = {};
		var wizard = $($(this).parents('#edit-item')[0]);
		var id= wizard.attr('data-id');
		var chbxInputs = wizard.find('input[type="checkbox"]');//all checkboxes are in tab3
		var textInputs = wizard.find('input[type="text"]');
		var selectInputs = wizard.find('select:not(.filter-attribute)');
		var textAreas = wizard.find('textarea');
		var filterCheckboxes = wizard.find('#campaign-filters input[type="checkbox"]');
		alert('saving');
		$.each(textInputs, function(index,i){
			i = $(i);
			if(!i.is(':disabled')){
				var fieldName = i.attr('name');
				data[fieldName]=i.val();
			}
		});
		$.each(chbxInputs, function(index,i){
			i = $(i);
			var fieldName = i.attr('name');
			data[fieldName]=i.is(':checked') ? 1 : 0;
		});
		
		$.each(selectInputs, function(index,i){
			i=$(i);
			var fieldName = i.attr('name');
			data[fieldName] = $(i.children('option:selected')[0]).attr('value');
			console.log('select found---'+fieldName);
		});		
		$.each(textAreas, function(index,i){
			i=$(i);
			var fieldName = i.attr('name');
			data[fieldName] = i.val();				
		});
		//Filters:
		var filtersData={};
		$.each(filterCheckboxes, function(index,v){
			v = $(v);
			if(v.is(':checked')){
				var attr = v.attr('data-attr');	
				var val = v.val();
				if(attr && val){
					if(!filtersData[attr]){
						filtersData[attr]=[];	
					}
					filtersData[attr].push(val);
				}	
			}			
		});
		data['filters']=JSON.stringify(filtersData);
		console.log('data before send to update:');
		console.log(data);
		if(id>0){
			console.log('ajax');
			$.ajax({
				type: "post",
				url: '/api/campaigns/1/'+id,	//TODO add dynamic managerId
				data: data,
				success: function(response) {
					console.log(response);
					loadCampaigns(1,id);
					//TODO add an "saved" notification
				}
			});
		}
	});

	$('#tbl-campaigns').on('click','.edit',function(){
		var campaignId = $(this).attr('data-id');
		loadCampaigns(1,campaignId);
	});
	
	//load single campagin
	loadCampaigns(1);
}

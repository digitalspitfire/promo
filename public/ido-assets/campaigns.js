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

function loadDataTableCampaigns(selector,aaData){
	if($(selector).hasClass('initialized')){
		oTable.fnDestroy();
	}
	oTable = $(selector).addClass('initialized').dataTable( {
		"aaData":aaData,
		"bFilter": true,
		"bInfo": false,
		"bPaginate": false,
		"oLanguage": {
			 "sSearch": "חיפוש: ",
			 "sZeroRecords": "לא נמצאו תוצאות"
		},
		"aoColumns": [
		{ "asSorting": [ "desc", "asc"],"sWidth":"30%" },
		{ "asSorting": [ "desc", "asc"],"sWidth":"30%" },
		{ "asSorting": [ "desc", "asc"],"sWidth":"10%" },
		{ "asSorting": [],"sWidth":"10%" },
		{ "asSorting": [ "desc", "asc"],"sWidth":"10%" },
		{ "asSorting": [],"sWidth":"10%" }
		]
	});	
}
function modifyCampaignOptions(){//According to the mangers info
	if(manager.roostConfKey.trim()=='' || manager.roostGeoLoc.trim()=='' || manager.roostSecretKey.trim()==''){
		$('select#locationBase option[value=1]').remove();
	}
	if(!(manager.nodes.length>0)){
		$('select#locationBase option[value=0]').remove();
	}	
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
					
					str+='<a class="accordion-toggle" data-toggle="collapse" data-parent="#campaign-filters" href="#collapse_'+attrIndex+'">';
					str+='<i class="fa fa-angle-down"></i>';
					str+='<i class="fa fa-angle-up"></i>';
					str+=a+'</a>';
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
						str+='<label> ( '+percentage+'% )<input type="checkbox" class="filter-value" value="'+val+'" data-attr="'+a+'">'+val+'</label>';
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
				
				modifyCampaignOptions()
				
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
					else{status = '<span class="label label-success status-active">פעיל</span>';}
					var editCell = '<a class="btn default btn-sm edit" data-id="'+i.id+'"><i class="fa fa-edit"></i> לקמפיין</a>';
					var arrDate = i.createdAt.split('T')[0].split('-');
					if(i.sent){
						var sent = JSON.parse(i.sent);
						var totalPublishCount = parseInt(sent.sms) + parseInt(sent.roost);	
					}else{
						var totalPublishCount = 0
					}
					var createdAt = arrDate[2]+'-'+arrDate[1]+'-'+arrDate[0];
					var item = [i.name,i.category,createdAt, totalPublishCount,status,editCell];
					aaData.push(item);
				});
				loadDataTableCampaigns('#tbl-campaigns', aaData);
				$('#edit-item').hide();
				$('#items-list').show();

				
			}
		}
		
		/*$.ajax({
			type: "get",
			url: '/api/campaigns/'+managerId+'/'+id,
			success: parseCampaigns
		});*/
		aGet('/api/campaigns/'+managerId+'/'+id, parseCampaigns);
}

function initCampaings(){
   App.init();
   FormComponents.init();
   FormWizard.init('#form-wizard-campaigns');   
   $('.toggle').parent().bootstrapSwitch();
   //load single campagin
   loadCampaigns(1);
   console.log('initCampaings');
   console.log(toolTips);
   generateToolTipsFromDb(toolTips['campaigns']);
}
var notifications = {
	empty : function(input){
		if($(input).val().trim()=="" || $(input).val().trim()== null){

		}
	}
}
var notifications={
	category : {
		isRequired: function(val){
			if(val){return false;}
			else{return true;}
		},
		name: 'category',
		text: 'שדה קטגוריה ריק! האם להמשיך בכל זאת?'
		},
	goals:{
		isRequired: function(val){
			if(val){return false;}
			else{return true;}
		},
		name: 'goals',
		text: 'שדה יעדים נשאר ריק ! האם להמשיך בכל זאת?'
	},
}

function notificationsApproved(currentWizard, tab, nextSelector){
	if( !($.isEmptyObject(notifications)) ){
		$.each(notifications, function(name,obj){
			var input = $(currentWizard).find('input[name='+name+']');
			if(input){
				var val = input.val();
				if( notifications[name].isRequired(val) ){
					var notification = $.extend(notifications[name], {currentWizard:currentWizard, tab:tab, nextSelector:nextSelector});
					$.confirm(notification);
					return false; //get out of the loop
				}else{}	
			}
		});	
		return false;
	}else{return true} //do nothing the next function will be called.... which is handle title
}


$(function(){
	$('body').on('click','#btn-all-campaigns',function(){loadCampaigns(1);});
	$('body').on('click','#add-new-campaign:not(.now-creating)',function(){
		var button = $(this);
		button.addClass('now-creating');
		aPost('/api/campaigns/1',{},function(newId) {
			loadCampaigns(1,newId);	//TODO this could be made with just one call...					
			button.removeClass('now-creating');
			$('#campaigns-list').hide();
			$('#edit-campaign').show();
		});
	});
	$('body').on('click','#tbl-campaigns .edit',function(){
		var campaignId = $(this).attr('data-id');
		loadCampaigns(1,campaignId);
	});
	/*Handlers inside the wizard:*/
	//save campaign:
	$('body').on('change','input#btn-activate-campaign',function(){
		if($(this).hasClass('returning-switch')){//Check if returning switch
			$(this).removeClass('returning-switch');
		}else{ //perform the validation and update
			var data = {};
			var wizard = $($(this).parents('#edit-item')[0]);
			var id= wizard.attr('data-id');
			var chbxInputs = wizard.find('input[type="checkbox"]');//all checkboxes are in tab3
			var textInputs = wizard.find('input[type="text"]');
			var selectInputs = wizard.find('select:not(.filter-attribute)');
			var textAreas = wizard.find('textarea');
			var filterCheckboxes = wizard.find('#campaign-filters input[type="checkbox"]');
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
				if ($('#submit_form').valid()){
					console.log('valid');
					aPost('/api/campaigns/1/'+id,data,function(response) {
						console.log(response);		
						var alertSuccess = wizard.find('.form-actions .alert-success');
						alertSuccess.addClass('visible');
						setTimeout(function(){alertSuccess.removeClass('visible'); /*loadCampaigns(1,id);*/},2000);
						
						//TODO add an "saved" notification
					});
				}else{
					$(this).addClass('returning-switch');
					$('input#btn-activate-campaign').parent().parent().bootstrapSwitch('toggleState');
				}
			}
		}
	});
	$('body').on('change','select#recurring',function(){
		$('#dayOfWeek-input').show();
		if($(this).val()=='1'){
			$('#dayOfWeek-input').hide();
		}
	});	
	$('body').on('change','select#locationBase',function(){
		$('#localMinTimeGap-input').hide();
		if($(this).val()=='0'){
			$('#localMinTimeGap-input').show();
		}
	});	
	$('body').on('change','input#isRecruiting',function(){
		if($(this).is(':checked')){
			$('select#locationBase').val(2);
			$('select#locationBase').change();
			$('select#locationBase option:not(:selected)').hide();	
		}else{
			$('select#locationBase option').show();	
		}
		
	});	

	//campaign filter accordions:
	$('body').on('change','#campaign-filters input[type="checkbox"]', function(){
		if($(this).is(':selected')){
			$(this).closest('.panel-heading').addClass('filtered-attribute');
		}else{
			var values = [];
			values = $(this).parent().parent().find('input[type=checkbox]:checked');
			if( !(values.length>0) ){
				$(this).closest('.panel-heading').removeClass('filtered-attribute');	
			}
		}
	});
	//temp
		/*$('body').on('click','input#btn-activate-campaign',function(e){alert('b');});*/
});

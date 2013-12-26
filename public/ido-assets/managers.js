function loadDataTableManagers(selector,aaData){
	var options = {
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
	};
	if($(selector).hasClass('initialized')){
		oTable.fnDestroy();
	}
	oTable = $(selector).addClass('initialized').dataTable(options);	
	
}
function addNewNode(nodeMac){
	var str ='<div class="form-group">';
	str +='<label class="control-label col-md-3">Node MAC</label>';
	str +='<div class="col-md-4">';
	str +='<input type="text" placeholder="Node MAC" class="form-control node-mac" value="'+nodeMac+'"/>';
	str +='</div>';
	str +='</div>';
	$('#portlet_tab3').append(str);
}
function loadManagers(managerId){
		var id = managerId ? managerId : '';
		if(id){
			var parseManagers = function(data){
				var wizard = $('#edit-item');
				wizard.attr('data-id',managerId);
				var textInputs = wizard.find('input[type="text"]:not(.node-mac)');

				//Manager data:
				$.each(textInputs, function(index,i){
					i = $(i);
					var fieldName = i.attr('name');
					i.val(data[fieldName]);
				});
				//Nodes:
				$('#portlet_tab3 .form-group:not(.btn-add-node)').remove();
				$.each(data.nodes, function(i,n){
					addNewNode(n);
				});
				$('#items-list').hide();
				$('#edit-item').show();			
			}
		}else{			
			var parseManagers =  function(data){
				var tbody = $('#tbl-managers > tbody');				
				var aaData = [];
				$.each(data,function(i,m){
					var editCell = '<button class="btn green btn-sm edit" data-id="'+m.id+'"><i class="fa fa-edit"></i> עריכה</button>';
					/*var deleteCell = '<button class="btn red mini btn-sm delete" data-id="'+m.id+'"><i class="fa fa-ban"></i> מחיקה</button>';*/
					var manager = [m.vendorName,m.name,m.phoneNumber,m.email,editCell];
					aaData.push(manager);
				});
				loadDataTableManagers('#tbl-managers', aaData);
				$('#managers-table a.edit').removeClass('now-getting');
				$('#edit-item').hide();
				$('#items-list').show();
			}
		}
		aGet('/api/managers/'+id , parseManagers);
	}

function initManagers(){
    App.init();
    FormComponents.init();
	loadManagers();
	

	var error = $('#edit-item form .alert-danger');
	var success = $('#edit-item form .alert-success');
	$('#edit-item form').validate({
        doNotHideMessage: true,
        errorElement: 'span', //default input error message container
        errorClass: 'help-block', // default input error message class
        focusInvalid: true, // do not focus the last invalid input
        rules: {
            vendorName: {
                required: true,
                minlength:1
            },
        },
        invalidHandler: function (event, validator) { //display error alert on form submit   
            error.show();
            App.scrollTo(error, -200);
        },
        highlight: function (element) { // hightlight error inputs
            console.log('hightlight');
            console.log(element);
            success.hide();
            $(element)
                .closest('.form-group').addClass('has-error'); // set error class to the control group

                
        },
        success: function (label) {
            label.closest('.form-group').removeClass('has-error');
            label.remove();
            error.hide();
            success.show();
        },
        errorPlacement: function (error, element) {
            console.log('errorPlacement');
            console.log(element);
            error.insertAfter(element);
        },

        submitHandler: function (form) {
            form.submit(); // form validation success, call ajax form submit
        }
    });
}

$(function(){
	//all items
	$('body').on('click','#btn-all-managers',function(){loadManagers();}); 
	//Add new manager:
	$('body').on('click','#add-new-manager:not(.creating-manager)',function(){
		var button = $(this);
		$(this).addClass('creating-manager');
		aPost('/api/managers',{},function(newId) {
			button.removeClass('creating-manager');
			loadManagers(newId);	//TODO this could be made with just one call...					
			$('#items-list').hide();
			$('#edit-item').show();
		});
	});
	//save manager:
	$('body').on('click','#btn-save-manager',function(){			
		if($('#edit-item form').valid()== false){
			return false;
		}else{
			var data = {};
			var wizard = $($(this).parents('#edit-item')[0]);
			var id= wizard.attr('data-id');
			var textInputs = wizard.find('input[type="text"]:not(.node-mac)');
			var nodeMacs = wizard.find('input.node-mac[type="text"]');
			var chbxInputs = wizard.find('input[type="checkbox"]');

			var selectInputs = wizard.find('select');
			var textAreas = wizard.find('textarea');
			var chbxFilters = wizard.find('#campaign-filters input[type="checkbox"]');
			$.each(textInputs, function(index,i){
				i = $(i);
				if(!i.is(':disabled')){
					var fieldName = i.attr('name');
					data[fieldName]=i.val();
				}
			});
			//Nodes:
			var nodes=[];//TODO
			$.each(nodeMacs, function(index,i){
				i = $(i);
				if(!i.is(':disabled')){
					var val = i.val();
					if( nodes.indexOf(val)<=-1 ){
						nodes.push(val);
					}
				}
			});
			data.nodes=nodes;
			if(id>0){
				aPost('/api/managers/'+id,data,function(response) {  //TODO add here if response == 'daved succefully'
					var alertSuccess = wizard.find('.form-actions .alert-success');
					alertSuccess.addClass('visible');
					setTimeout(function(){alertSuccess.removeClass('visible');},2000);
					loadManagers(id);
				});
			}
		}
	});
	//add node
	$('body').on('click','#btn-add-node',function(){
		addNewNode('');
	});
	//delete manger:
	$('body').on('click','#tbl-managers button.delete:not(now-deleting)',function(){
		var c = confirm('למחוק מנהל זה?');
		if(c){
			var button = $(this);
			$(this).addClass('now-deleting');
			var id=$(this).attr('data-id');
			aDelete('/api/managers/'+id,function(){
				button.parents('tr')[0].remove();
			});	
		}	
	});
	//edit manger:
	$('body').on('click','#tbl-managers button.edit:not(.now-getting)',function(){
		$(this).addClass('now-getting');
		var managerId = $(this).attr('data-id');
		loadManagers(managerId);
	});
});



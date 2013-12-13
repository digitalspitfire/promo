function initDataUpload(){
	App.init();
	FormWizard.init();
	FormComponents.init();
	
	var options ={
		success: nextStep
	};
	$('#upload-data-form').ajaxForm(options);
	$('#btn-upload-file').click(function(){
		alert('a');
		$('#upload-data-form').ajaxSubmit();    	
	});
	$('.button-next').on('click',function(){
		var currentStep = $('ul.steps li.active a .number').html();
		wiz['step'+currentStep]();
	});
}
function nextStep(){
	$('#temp').hide();
	
	$('li.active').next('li').children('a').trigger('click');
	$.ajax({
		type: "get",
		url: '/api/getCsvHeaders/1',				
		success: function(response){
			if(!response){response='empty';}
			console.log('columns received: '+response);
			$.each(response, function(i,h){
				//debugger;
				var strRadios = '<option name="cellular-column" value="'+i+'">'+h+'</option>';
				$('#select-cellular-column').append(strRadios);
				var strChbks = '<label><input type="checkbox" value="'+i+'">'+h+'</label>';
				$('#checkboxes-attributes').append(strChbks);
			});
			App.init();
			FormComponents.init();
		}	
	});
};

function displayData(){
	alert('displayData');
	var cellularColumn = $("#select-cellular-column").val();
	var selectedColumns='';
	selectedColumns = $('#checkboxes-attributes input[type=checkbox]:checked').map(function(){
        return $(this).val();
    }).get();
    console.log('cel col before send: '+cellularColumn);
    console.log('selected cols before send: '+selectedColumns);
    console.log(selectedColumns.indexOf(cellularColumn));
    if(!cellularColumn){alert('חובה לבחור שדה סללורי'); return false;}
    if(!(selectedColumns.indexOf(cellularColumn) > -1)){alert('עמודת מאפיין סללורי חייבת להיבחר'); return false;}

    $.ajax({
		type: "post",
		url: '/api/presentData/1',				
		data: {celCol: cellularColumn,selectedCols:selectedColumns},
		success: function(rows){
			
			var aaData = [];
			var aoColumns = [];
			$.each(rows,function(i,r){
				if(i==0){
					$.each(r,function(j,c){
						aoColumns.push({'sTitle':c});
					});
				}else{
					aaData.push(r);
				}
			});

			oTable = $('#tbl-users-data').addClass('initialized').dataTable( {
				"aaData":aaData,
				"aoColumns":aoColumns,
				"bFilter": true,
				"bInfo": false,
				"bPaginate": false,
				"oLanguage": {
					 "sSearch": "חיפוש: ",
					 "sZeroRecords": "לא נמצאו תוצאות"
				}
			});	
			console.log('organized data:');
			console.log(rows);
			/*$.each(rows, function(i,r){						
				if(i==0){
					var dataRow = '<tr>';
					$.each(r, function(j,c){								
						dataRow +='<td>'+c+'</td>';
					});
					dataRow += '</tr>';
					$('#tbl-present-data thead').html(dataRow);
				}else{
					var dataRow = '<tr>';
					$.each(r, function(j,c){								
						dataRow +='<td>'+c+'</td>';
					});
					dataRow += '</tr>';
					$('#tbl-present-data tbody').append(dataRow);
				}
			});
			$('#data-upload .portlet-body .control-group').hide();
			$('#data-upload .portlet-body .control-group#data-present').show();*/
		}	
	});
}




var wiz={
	step2 : displayData
}

function initDataUpload(){		
	App.init();
	FormWizard.init();
	FormComponents.init();
}
function uploadDataFile(){
	var options ={ success:getCsvHeaders };
	$('#upload-data-form').ajaxForm(options);
	$('#upload-data-form').submit();

}
function getCsvHeaders(){
	aGet('/api/getCsvHeaders/1',function(response){
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
		$('#temp').hide();
	});
};

function displayData(){
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

    aPost('/api/presentData/1',
    	{celCol: cellularColumn,selectedCols:selectedColumns},
    	function(rows){	
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
		}
    );
    /*$.ajax({
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
		}	
	});*/
}


//NOTE we take -1 step since the wizard move forward before my handler:
var wiz={
	step1 : uploadDataFile,
	step2 : displayData
}
$(function(){
	$('body').on('click','.row#data-file-upload .button-next',function(){
		var all = $('ul.steps li.active a .number');		
		var currentStep = $('ul.steps li.active a .number').html();
		currentStep=parseInt(currentStep)-1;
		/*alert('currentStep: '+currentStep);*/
		wiz['step'+currentStep]();
	});
	$('body').on('click','.row#data-file-upload .button-submit',function(){
		var button = $(this);
		var form = $(this).closest('.form-wizard');
		aGet('/api/update-users-data/1',function(response){
			console.log(response);
			form.find('.tab-content').html('<h2 style="text-align: center;">הנתונים עודכנו בהצלחה :))</h2>');
			form.find('.form-actions a').hide();
		});
	});
	/*upload data file form:*/	
	$('body').on('click','#btn-fileInput',function(){$('#dataFile').click();});
	$('body').on('change','#dataFile',function(){
		$('label[for=btn-fileInput]').html(this.files[0].name);
	});
	$('body').on('click','#btn-cancel',function(){
		emptyDashboard();
	});

	
});
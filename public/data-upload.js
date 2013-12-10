if(getParameterByName('uploaded')=='true'){
			
			$('#data-upload .portlet-body .control-group').hide();
			$('#data-upload .portlet-body .control-group#data-settings').show();
			
			$.ajax({
				type: "get",
				url: '/api/getCsvHeaders/1',				
				success: function(response){
					if(!response){response='empty';}
					console.log('columns received: '+response);
					$('#cellular-column').html('<div class="input-line-holder">מאפיין סללורי</div>');
					$('#selected-columns').html('<div class="input-line-holder">עמודות רצויות</div>');
					$.each(response, function(i,h){
						var strRadios = '<div class="input-line-holder"><label class="radio"><input type="radio" name="cellular-column" value="'+i+'" />'+h+'</label></div>';
						$('#cellular-column').append(strRadios);
						var strChbks = '<div class="input-line-holder"><label class="checkbox"><input type="checkbox" name="selected-columns" value="'+i+'" />'+h+'</label></div>';
						$('#selected-columns').append(strChbks);
					});
				}	
			});
		}
		$('#btn-upload-file').on('click',function(){$('#form-data-file-upload').submit();});

		$('#btn-present-data').on('click',function(){
			var cellularColumn = $("#cellular-column input[type='radio']:checked");
			if (cellularColumn.length > 0) {cellularColumn = cellularColumn.val();}
			else{cellularColumn='';}
    		var selectedColumns='';
    		selectedColumns = $('#selected-columns input[type=checkbox]:checked').map(function(){
                return $(this).val();
            }).get();
            console.log('before send: '+cellularColumn);
            console.log('before send: '+selectedColumns);
            console.log(selectedColumns.indexOf(cellularColumn));
            if(!cellularColumn){alert('חובה לבחור שדה סללורי'); return false;}
            if(!(selectedColumns.indexOf(cellularColumn) > -1)){alert('עמודת מאפיין סללורי חייבת להיבחר'); return false;}

            $.ajax({
				type: "post",
				url: '/api/presentData/1',				
				data: {celCol: cellularColumn,selectedCols:selectedColumns},
				success: function(rows){
					
					console.log('organized data: '+rows);
					$.each(rows, function(i,r){						
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
					$('#data-upload .portlet-body .control-group#data-present').show();
				}	
			});
		});
		$('#btn-update-users-data').on('click',function(){
			$.ajax({
				type: "get",
				url: '/api/update-users-data/1',				
				//data: {celCol: cellularColumn,selectedCols:selectedColumns},
				success: function(rows){
					$('#data-upload .portlet-body .control-group').hide();
					$('#data-upload .portlet-body .control-group#data-upload-approve').show();
				}	
			});
		});
		$('.btn-restart-data-upload').on('click',function(){
			console.log(window.location.href);
			window.location.replace(window.location.href.split('?')[0]);
		});
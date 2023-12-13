sap.ui.define([], function () {
	"use strict";
	return {
		SaveSubmitStatusText:function(status){
			var count = 0;
			if(status == null || status == "" || status == undefined){
				return "Open";
			}
			else{
				status.split("#").forEach(index => {
					if (index !== "" && index != 'Approved') {
						count++;
					}
				})
			}
			if(count == 0){
				return "Approved";
			}else{
				return "Inprogress";
			}
		},
		HoursValue:function(val){
			if(val == null || val == undefined || val == ""){
				return 0;
			}
			else{
				return val;
			}
		}
	};
});

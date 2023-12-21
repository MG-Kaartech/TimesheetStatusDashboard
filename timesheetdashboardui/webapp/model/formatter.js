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
				return "0";
			}
			else{
				return val;
			}
		},
		Status: function (val) {
			if (val === "Approved" || val === "Executed") {
				return "Success";
			}
			else if (val === "Rejected" || val === "Not Executed") {
				return "Error"
			}
			else if (val === "Saved" || val === "Submitted" || val === "Submited") {
				return "Information"
			}
			else {
				return "Warning";
			}
		},
		PayrollApprStatusName: function (val) {
			if (val == "Executed") {
				return "Executed";
			}
			else {
				return "Not Executed";
			}
		},
		ValueCheckName:function(val){
			if(val == "" || val== null || val == "null" || val == undefined){
				return "N/A";
			}
			else{
				return val;
			}
		},
	};
});

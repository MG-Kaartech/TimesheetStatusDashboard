sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    "com/mgc/timesheetdashboardui/model/formatter",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, Filter, FilterOperator, Fragment, JSONModel, Token,formatter) {
        "use strict";

        return Controller.extend("com.mgc.timesheetdashboardui.controller.View1", {
            formatter: formatter,
            onInit: function () {
                sap.ui.core.BusyIndicator.show(-1);
                var valueHelpModel = new JSONModel();
                valueHelpModel.setSizeLimit(100000);
                this.getView().setModel(valueHelpModel, "valueHelp");
                var oModel = this.getOwnerComponent().getModel();
                var oDataModel = new sap.ui.model.odata.ODataModel(oModel.sServiceUrl);
                var batchOperation0 = oDataModel.createBatchOperation("/Employees?$format=json", "GET");
                var batchArray = [batchOperation0];
                oDataModel.addBatchReadOperations(batchArray);
                oDataModel.submitBatch(function (oResult) {
                    try {
                        this.getView().getModel("valueHelp").setProperty("/emp", oResult.__batchResponses[0].data.results);
                    } catch (err) { }
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this), function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this.getResourceBundle().getText("errorBatch"));
                }.bind(this));
            },
            onSearch: function () {
                const stdate = this.getView().byId("idStDate").getDateValue();
                const fndate = this.getView().byId("idFnDate").getDateValue();
                const resInput = this.getView().byId("resInput").getTokens();
                if (stdate == null || fndate == null || resInput.length === 0) {
                    MessageBox.error("Enter all Mandatory fields");
                    return;
                }
                const diffTime = Math.abs(stdate - fndate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // console.log(diffTime + " milliseconds");
                console.log(diffDays + " days");
                if (diffDays > 7) {
                    MessageBox.error("Max 7 days is the range");
                    return;
                }
                var oFilterValues = [];
                this.getView().byId("timesheetDashboard").setBusy(true);
                /// Filters for Service call
                // Date Selection
                var DateRange = new sap.ui.model.Filter({
                    path: "Date",
                    operator: sap.ui.model.FilterOperator.BT,
                    value1: this.getView().byId("idStDate").getValue(),
                    value2: this.getView().byId("idFnDate").getValue()
                });
                oFilterValues.push(DateRange);
                // Resource Selection Selection
                for (let i = 0; i < resInput.length; i++) {
                    var oResource = new sap.ui.model.Filter({
                        path: "EmployeeID",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: resInput[i].getText()
                    });
                    oFilterValues.push(oResource);
                }
                this.getOwnerComponent().getModel().read("/TimeSheetDetails", {
                    filters: oFilterValues,
                    urlParameters:{"$select" : "Date,EmployeeID,EmployeeName,TotalHours,SaveSubmitStatus"},
                    sorters: [
                        new sap.ui.model.Sorter("Date", /*descending*/false) // "Sorter" required from "sap/ui/model/Sorter"
                    ],
                    success: function (odata) {
                        if (odata.results.length == 0) {
                            MessageBox.error("Data not available selection filters");
                        }
                        else {

                            let unique1 = [...new Set(odata.results.map(item => item.EmployeeID))];
                            let unique2 = [...new Set(odata.results.map(item => item.Date))];
                            this.arrangeData(odata.results, unique1, unique2);
                        }
                        let unique = [...new Set(odata.results.map(item => item.Date))];
                        console.log(unique);
                        this.arrangeColData(unique);
                        this.getView().byId("timesheetDashboard").setBusy(false);
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error(this.getResourceBundle().getText("errorTimesheet"));
                    }.bind(this)
                });
            },
            arrangeColData: function (unique) {
                var that = this;
                const dates = [];
                for (var i = 0; i < unique.length; i++) {
                    var obj = {};
                    obj.date = unique[i];
                    dates.push(obj);
                }
                dates.unshift({"date":"Employee Name"})
                dates.unshift({"date":"Employee ID"})
                that.getView().getModel("valueHelp").setProperty("/Columns", dates);
            },
            handleValueHelp: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                // create value help dialog
                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.mgc.timesheetdashboardui.fragment.ResourcesF4Help",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    // create a filter for the binding
                    oValueHelpDialog.getBinding("items").filter([new Filter(
                        "FirstName",
                        FilterOperator.Contains,
                        sInputValue
                    )]);
                    // open value help dialog filtered by the input value
                    oValueHelpDialog.open(sInputValue);
                });
            },
            arrangeData: function (oData, unique1, unique2) {
                var finalArray = [];
                for (var i = 0; i < unique1.length; i++) {
                    var obj = {};
                    for (var j = 0; j < unique2.length; j++) {
                        obj.EmployeeID = unique1[i];
                        var TotalHours = 0;
                        var Status = "";
                        for (var k = 0; k < oData.length; k++) {
                            if (oData[k].EmployeeID == unique1[i] && oData[k].Date == unique2[j]) {
                                if (j == 0) {
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status1 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours1 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                                else if (j == 1) {
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status2 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours2 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                                else if (j == 2) {
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status3 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours3 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                                else if (j == 3) {
                                    //obj.status4 = oData[k].SaveSubmitStatus;
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status4 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours4 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                                else if (j == 4) {
                                    //obj.status5 = oData[k].SaveSubmitStatus;
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status5 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours5 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                                else if (j == 5) {
                                    //obj.status6 = oData[k].SaveSubmitStatus;
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status6 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours6 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                                else if (j == 6) {
                                    //obj.status7 = oData[k].SaveSubmitStatus;
                                    Status = Status +"#"+oData[k].SaveSubmitStatus;
                                    obj.status7 = Status;
                                    TotalHours += Number(oData[k].TotalHours);
                                    obj.hours7 = TotalHours;
                                    obj.EmployeeName = oData[k].EmployeeName;
                                }
                            }
                        }
                    }
                    finalArray.push(obj);
                    console.log(finalArray);
                }
                this.getView().getModel("valueHelp").setProperty("/Rows", finalArray);
                this.getView().getModel("valueHelp").refresh();
            },
            _handleValueHelpSearch: function (evt) {
                var sValue = evt.getParameter("value");
                var FirstName = new Filter(
                    "FirstName",
                    FilterOperator.Contains,
                    sValue
                );
                var LastName = new Filter(
                    "LastName",
                    FilterOperator.Contains,
                    sValue
                );
                var EmployeeID = new Filter(
                    "ID",
                    FilterOperator.Contains,
                    sValue
                );
                var filters = new sap.ui.model.Filter([FirstName, LastName, EmployeeID]);
                evt.getSource().getBinding("items").filter(filters, "Appliation");
            },
            _handleValueHelpClose: function (evt) {
                var aSelectedItems = evt.getParameter("selectedItems"),
                    oMultiInput = this.byId("resInput");

                if (aSelectedItems && aSelectedItems.length > 0) {
                    aSelectedItems.forEach(function (oItem) {
                        oMultiInput.addToken(new Token({
                            text: oItem.getDescription()
                        }));
                    });
                }
            }
        });
    });

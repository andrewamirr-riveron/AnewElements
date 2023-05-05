/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog'],
    function (search, dialog) {

        var departmentobject = {};
        var classobject = {};
        var deparmenttranslation = {};
        var classtranslation = {};

        function pageInit(context) {
            //perform a aysnc search to get the project's class, location, and department
            search.create.promise({
                type: "department",
                filters:
                    [
                        ["custrecord_fin_dept_class", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "custrecord_fin_dept_class",
                            label: "Related Class"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_FIN_DEPT_CLASS",
                            label: "Internal ID"
                        })
                    ]
            }).then(function (searchObj) {
                searchObj.run().each(function (result, index) {
                    var departmentId = result.getValue({
                        name: 'internalid'
                    });
                    var relatedclassId = result.getValue({
                        name: 'internalid',
                        join: 'CUSTRECORD_FIN_DEPT_CLASS'
                    });
                    var departmentname = result.getValue({
                        name: 'name'
                    });
                    var classname = result.getText({
                        name: 'custrecord_fin_dept_class'
                    });
                    departmentobject[departmentId] = relatedclassId;
                    deparmenttranslation[departmentId] = departmentname;
                    classobject[relatedclassId] = classobject[relatedclassId] || [];
                    classobject[relatedclassId].push(departmentId);
                    classtranslation[relatedclassId] = classname;

                    return true
                });

                return;
            }).catch(function (reason) {
                alert(reason);
            });
        }

        function validateField(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            if (sublistFieldName === 'department') {
                //get the department
                var department = currentRecord.getValue({
                    fieldId: 'department'
                });
                if(sublistName)
                {
                    department = currentRecord.getCurrentSublistValue({
                        fieldId: 'department',
                        sublistId: sublistName
                    });
                }
                if(!department)
                {
                    return true;
                }
                //get the class field
                var classname = currentRecord.getValue({
                    fieldId: 'class'
                });
                if(sublistName)
                {
                    classname = currentRecord.getCurrentSublistValue({
                        fieldId: 'class',
                        sublistId: sublistName
                    });
                }
                if (classname) {
                    //check if the class name is correct
                    if (departmentobject[department] != classname) {
                        var validdepartment = classobject[classname];

                        validdepartment = validdepartment.filter(function(elem,index,self){
                            return self.indexOf(elem) == index;
                        }).map(function(element){
                            return deparmenttranslation[element];
                        });
                        validdepartment = validdepartment.join(' | ');

                        dialog.alert({
                            title: 'Invalid Department Selection',
                            message: 'You have selected an incorrect department class combination. Please update the department to ' + validdepartment + '.'
                        }).then(function(){
                            console.log("Validation Logged");
                            return false;
                        }).catch(function(reason){
                            alert(reason);
                        });
                        if(sublistName)
                        {
                            //set the department name
                            currentRecord.setCurrentSublistValue({
                                fieldId: 'department',
                                value: '',
                                ignoreFieldChange: true,
                                sublistId: sublistName
                            });
                        }
                        else {
                            //set the department name
                            currentRecord.setValue({
                                fieldId: 'department',
                                value: '',
                                ignoreFieldChange: true
                            });
                        }
                        return false;
                    } else {
                        return true;
                    }



                } else {
                    if (departmentobject[department]) {
                        if(sublistName)
                        {
                            //set the class name
                            currentRecord.setCurrentSublistValue({
                                fieldId: 'class',
                                value: departmentobject[department],
                                ignoreFieldChange: true,
                                sublistId: sublistName
                            });
                        } else {
                            //set the class name
                            currentRecord.setValue({
                                fieldId: 'class',
                                value: departmentobject[department],
                                ignoreFieldChange: true
                            });
                        }
                    }
                    return true;

                }
            } else if (sublistFieldName === 'class') {
                //get the department
                var department = currentRecord.getValue({
                    fieldId: 'department'
                });
                if(sublistName)
                {
                    department = currentRecord.getCurrentSublistValue({
                        fieldId: 'department',
                        sublistId: sublistName
                    });
                }
                //get the class field
                var classname = currentRecord.getValue({
                    fieldId: 'class'
                });
                if(sublistName)
                {
                    classname = currentRecord.getCurrentSublistValue({
                        fieldId: 'class',
                        sublistId: sublistName
                    });
                }
                if(!classname)
                {
                    return true;
                }
                if (department) {
                    //check if the class name is correct
                    if (!classobject[classname].some(function(elem){
                        return elem == department;
                    })) {
                        dialog.alert({
                            title: 'Invalid Department Selection',
                            message: 'You have selected an incorrect department class combination. Please update the class to ' + classtranslation[departmentobject[department]] + '.'
                        }).then(function(){
                            console.log("Validation Logged");
                            return false;
                        }).catch(function(reason){
                            alert(reason);
                        });
                        if(sublistName)
                        {
                            currentRecord.setCurrentSublistValue({
                                fieldId: 'class',
                                value: '',
                                ignoreFieldChange: true,
                                sublistId: sublistName
                            });
                        } else {
                            currentRecord.setValue({
                                fieldId: 'class',
                                value: '',
                                ignoreFieldChange: true
                            });
                        }
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }

        function fieldChanged(context) {

        }
function saveRecord(scriptContext) {
        
        var curRecord = scriptContext.currentRecord;
            //gets the line count for the sales team subtab
            var salesTeamLineCount = curRecord.getLineCount({
                sublistId: 'salesteam'
            });


            var checkForPrimary;
            var hasPrimary = false;
            //loops through all of the salesteam subtab lines to validate if a primary sales rep is selected.
            for (var i = 0; i < salesTeamLineCount; i++){
                    var checkForPrimary = curRecord.getSublistValue({
                        sublistId: 'salesteam',
                        fieldId: 'isprimary',
                        line: i                    
                    });
                    //if a primary sales rep is found, exit the loop
                   
                    
                    if ( checkForPrimary == true){
                        hasPrimary = true
                    }
            }
            //if there are no sales reps entered under the salesteam subtab
            //throw an error message stating 'Please enter at least one sales rep before saving'

            if (salesTeamLineCount < 1){
               alert("Please enter at least one sales rep before saving.");
               return false;
            } 

            else if (!hasPrimary){
                alert('Please mark one of your sales reps as the primary sales rep.');
                return false;
            }

            else{
                return true
            }
    }
        return {
            //pageInit: pageInit,
            //validateField: validateField,
            //fieldChanged: fieldChanged,
          	saveRecord: saveRecord
        };
    }
);
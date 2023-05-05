/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/search'],
/**
 * @param {email} email
 * @param {error} error
 * @param {file} file
 * @param {format} format
 * @param {record} record
 * @param {redirect} redirect
 * @param {runtime} runtime
 * @param {search} search
 * @param {task} task
 */
function(record, runtime, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */

    function execute(scriptContext) {
        //passes in the saved search parameter
      
      var poValidateSearch = runtime.getCurrentScript().getParameter("custscript_em_ss_line_validation");
        //loads the saved search
        var validationSearch = getAllSearchIdResults(poValidateSearch);
        //runs the search and gets the range
        //var searchRes = validationSearch.run().getRange(0,1);
        //loops through each of the returned seach results
        for(var i = 0; i < validationSearch.length; i++) {
            
            var result = validationSearch[i];
            //gets the 'id' of each search result
            var poId = result.getValue({
                    name: "internalid",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                    label: "Internal ID"
            });
            
            //gets the value of the line item number of each purchase order that needs to be closed
            var lineItemString = result.getValue({
                name: 'formulatext',
                formula: 'NS_CONCAT({lineuniquekey})',
                summary: 'MAX'
            });


           //splits the string of returned line items for each puchase order into an array
           var lineNumArray = lineItemString.split(',').sort();

           log.debug('lineNumArray',lineNumArray);
           //loads each purchase order
            var poRec = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: poId
            });
            //loops through each returned line item that needs to be closed

            var hasLocation = true;

            for (var j = 0; j < lineNumArray.length; j++) {
                
                var lineIndex = poRec.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: lineNumArray[j]
                    });

                log.debug("lineIndex",lineIndex);
                
                if(lineIndex != -1 ){
                    var locationValue = poRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: lineIndex
                    });

                    if (!locationValue){
                        hasLocation = false;
                        break;
                    }
                
                    poRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        line: lineIndex,
                        value: true
                    });
                }
            }        
            //save the record
                
            if(hasLocation === true){
                var poRecId = poRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('poRecId',poRecId);
            }
            else {
                log.audit('This Purhcase Order was skipped due to not having a mandatory location field set.')
            }
        }
    }

    

    function getAllSearchIdResults(srcid) {
        try {
            var nlobjSearch = search.load({
                id: srcid
            });
            nlobjSearch.isPublic = true;
            var searchResults = nlobjSearch.run()
            ,   bolStop   = false
            ,   intMaxReg = 1000
            ,   intMinReg = 0
            ,   result    = []
            ,   currentScript = runtime.getCurrentScript();
            
            if (searchResults) {
                while (!bolStop && currentScript.getRemainingUsage() > 50)
                {
                    // First loop get 1000 rows (from 0 to 1000), the second loop starts at 1001 to 2000 gets another 1000 rows and the same for the next loops
                    //  GOVERNANCE: 10 UNITS
                    var extras = searchResults.getRange({
                        start: intMinReg
                    ,   end: intMaxReg
                    });
                    result = result.concat(extras);
                    intMinReg = intMaxReg;
                    intMaxReg += 1000;
                    // If the execution reach the the last result set stop the execution
                    if (extras.length < 1000)
                    {
                        bolStop = true;
                    }
                }
            }
            
            return result;
        } catch (err) {
            log.debug('search result error', err.name + ' // ' + err.message);
        }
    }


    return {
        execute: execute
    };
    
});

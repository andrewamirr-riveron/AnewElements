/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/search'],

    function(record, serverWidget, runtime, search) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */



        //After Submit Function
        function updateCusotmerSubsidiary(scriptContext) {
            try {

                log.debug({
                    title: 'Script Start :::: Context Type::',
                    details: scriptContext.type
                });

                //Get the record data
                var scriptRec = scriptContext.newRecord;
				var custRecord = record.load({
					type: scriptRec.type,
					id: scriptRec.id
				})

                var recType = scriptRec.type;

                log.debug({
                    title: 'recType::',
                    details: recType
                });

                var primSubsidiary = custRecord.getValue({
                    fieldId: 'subsidiary'
                });


                var subsidiarySearch = search.load({
                    id: 'customsearch_subsidiary_for_customers'
                });

                var count = custRecord.getLineCount({
                    sublistId: 'submachine'
                });
                log.debug('count', count);


                var searchResultCount = subsidiarySearch.runPaged().count;
                log.debug("subsidiarySearch result count", searchResultCount);

                subsidiarySearch.run().each(function(result) {

                    // .run().each has a limit of 4,000 results
                    var subsId = result.id;
                    // var currency = result.getValue({
                    //     name: 'currency'
                    // });
                    var selectedLineNumber = custRecord.findSublistLineWithValue({
                        sublistId: 'submachine',
                        fieldId: 'subsidiary',
                        value: subsId
                    });
                    log.debug("selected line number", selectedLineNumber);

                    log.debug('subsId', subsId);

                    if (primSubsidiary != subsId && selectedLineNumber == -1) {
                        custRecord.insertLine({
                            sublistId: 'submachine',
                            line: count
                        });
                        log.debug("entered", count);

                        custRecord.setSublistValue({
                            sublistId: 'submachine',
                            fieldId: 'subsidiary',
                            value: subsId,
                            line: count
                        });
                    }



                    return true;
                });
				
				var flag = custRecord.save({
					ignoreMandatoryFields: true
				})
				log.debug('flag',flag);


            } catch (e) {
                log.error('An Error Occured while creating bill', e.toString());
            }
        }




        return {
            afterSubmit: updateCusotmerSubsidiary

        };
    });

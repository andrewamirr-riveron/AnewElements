/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'],

function(runtime) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    const ACH_CTX_FREE_TEXT_FORM = runtime.getCurrentScript().getParameter('custscript_sb805_fileformat');

    function pageInit(scriptContext) {
    	


        if(scriptContext.mode !== 'create' && scriptContext.mode !== 'edit'){
    		return;
    	}
    	
    	var currentRecord = scriptContext.currentRecord;

    	var current_form = currentRecord.getValue('custpage_2663_entity_file_format');

    	if(current_form && current_form == ACH_CTX_FREE_TEXT_FORM) {

            var bankNumber = currentRecord.getValue({
                fieldId: 'custrecord_2663_entity_bank_no'
            }).toString();

            log.debug('bankNumber', bankNumber);

            var countryCheck = bankNumber.substr(8);
            var bankCode = bankNumber.substr(5, 7);
            var procCode = bankNumber.substr(0, 4);

            if (bankNumber && bankNumber != '') {

                log.debug('Setting Codes');

                currentRecord.setValue({
                    fieldId: 'custrecord_2663_entity_country_check',
                    value: countryCheck
                });

                currentRecord.setValue({
                    fieldId: 'custpage_eft_custrecord_2663_entity_country_check',
                    value: countryCheck
                });

                currentRecord.setValue({
                    fieldId: 'custrecord_2663_entity_bank_code',
                    value: bankCode
                });

                currentRecord.setValue({
                    fieldId: 'custpage_eft_custrecord_2663_entity_bank_code',
                    value: bankCode
                });

                currentRecord.setValue({
                    fieldId: 'custrecord_2663_entity_processor_code',
                    value: procCode
                });

                currentRecord.setValue({
                    fieldId: 'custpage_eft_custrecord_2663_entity_processor_code',
                    value: procCode
                });
            }
        }
    }

    function fieldChanged(scriptContext){

        var currentRecord = scriptContext.currentRecord;

        var current_form = currentRecord.getValue('custpage_2663_entity_file_format');

        if(current_form && current_form == ACH_CTX_FREE_TEXT_FORM) {

            if (scriptContext.fieldId == 'custrecord_2663_entity_bank_no') {


                var bankNumber = currentRecord.getValue({
                    fieldId: 'custrecord_2663_entity_bank_no'
                }).toString();



                if (bankNumber && bankNumber != '') {

                    var countryCheck = bankNumber.substr(8);

                    var bankCode = bankNumber.substr(5, 7);

                    var procCode = bankNumber.substr(0, 4);

                    currentRecord.setValue({
                        fieldId: 'custrecord_2663_entity_country_check',
                        value: countryCheck
                    });

                    currentRecord.setValue({
                        fieldId: 'custpage_eft_custrecord_2663_entity_country_check',
                        value: countryCheck
                    });

                    currentRecord.setValue({
                        fieldId: 'custrecord_2663_entity_bank_code',
                        value: bankCode
                    });

                    currentRecord.setValue({
                        fieldId: 'custpage_eft_custrecord_2663_entity_bank_code',
                        value: bankCode
                    });

                    currentRecord.setValue({
                        fieldId: 'custrecord_2663_entity_processor_code',
                        value: procCode
                    });

                    currentRecord.setValue({
                        fieldId: 'custpage_eft_custrecord_2663_entity_processor_code',
                        value: procCode
                    });
                }
            }
        }
  }

    return {
    	pageInit: pageInit,
        fieldChanged:fieldChanged
    };
    
});

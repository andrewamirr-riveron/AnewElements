/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * Summary: Create Sales Order from Opportunity on Closed
 * Version      Date                Author                   Remarks
 1.00      3/4/2020       Christopher Cannata      Initial script created.
 */
define(['N/record', 'N/search', 'N/https', 'N/runtime', 'N/url'],
    function (record, search, https, runtime, url) {

        function autoCreateSalesOrder(context) {
            log.debug('Testing Start of User Event Script', 'Auto Create Sales Order from Closed Won & Sale Opportunity');
            // Get the current Oppurtunity record reference and record internal id
            var opportunityRecord = context.newRecord,
                opportunityID = opportunityRecord.id;
            // Load the SO Saved Search
            var salesOrderOppExistsObj = search.load({
                id: "customsearch_so_associated_opps"
            });

            // Copy the filters from search into defaultFilters.
            var defaultFilters = salesOrderOppExistsObj.filters;

            // Push the customFilters into defaultFilters.
            defaultFilters.push(search.createFilter({
                name: "opportunity",
                operator: search.Operator.ANYOF,
                values: opportunityID
            }));
            // Copy the modified defaultFilters back into search.
            salesOrderOppExistsObj.filters = defaultFilters;
            // Run the SO Saved Search
            var salesOrderOppExistsObjResults = salesOrderOppExistsObj.run().getRange(0, 1000);

            log.debug('Sales Order Opportunity Results', salesOrderOppExistsObjResults.length);
            // If the SO Saved Search does not yield any results,
            // check through the conditions so see whether an SO should be generated.
            if (salesOrderOppExistsObjResults.length < 1) {
                try {
                    // Begin check for Matt's approval requirements on PO
                    // Use the lookupFields Function to grab the Oppurtunity values needed to preform the check
                    var oppRecVals = search.lookupFields({
                        type: search.Type.OPPORTUNITY,
                        id: opportunityID,
                        columns: [
                            'custbody_fin_buy_or_sale',
                            'custbody_em_sales_order',
                            'custbody_em_sales_order',
                            'custbody_em_accounting_approval',
                            'entitystatus', 'custbody_em_agreement_type',
                            'memo',
                          	'currency',
                        ]
                    });
                    // Store the values returned by the above function into seperate variables
                    var buySale = oppRecVals['custbody_fin_buy_or_sale'][0].text,
                        existingSalesOrder = oppRecVals['custbody_em_sales_order'][0].value,
                        AccoutingApproval = oppRecVals['custbody_em_accounting_approval'][0].text,
                        opportunityStatus = oppRecVals['entitystatus'][0].text,
                        memo = oppRecVals['memo'],
                  		currency = oppRecVals['currency'];
                  
                    // Log out the stored values
                    log.debug('Opportunity Status', opportunityStatus);
                    log.debug('Accouting Approval', AccoutingApproval);
                    log.debug('Opportunity ID', opportunityID);
                    log.debug('Buy Sales Value', buySale);
                    log.debug('memo', memo);
                  	log.debug('currency', currency);

                    //customerID = opportunityRecord.getValue('entity');
                    // If the Oppurtunity record has a Status of Closed Won, is a Sale, and has been Approved by Accounting,
                    // preform the transformation into a SO
                    if (opportunityStatus == "Closed Won" && buySale == "Sale" && !existingSalesOrder && AccoutingApproval == "Approved") {
                        log.debug('Closed Won - Sales Opportunity - Creating sales order.');
                        // Get the Agreement Types that require the Special SO Form
                        var specialAgreeTypes = runtime.getCurrentScript().getParameter({name: 'custscript_sb369_agreement_types'}),
                            specialAgreeTypes = specialAgreeTypes.split(',');
                        // Get the Default Form ID
                        var formId = runtime.getCurrentScript().getParameter({name: 'custscript_sb369_default_so_form_id'});
                        // Get the Agreement Type of the Oppurtunity record
                        var agreementType = oppRecVals['custbody_em_agreement_type'][0].value; // Get the Agreement Type
                        log.debug('Agreement Type', agreementType);
                        // If the Agreement Type of the Oppurtunity record requires a Special SO Form, set the formId var to the Special Form ID
                        if (specialAgreeTypes.indexOf(agreementType) != -1) {
                            formId = runtime.getCurrentScript().getParameter({name: 'custscript_sb369_special_so_form_id'});
                        }
                        log.debug('formId', formId);
                        // Transform the Oppurtunity into a SO
                        salesOrderCreate = record.transform({
                            fromType: record.Type.OPPORTUNITY,
                            fromId: opportunityID,
                            toType: record.Type.SALES_ORDER,
                            isDynamic: true,
                            defaultValues: {
                                customform: formId,
                            }
                        });
                        log.debug('Sales Order generation', salesOrderCreate);
                        salesOrderCreate.setValue({
                            fieldId: 'memo',
                            value: memo
                        });

                        // Save the new SO record
                        generatedSOID = salesOrderCreate.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: false
                        });
                        log.debug('Sales Order Created - ID', generatedSOID);
                        // If the SO was generated correctly, set the Sales Order Custom List Field on the Oppurtunity to the new SO ID
                        if (generatedSOID) {
                            log.audit('Putting sales order number on Record');
                            record.submitFields({
                                type: record.Type.OPPORTUNITY,
                                id: opportunityID,
                                values: {
                                    'custbody_em_sales_order': generatedSOID
                                }
                            });
                        }
                    }
                } catch (error) {
                    log.error({
                        title: "An Error has occurred",
                        details: error.message
                    });
                }
            } else {
                // If an SO already exists for the Oppurtunity, set the Sales Order Custom List Field on the Oppurtunity to the returned SO ID
                generatedSOID = salesOrderOppExistsObjResults[0].getValue('internalid')
                log.debug('Sales Order already exists for opportunity')
                if (opportunityStatus == "Closed Won" && buySale == "Sale" && !existingSalesOrder && AccoutingApproval == "Approved") {
                    log.audit('Putting sales order number on Record');
                    record.submitFields({
                        type: record.Type.OPPORTUNITY,
                        id: opportunityID,
                        values: {
                            'custbody_em_sales_order': generatedSOID
                        }
                    });
                }
            }
        }

        return {
            afterSubmit: autoCreateSalesOrder
        }
    });
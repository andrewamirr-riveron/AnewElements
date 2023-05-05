/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * Summary: This will find all of the opportunities Closed/Won with no associated PO.
 * Version      Date                Author                    Remarks
   1.00      2/09/2020        Christopher Cannata          Initial script created
 */
define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/https', 'N/url', '/SuiteScripts/OAUTH/oauth', '/SuiteScripts/OAUTH/secret'],
function(record, search, task, runtime, https, url, oauth, secret) {

  // Auto create function will check through all saved search results to find ones where PO needs to be generated.
  function autoCreatePurchaseOrders(context) {
    log.debug('Testing Start of Scheduled Script', 'Auto Create Vendor from Closed One Opportunity');

    try {
      var oppFields = [];
      var oppPOsearch = search.load({
        id: "customsearch_opp_no_associated_purchase"
      });

      var oppPOsearchResults = oppPOsearch.run().getRange(0, 1000);
    }
    catch (error) {
      log.error({
        title: "An Error has occurred",
        details: error.message
      });
    }

    try {
      // Begin to get field values from the saved search.
      for (var i=0; i < oppPOsearchResults.length; i++) {
        opportunityID = oppPOsearchResults[i].getValue('internalid');
        customerID = oppPOsearchResults[i].getValue('entity');
        vendorID = null;
        log.debug('Opportunity ID', opportunityID);
        log.debug('Opportunity Customer', customerID);

        var customerRecord = record.load({
          type: 'customer',
          id: customerID,
          isDynamic: true
        });

        try {
          checkVendorExists = record.load({
            type: 'vendor',
            id: customerID,
            isDynamic: true
          });
          log.debug('Related Vendor', checkVendorExists);
        } catch (error) {
          checkVendorExists = null;
        }

        if (!checkVendorExists) {
          log.debug('Vendor does not exist, creating one now');

          var parameters = '';
          try {
              var output = url.resolveDomain({
                  hostType: url.HostType.APPLICATION,
                  accountId: runtime.accountId
              });

              // var headers = {
              //     "Authorization": "NLAuth lauth_account=721807_SB1,nlauth_email=chris.cannata@apptegra.com,nlauth_signature=C!itral05272019,nlauth_role=3",
              //     "Content-Type": "application/json",
              //     "Accept": "application/json"
              // };
              // var finUrl = 'https://' + output + '/app/common/entity/company.nl?e=T&target=s_relation:otherrelationships&label=Other+Relationships&fromtype=custjob&id='+customerID+'&totype=vendor';
              var finUrl = 'https://' + output + '/app/accounting/transactions/opprtnty.nl?id=3091&whence=&cmid=1582775852712_4748'
              log.debug('Final URL', finUrl);

              var method = 'GET';
              var headers = oauth.getHeaders({
                  // url: url,
                  url: finUrl,
                  method: method,
                  tokenKey: secret.token.public,
                  tokenSecret: secret.token.secret
              });

              headers['Content-Type'] = 'application/json';

              var response = https.get({
                  url: finUrl,
                  headers: headers
              });
              log.debug('response', JSON.stringify(response));
              log.debug('headers', headers);
              // log.debug('Response from creation attempt', response.body.toString());
          }
          catch(error) {
              log.debug(error.toString());
          }
        } else {
          // Vendor already exists proceeding to PO creation step.
          vendorID = customerID
        }

        // Create Purchase Order - only if vendor exists or has been newly created.
        if (vendorID) {
          log.debug('Generating purchase order for vendor', vendorID);

          opportunityRecord = record.load({
            type: 'opportunity',
            id: opportunityID,
            isDynamic: true
          });

          opportunityNumberOfLines = opportunityRecord.getLineCount({
            sublistId: 'item'
          })

          log.debug('Number of lines on opportunity', opportunityNumberOfLines);

          if (opportunityNumberOfLines > 0) {
            purchaseOrderCreate = record.transform({
              fromType: record.Type.VENDOR,
              fromId: vendorID,
              toType: record.Type.PURCHASE_ORDER,
              isDynamic: true
            });
            for (var k=0; k < opportunityNumberOfLines; k++) {
              itemID = opportunityRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: k
              });
              itemQuantity = opportunityRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: k
              });
              itemRate = opportunityRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: k
              });
              itemAmount = opportunityRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: k
              });
              log.debug('Item id to set: ', itemID);
              log.debug('Item quantity to set: ', itemQuantity);
              log.debug('Item rate to set: ', itemRate);
              log.debug('Item amount to set: ', itemAmount);

              purchaseOrderCreate.insertLine({
                sublistId: 'item',
                line: k
              });
              purchaseOrderCreate.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: k,
                value: itemID
              });
              purchaseOrderCreate.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: k,
                value: itemQuantity
              });
              purchaseOrderCreate.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: k,
                value: itemRate
              });
              purchaseOrderCreate.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: k,
                value: itemAmount
              });
              purchaseOrderCreate.commitLine({
                sublistId: 'item'
              });
            }
            log.debug('Purchase Order generation', purchaseOrderCreate);
            generatedPOID = purchaseOrderCreate.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });
            log.debug('Purchase Order Created - ID', generatedPOID);

            if (generatedPOID) {
              opportunityRecord.setValue({
                fieldId: 'custbody_fin_crm_vendor',
                value: vendorID
              })
              opportunityRecord.setValue({
                fieldId: 'custbody_em_purchase_order',
                value: generatedPOID
              })
              opportunityRecord.save({
                  enableSourcing: true,
                  ignoreMandatoryFields: false
              });
            }
          }
        }
      }
    }
    catch (error) {
      log.error({
        title: "An Error has occurred",
        details: error.message
      });
    }
  }
  return {
    execute: autoCreatePurchaseOrders
  }
});

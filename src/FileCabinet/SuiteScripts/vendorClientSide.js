/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * Summary: Autocreate vendors using other relationships automated call.
 * Version      Date                Author                   Remarks
   1.00      2/19/2019        Christopher Cannata   Initial script created.
*/
define(['N/url', 'N/https', 'N/runtime', 'N/record'],

function(url, https, runtime, record) {
    function resolveDomainUrl(context) {
      var parameters = "";

      var currentRecord = context.currentRecord;
      var opportunityID = currentRecord.getValue('id');
      var buyField = currentRecord.getText('custbody_fin_buy_or_sale');
      var vendorID = currentRecord.getValue('entity');
      var status = currentRecord.getText('entitystatus');
      log.debug('Current value - Buy Field', buyField);
      log.debug('Current value - Vendor ID', vendorID);
      log.debug('Current value - Status', status);
      var vendorExists = false

      try {
        record.load({
          type: 'vendor',
          id: vendorID,
          isDynamic: true
        });
        vendorExists = true
      } catch (error) {

      }

      if (buyField == "Buy" && status == "Closed Won") {
        if (vendorExists == false) {
          log.debug('Vendor does not exist, creating one now');
          try {
              var output = url.resolveDomain({
                  hostType: url.HostType.APPLICATION,
                  accountId: runtime.accountId
              });
              var finUrl = 'https://' + output + '/app/common/entity/company.nl?e=T&target=s_relation:otherrelationships&label=Other+Relationships&fromtype=custjob&id='+vendorID+'&totype=vendor';
              log.debug('Final URL', finUrl);
              var response = https.post({
                  url: finUrl,
                  body: parameters
              });
              log.debug('Response from creation attempt', response.body.toString());
          }
          catch(e) {
              log.debug(e.toString());
          }
        } else {
          log.debug('Vendor already exists.');
        }
      } else {
        log.debug('Record not Closed Won or buy reason not "Buy".');
      }
      return true;
    }
    return {
      saveRecord : resolveDomainUrl
    }
});

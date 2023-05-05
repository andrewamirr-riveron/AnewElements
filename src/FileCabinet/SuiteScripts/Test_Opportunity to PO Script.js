/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * Summary: Check Purchase Order for Price Mismatch.
 * Version      Date                Author                   Remarks
   1.00      9/17/2019        Christopher Cannata   Initial script created.
 */
   define(['N/record', 'N/search', 'N/https', 'N/runtime', 'N/url'],
   function(record, search, https, runtime, url) {
   
     // I am adding a comment because this not clear. (single comment line)
     function autoCreateVendor(context) {
       log.debug('Testing Start of User Event Script', 'Auto Create Vendor from Closed One Opportunity');
       try {
         var opportunityRecord = context.newRecord;
         const BROKER_DEAL_NO_RISK = 3;
         const BROKER_DEAL = 2;
         const CONSIGNMENT = 11;
         const FORM_SPECIAL_OPPRTUNITY = 162;
   
         // Begin check for Matt's approval requirements on PO
         opportunityID = opportunityRecord.getValue('id');
         opportunityStatus = opportunityRecord.getText('entitystatus');
         AccoutingApproval = opportunityRecord.getText('custbody_em_accounting_approval');
         customerID = opportunityRecord.getValue('entity');
         existingPurchaseOrderID = opportunityRecord.getValue('custbody_em_purchase_order');
         buySale = opportunityRecord.getText('custbody_fin_buy_or_sale');
         var form = opportunityRecord.getValue('customform');
        
         log.debug('Opportunity ID', opportunityID);
         log.debug('Opportunity Status', opportunityStatus);
         log.debug('Accouting Approval', AccoutingApproval);
         log.debug('Opportunity Customer', customerID);
         log.debug('Existing Purchase Order', existingPurchaseOrderID);
         log.debug('Buy Sales Value', buySale);
   
         var customerRecord = record.load({
           type: 'customer',
           id: customerID,
           isDynamic: true
         });
   
         try {
           record.load({
             type: 'vendor',
             id: customerID,
             isDynamic: true
           });
           vendorID = customerID;
           log.debug('Related Vendor', vendorID);
         } catch (error) {
           vendorID = null;
         }
   
         if (opportunityStatus == "Closed Won" && buySale == "Buy" && !vendorID && !existingPurchaseOrderID && AccoutingApproval == "Approved") {
           var vendorExists = false;
   
           log.debug('Vendor does not exist, creating one now');
   
           //----------------------Create Vendor Record----------------------------
   
           // Set field for vendor needing creation in order for client script to fire.
           opportunityRecord = record.load({
             type: 'opportunity',
             id: opportunityID,
             isDynamic: true
           });
   
           // opportunityRecord.setValue({
           //   fieldId: 'custbody_auto_create_vendor_process',
           //   value: true
           // })
           opportunityRecord.save({
               enableSourcing: true,
               ignoreMandatoryFields: false
           });
   
           // Now try to load the vendor record to confirm this worked.
           try {
             record.load({
               type: 'vendor',
               id: customerID,
               isDynamic: true
             });
             vendorExists = true;
           } catch (error) {
   
           }
   
           // Create Purchase Order - only if vendor created correctly.
           if (vendorExists == true) {
             log.debug('Vendor successfully created, now creating purchase order.')
   
             opportunityRecord = record.load({
               type: 'opportunity',
               id: opportunityID,
               isDynamic: true
             });
   
             opportunityNumberOfLines = opportunityRecord.getLineCount({
               sublistId: 'item'
             })
   
   
             log.debug('Number of lines on opportunity', opportunityNumberOfLines);
   
             if (parseFloat(opportunityNumberOfLines) > 0) {
               purchaseOrderCreate = record.transform({
                 fromType: record.Type.VENDOR,
                 fromId: vendorID,
                 toType: record.Type.PURCHASE_ORDER,
                 isDynamic: true
               });
   
   
               // agreementType = opportunityRecord.getValue('custbody_em_agreement_type');
               department = opportunityRecord.getValue('department');
               location = opportunityRecord.getValue('location');
               oppClass = opportunityRecord.getValue('class');
               subsidiary = opportunityRecord.getValue('subsidiary');
               var salesrep = opportunityRecord.getValue('salesrep') || '';
               var third_party_broker = opportunityRecord.getValue('custbody_em_thirdparty_broker') || '';
               var third_party_fee = opportunityRecord.getValue('custbody_thirdparty_brokerage_fee') || '';
               var aggrement_type = opportunityRecord.getValue('custbody_em_agreement_type') || '';
               var memo = opportunityRecord.getValue('memo') || '';
               
               purchaseOrderCreate.setValue ('subsidiary', subsidiary);
               purchaseOrderCreate.setValue ('department', department);
               purchaseOrderCreate.setValue ('location', location);
               purchaseOrderCreate.setValue ('class', oppClass);
               purchaseOrderCreate.setValue ('custbody_em_agreement_type', agreementType);
               purchaseOrderCreate.setValue('custbody_fin_po_sales_rep', salesrep);
               purchaseOrderCreate.setValue('custbody_abi_related_opportunity', opportunityID);
               purchaseOrderCreate.setValue('custbody_em_thirdparty_broker', third_party_broker);
               purchaseOrderCreate.setValue('custbody_thirdparty_brokerage_fee', third_party_fee);
               purchaseOrderCreate.setValue('memo', memo);
   
   
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
                 var inventory_quantity = opportunityRecord.getSublistValue({
                   sublistId: 'item',
                   fieldId: 'custcol_em_inventory_quantity',
                   line: k
                 }) || '';
                 var inventory_rate = opportunityRecord.getSublistValue({
                   sublistId: 'item',
                   fieldId: 'custcol_em_inventorty_rate',
                   line: k
                 }) || '';
                 var inventory_total = opportunityRecord.getSublistValue({
                   sublistId: 'item',
                   fieldId: 'custcol_em_inventory_amount',
                   line: k
                 }) || '';
                 var inventory_item = opportunityRecord.getSublistValue({
                   sublistId: 'item',
                   fieldId: 'custcol_em_inventory_item',
                   line: k
                 });
                 var delivery_date = opportunityRecord.getSublistValue({
                   sublistId: 'item',
                   fieldId: 'custcol_fin_delivery_date',
                   line: k
                 }) || '';
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
                 purchaseOrderCreate.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'location',
                   line: k,
                   value: location
                 });
                 purchaseOrderCreate.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'class',
                   line: k,
                   value: oppClass
                 });
                 purchaseOrderCreate.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'department',
                   line: k,
                   value: department
                 });
                 log.debug('delivery_date', getFormattedDate(delivery_date))
                 if(delivery_date) {
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_fin_delivery_date',
                     value: new Date(getFormattedDate(delivery_date))
                   });
                 }
                 if(aggrement_type == BROKER_DEAL || aggrement_type == BROKER_DEAL_NO_RISK || (form == FORM_SPECIAL_OPPRTUNITY && aggrement_type == CONSIGNMENT))
                 {
                   // purchaseOrderCreate.setCurrentSublistValue({
                   //   sublistId: 'item',
                   //   fieldId: 'rate',
                   //   value: inventory_rate
                   // });
                   // purchaseOrderCreate.setCurrentSublistValue({
                   //   sublistId: 'item',
                   //   fieldId: 'quantity',
                   //   value: inventory_quantity
                   // });
                   // purchaseOrderCreate.setCurrentSublistValue({
                   //   sublistId: 'item',
                   //   fieldId: 'amount',
                   //   value: inventory_total
                   // });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventory_quantity',
                     value: inventory_quantity
                   });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventorty_rate',
                     value: inventory_rate
                   });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventory_amount',
                     value: inventory_total
                   });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventory_item',
                     value: inventory_item
                   });
                 }
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
   
           //--------------------------------------------------------------------//
         } else if (opportunityStatus == "Closed Won" && buySale == "Buy" && vendorID && !existingPurchaseOrderID && AccoutingApproval == "Approved") {
           log.debug('Vendor exists, no Purchase Order, creating one now');
   
           // Create Purchase Order
           opportunityRecord = record.load({
             type: 'opportunity',
             id: opportunityID,
             isDynamic: true
           });
   
           opportunityNumberOfLines = opportunityRecord.getLineCount({
             sublistId: 'item'
           })
   
           log.debug('Number of lines on opportunity', opportunityNumberOfLines);
   
           if (parseFloat(opportunityNumberOfLines) > 0) {
             purchaseOrderCreate = record.transform({
               fromType: record.Type.VENDOR,
               fromId: vendorID,
               toType: record.Type.PURCHASE_ORDER,
               isDynamic: true
             });
               agreementType = opportunityRecord.getValue('custbody_em_agreement_type');
               department = opportunityRecord.getValue('department');
               location = opportunityRecord.getValue('location');
               oppClass = opportunityRecord.getValue('class');
                 subsidiary = opportunityRecord.getValue('subsidiary');
                 currency = opportunityRecord.getValue('currency');
               var salesrep = opportunityRecord.getValue('salesrep') || '';
               var third_party_broker = opportunityRecord.getValue('custbody_em_thirdparty_broker') || '';
               var third_party_fee = opportunityRecord.getValue('custbody_thirdparty_brokerage_fee') || '';
               var aggrement_type = opportunityRecord.getValue('custbody_em_agreement_type') || '';
   
               var memo = opportunityRecord.getValue('memo') || '';
               
               purchaseOrderCreate.setValue ('subsidiary', subsidiary);
               purchaseOrderCreate.setValue ('department', department);
               purchaseOrderCreate.setValue ('location', location);
               purchaseOrderCreate.setValue ('class', oppClass);
               purchaseOrderCreate.setValue ('custbody_em_agreement_type', agreementType);
               purchaseOrderCreate.setValue('custbody_fin_po_sales_rep', salesrep);
               purchaseOrderCreate.setValue('custbody_abi_related_opportunity', opportunityID);
               purchaseOrderCreate.setValue('custbody_em_thirdparty_broker', third_party_broker);
               purchaseOrderCreate.setValue('custbody_thirdparty_brokerage_fee', third_party_fee);
               purchaseOrderCreate.setValue('memo', memo);
                 purchaseOrderCreate.setValue('currency',currency);
   
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
               var inventory_item = opportunityRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_em_inventory_item',
                 line: k
               });
               var inventory_quantity = opportunityRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_em_inventory_quantity',
                 line: k
               }) || '';
               var inventory_rate = opportunityRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_em_inventorty_rate',
                 line: k
               }) || '';
               var inventory_total = opportunityRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_em_inventory_amount',
                 line: k
               }) || '';
               var delivery_date = opportunityRecord.getSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_fin_delivery_date',
                 line: k
               }) || '';
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
               purchaseOrderCreate.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'location',
                   line: k,
                   value: location
                 });
                 purchaseOrderCreate.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'class',
                   line: k,
                   value: oppClass
                 });
                 purchaseOrderCreate.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'department',
                   line: k,
                   value: department
                 });
                 log.debug('delivery date', getFormattedDate(delivery_date));
                 if(delivery_date) {
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_fin_delivery_date',
                     value: new Date(getFormattedDate(delivery_date))
                   });
                 }
                 if(aggrement_type == BROKER_DEAL || aggrement_type == BROKER_DEAL_NO_RISK || (form == FORM_SPECIAL_OPPRTUNITY && aggrement_type == CONSIGNMENT))
                 {
                   // purchaseOrderCreate.setCurrentSublistValue({
                   //   sublistId: 'item',
                   //   fieldId: 'rate',
                   //   value: inventory_rate
                   // });
                   // purchaseOrderCreate.setCurrentSublistValue({
                   //   sublistId: 'item',
                   //   fieldId: 'quantity',
                   //   value: inventory_quantity
                   // });
                   // purchaseOrderCreate.setCurrentSublistValue({
                   //   sublistId: 'item',
                   //   fieldId: 'amount',
                   //   value: inventory_total
                   // });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventory_quantity',
                     value: inventory_quantity
                   });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventorty_rate',
                     value: inventory_rate
                   });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventory_amount',
                     value: inventory_total
                   });
                   purchaseOrderCreate.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_em_inventory_item',
                     value: inventory_item
                   });
                 }
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
         } else {
   
         }
       }
       catch (error) {
         log.error({
           title: "An Error has occurred",
           details: error.message
         });
       }
     }
     function getFormattedDate(date) {
       date = new Date(date);
       var year = date.getFullYear();
   
       var month = (1 + date.getMonth()).toString();
       // month = month.length > 1 ? month : '0' + month;
   
       var day = date.getDate().toString();
       // day = day.length > 1 ? day : '0' + day;
   
       return month + '/' + day + '/' + year;
     }
   
     return {
       afterSubmit: autoCreateVendor
     }
   });
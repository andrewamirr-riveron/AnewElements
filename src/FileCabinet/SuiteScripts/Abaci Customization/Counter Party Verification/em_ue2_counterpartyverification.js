/**
 @NApiVersion 2.x
 @NScriptType UserEventScript
 @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/error'],
    /**
     * @param record
     * @param search
	 * @param error
	 * @returns {{beforeSubmit: (function(*): undefined)}}
     * @returns {{afterSubmit: (function(*): undefined)}}
     */

    function (record, search) {
        function beforeSubmit(context) {
            if (context.type == context.UserEventType.DELETE) {
                return;
            }
            var customerRecord = context.newRecord;

            if (context.type == context.UserEventType.XEDIT) {
                customerRecord = record.load({
                    type: record.Type.CUSTOMER,
                    id: context.newRecord.id
                });
            }
            //get the ctpid
            var ctpid = customerRecord.getValue({
                fieldId: custentity_abi_ctpid
            });
            if (ctpid) {
                var norecordfound = true;

                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                        [
                            ["custentity_abi_ctpid", "equalto", ctpid],
							"AND",
							["isinactive","is","F"]
                        ],
                    columns:
                        [
                            "internalid"
                        ]
                });
                customerSearchObj.run().each(function (result) {
                    norecordfound = false;
                    return false;
                });
            }
            if(!norecordfound)
			{
				var errormessage = error.create({
					message: 'You have create a duplicate Counter Party ID',
					name: 'Duplicate Counter Party ID',
					notifyOff: false
				});
				log.error("Error on User Event Counter Party Validation", errormessage.message);
				throw errormessage;
			}
        }

        function afterSubmit(context) {
            if (context.type == context.UserEventType.CREATE) {
                var customerRecord = context.newRecord;
                //get ctp if it exist
                var ctpid = customerRecord.getValue({
                    fieldId: custentity_abi_ctpid
                });
                if (!ctpid) {
                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        values: {
                            custentity_abi_ctpid: customerRecord.id
                        }
                    })
                }
            }
        }

        return {
            beforeSumbit: beforeSubmit,
            afterSubmit: afterSubmit
        };
    });

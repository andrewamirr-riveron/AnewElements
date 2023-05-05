/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/error', 'N/ui/dialog'],
    /**
     *
     * @param error
     * @param dialog
     * @returns {{saveRecord: (function(*): undefined)}}
     */
    function(error, dialog) {
        function saveRecord(context) {
            if (context.mode == 'create' || context.mode == 'delete')
                return;

            var currentRecord = context.currentRecord;

            //check if the oxygen ID is there
            var oxygenId = currentRecord.getValue({
                fieldId: 'custentity_abi_ctpid'
            });

            if(!oxygenId)
            {
                dialog.alert({
                    title: 'Please specify the Oxygen ID',
                    message: 'The Oxygen Counter Party ID is empty!'
                }).then(function(){

                }).catch(function(err){
                    alert(err);
                });

                return false
            }

            var norecordfound = true;

            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["custentity_abi_ctpid","equalto",oxygenId],
                        "AND",
                        ["isinactive","is","F"]
                    ],
                columns:
                    [
                        "internalid"
                    ]
            });
            customerSearchObj.run().each(function(result){
                norecordfound = false;
                return false;
            });

            if(!norecordfound)
            {
                dialog.alert({
                    title: 'Please enter a unique Oxygen ID',
                    message: 'You have entered a duplicate Oxygen ID!'
                }).then(function(){

                }).catch(function(err){
                    alert(err);
                });

                return false;
            } else {
                return true
            }


        }
        return {
            saveRecord: saveRecord
        };
    });

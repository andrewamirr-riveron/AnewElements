/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/record', 'N/search'], 

function(record, search) {
    function fieldChanged(context) {
      var currentRecord = context.currentRecord;
      var sublistId = context.sublistId;
      var fieldId = 'department';
      var classFieldId = 'class';
  
      if ((sublistId === 'line' || sublistId === 'item' || sublistId === 'expense' ) && context.fieldId === fieldId) {
        var departmentId = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: fieldId
        });
  
        if (departmentId) {
          var classId = getClassFromDepartment(departmentId);
          currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: classFieldId,
            value: classId
          });
        }
      }
    }
  
    function getClassFromDepartment(departmentId) {
        var classId;
        var searchResults = search.create({
          type: search.Type.DEPARTMENT,
          filters: [{
            name: 'internalid',
            operator: search.Operator.IS,
            values: departmentId
          }],
          columns: [{
            name: 'internalid',
            join: 'CUSTRECORD_FIN_DEPT_CLASS',
            label: 'Internal ID'
          }]
        }).run().getRange({
          start: 0,
          end: 1
        });
      
        if (searchResults.length > 0) {
          classId = searchResults[0].getValue({name: 'internalid', join: 'CUSTRECORD_FIN_DEPT_CLASS'});
        }
      
        return classId;
      }

      function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var sublistIds = ['line', 'item', 'expense'];
        var classFieldId = 'class';
      
        for (var s = 0; s < sublistIds.length; s++) {
          var sublistId = sublistIds[s];
      
          for (var i = 0; i < currentRecord.getLineCount({ sublistId: sublistId }); i++) {
            currentRecord.selectLine({ sublistId: sublistId, line: i });
            var currentClassId = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: classFieldId });
            var defaultClassId = getClassFromDepartment(currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'department' }));
            if (currentClassId != defaultClassId) {
              alert('Warning: The class for ' + sublistId + ' line ' + (i + 1) + ' has been changed from the default value.');
              break;
            }
          }
        }
        return true;
      }
  
    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});

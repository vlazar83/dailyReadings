'use strict';

var mongoose = require('mongoose'),
dailyReadings = mongoose.model('dailyReadings');
let readings = [];

function checkIfExistsAndSave(readingYear, readingMonth, readingDay, req, res) {

    const ready = dailyReadings.exists({ readingYear: readingYear, readingMonth: readingMonth, readingDay: readingDay });

    ready.then((result) => {
          
        if(!result){
          //only keyUsers are allowed to post, therefore the created_by always has to be set to "keyUser". Also the status can only be "saved"
          var new_reading = changeUser(req.body, "keyUser");
          new_reading = changeStatus(req.body, "saved");

          new_reading.save(function(err, task) {
            if (err)
              res.send(err);
            res.json(task);
          });

        } else {
          res.json('The reading for this day already exists! No DB operation is performed.');
        }

      }).catch((error) => {
          console.log("Error", error);
      })
}

function checkIfExists(readingYear, readingMonth, readingDay){

    return dailyReadings.exists({ readingYear: readingYear, readingMonth: readingMonth, readingDay: readingDay });

}

function saveMultipleReadings(arrayOfReadings, res){
    readings = [];

    const promises = [];

    //only keyUsers are allowed to post, therefore the created_by always has to be set to 'keyUser'. Also the status can only be "saved"
    arrayOfReadings = changeUserInArray(arrayOfReadings, "keyUser");
    arrayOfReadings = changeStatusInArray(arrayOfReadings, "saved");

    arrayOfReadings.forEach((reading) => {
        readings.push(new dailyReadings(reading));
        promises.push(checkIfExists(reading.readingYear, reading.readingMonth, reading.readingDay));
      });

    Promise.all(promises)
      .then((results) => {

        var finalDecisionToSave = true;
        var indexOfFirstDuplicateElement = 0;
        
        for (let i = 0; i < results.length; ++i) {
            if(results[i] == true) {
                finalDecisionToSave = false;
                indexOfFirstDuplicateElement = i;
                break;
            } 
        }

        if(finalDecisionToSave){
            dailyReadings.insertMany(readings,function(err, task) {
                if (err)
                  res.send(err);
                res.json(task);
              });
        } else {
            var responseString = "{ \"message\" : \"Saving is not possible because an element was found which is already saved for the given day.The index of the first duplicate element is : " + indexOfFirstDuplicateElement.toString() + "\"}";
            var obj = JSON.parse(JSON.stringify(responseString));
            res.setHeader("Content-Type", "application/json");
            res.status(400).send(obj);
        }

      })
      .catch((e) => {
        console.log("failure", e);
      });

}

function deleteReading(readingID, res){

  dailyReadings.findByIdAndDelete(readingID, (err) => {
    if (err) {
      res.json({ message: 'Reading deletion failed, error:', err });
    } else {
        res.json({ message: `Deleted dailyReading with ID: ${readingID} successfully` });
    }
  });

}

function massStatusUpdateInDB(newStatus, res){
  dailyReadings.updateMany({},{$set:{status:[newStatus]}}, (err) => {
    if (err) {
      res.json({ message: 'Mass update failed, error:', err });
    } else {
        res.json({ message: "Mass update was successful" });
    }
  });
}

function changeUser(reading, newUser){

  var modifiedBody = reading;
  modifiedBody.created_by = newUser;
  var new_reading = new dailyReadings(modifiedBody);
  return new_reading;
}

function changeUserInArray(arrayOfReadings, newUser){

  var newArray = [];

  arrayOfReadings.forEach((reading) => {
    var modifiedBody = reading;
    modifiedBody.created_by = newUser;
    newArray.push(modifiedBody);
  });

  return newArray;
}

function changeStatus(reading, newStatus){

  var modifiedBody = reading;
  modifiedBody.status = newStatus;
  var new_reading = new dailyReadings(modifiedBody);
  return new_reading;
}

function changeStatusInArray(arrayOfReadings, newStatus){

  var newArray = [];

  arrayOfReadings.forEach((reading) => {
    var modifiedBody = reading;
    modifiedBody.status = newStatus;
    newArray.push(modifiedBody);
  });

  return newArray;
}

module.exports.massStatusUpdateInDB = massStatusUpdateInDB;
module.exports.deleteReading = deleteReading;
module.exports.saveMultipleReadings = saveMultipleReadings;
module.exports.checkIfExists = checkIfExists;
module.exports.checkIfExistsAndSave = checkIfExistsAndSave;
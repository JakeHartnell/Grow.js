/*
  This file contains utilities for calibrating and working with data from ph sensors.

  Note: we might differentiate between analog and digital sensors.
*/


// Todo support callibaration libraries for sensors.
// These should accumlate data do some basic cleaning and store the data to 
GROWJS.prototype.phChange = function (value) {
  var self = this;

  return self.calcPh(value);
}

GROWJS.prototype.log_ph = function () {
  var self = this;
  self.readableStream.push({
      name: "Ph",
      type: "ph",
      unit: "ph",
      value: self.ph
  });
}


// Some useful math in here.

// vRefs could be very useful for calibrating sensors.
var vRef = 4.096; //Our vRef into the ADC wont be exact
                    //Since you can run VCC lower than Vref its
                    //best to measure and adjust here
var opampGain = 5.25; //what is our Op-Amps gain (stage 1)

var params = {}

//Lets read our raw reading while in pH7 calibration fluid and store it
//We will store in raw int formats as this math works the same on pH step calcs
function calibratepH7(calnum){
  params.pH7Cal = calnum;
  calcpHSlope();
}

//Lets read our raw reading while in pH4 calibration fluid and store it
//We will store in raw int formats as this math works the same on pH step calcs
//Temperature compensation can be added by providing the temp offset per degree
//IIRC .009 per degree off 25c (temperature-25*.009 added pH@4calc)
function calibratepH4(calnum){
  params.pH4Cal = calnum;
  calcpHSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params, (void *)0, sizeof(params));
}

//This is really the heart of the calibration process, we want to capture the
//probes "age" and compare it to the Ideal Probe, the easiest way to capture two readings,
//at known point(4 and 7 for example) and calculate the slope.
//If your slope is drifting too much from ideal (59.16) its time to clean or replace!
function calcpHSlope () {
  //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain /pH step difference 7-4
   params.pHStep = ((((vRef*(float)(params.pH7Cal - params.pH4Cal))/4096)*1000)/opampGain)/3;
}

//Now that we know our probe "age" we can calculate the proper pH Its really a matter of applying the math
//We will find our millivolts based on ADV vref and reading, then we use the 7 calibration
//to find out how many steps that is away from 7, then apply our calibrated slope to calculate real pH
function calcpH(int raw) {
 var miliVolts = (((float)raw/4096)*vRef)*1000;
 var temp = ((((vRef*(float)params.pH7Cal)/4096)*1000)- miliVolts)/opampGain;
 pH = 7-(temp/params.pHStep);
}

//This just simply applies defaults to the params in case the need to be reset or
//they have never been set before (!magicnum)
function reset_Params(void) {
  //Restore to default set of parameters!
  params.WriteCheck = Write_Check;
  params.pH7Cal = 2048; //assume ideal probe and amp conditions 1/2 of 4096
  params.pH4Cal = 1286; //using ideal probe slope we end up this many 12bit units away on the 4 scale
  params.pHStep = 59.16;//ideal probe slope
  eeprom_write_block(&params, (void *)0, sizeof(params)); //write these settings back to eeprom
}
/*
  This file contains utilities for working with data from electrical conductivity sensors.

  Electrical conductive sensors are used for ... (TODO: add some more info.)
*/

// constants for the mini eC board
// voltage of oscillator output after voltage divider in millivolts
var _oscV = 185;
//set our Kcell constant basically our microsiemens conversion 10-6 for 1 10-7 for 10 and 10-5 for .1
var _kCell = 1.0;
//this is the measured value of the R9 resistor in ohms
var _Rgain = 3000.0; 
var _I2CadcVRef = 4948;

// TODO: add other arguments to this function so that this information could be included in the grow
// file for the sensor.

var _calcEC = function(rawval) {
    var tempmv = (rawval / 4095) * _I2CadcVRef;
    var tempgain = (tempmv / _oscV) - 1.0;
    var rprobe = (_Rgain / tempgain);
    var temp = ((1000000) * _kCell) / rprobe;
    return temp;
}



// Electrical conductivity sensors are used for measuring nutrient levels in water.
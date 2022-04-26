import { T1 } from "../Theories/T1.js"
import { T1Auto } from "../Strategies/T1Auto.js"

var t1 = T1.new();
t1.logTau = 650;
t1.publish();

var t1a = new T1Auto(t1);

const logmultiplier = Math.log10(1.5);
const logr9 = 3 * Math.log10(280/20);
// const logr9 = 0;

let tottime = 0;
let stepSize = 0.1;

console.time("performance")
while (tottime < 1e6) {
    t1a.buy();
    stepSize = t1a.timeRequest(stepSize);
    stepSize = stepSize > 0.1 ? stepSize : 0.1;
    t1a.tick(stepSize, logmultiplier, logr9);
    tottime += stepSize;
}
console.timeEnd("performance");

let format = {}
t1.varlist.forEach(name => {format[name] = t1[name].level})
format.currency = t1.logCurrency[0];
format.tau = t1.logTau;
format.tottime = tottime;
console.log(JSON.stringify(format));

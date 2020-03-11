const program = require("commander");
const process = require("process");
const ordersMapping = require("./ordersMapping");
const moveBrick = require("./moveBrick");
const newOrdersMapping = require("./newOrderMapping");
const threecorner = require("./threeCorner");
program.version("0.0.1");
program.usage("--help", "Show TreeNewBee help");
let _description = "TreeNewBee command line tools";
program.description(_description);
program.option("-O,--ordersMapping", "mapping orders from exchange to weidex");
program.option("-N,--newOrdersMapping", "mapping orders from exchange to weidex");
program.option("-M,--moveBrick", "select orders from exchange which has a best price,and place an order");
program.option("-T,--threecorner", "testing three corner Interest arbitrage");
program.parse(process.argv);
if (!program.ordersMapping) {
  console.log("Must input ordersMapping");
  process.exit();
}
if (!program.newOrdersMapping) {
  console.log("Must input newOrdersMapping");
  process.exit();
}
if (!program.moveBrick) {
  console.log("Must input moveBrick");
  process.exit();
}
if (!program.threecorner) {
  console.log("Must input threecorner");
  process.exit();
}
var start = function() {
  if (program.ordersMapping) {
    ordersMapping.init();
  }
  if (program.newOrdersMapping) {
    newOrdersMapping.init();
  }
  if (program.moveBrick) {
    moveBrick.init();
  }
  if (program.threecorner) {
    threecorner.init();
  }
};
start();

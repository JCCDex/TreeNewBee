const program = require("commander");
const fs = require("fs");
const huobi_weidex = require("./testhuobi_weidex");
const okex_weidex = require("./testokex_weidex");
const moveBrick = require("./testMoveBrick");

program.version("0.0.1");
program.usage("--help", "Show TreeNewBee help");
let _description = "TreeNewBee command line tools";
program.description(_description);
program.option("-H,--huobi_weidex", "mapping orders from huobi to weidex");
program.option("-O,--okex_weidex", "mapping orders from okex to weidex");
program.option("-M,--moveBrick", "select orders from exchange which has a best price,and place an order");
program.parse(process.argv);
if (!program.huobi_weidex||!program.okex_weidex) {
  console.log('Must input both:huobi_weidex,okex_weidex');
  process.exit();
}
if (!program.moveBrick) {
  console.log('Must input moveBrick');
  process.exit();
}
var start = function () {
  if(program.huobi_weidex&&program.okex_weidex){
    huobi_weidex.init()
    okex_weidex.init()
  }
  if(program.moveBrick){
    moveBrick.init()
  }
};
start();
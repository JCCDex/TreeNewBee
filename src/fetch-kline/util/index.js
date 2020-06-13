const path = require("path");
const tinydate = require("tinydate");

module.exports = {
  getPath: ({ start, end, period, folder }) => {
    let format;
    if (/60min/.test(period)) {
      format = "{YYYY}.{MM}.{DD}:{HH}";
    } else if (/[0-9]+min/.test(period)) {
      format = "{YYYY}.{MM}.{DD}:{HH}:{mm}";
    } else if (/[0-9]+hour/.test(period)) {
      format = "{YYYY}.{MM}.{DD}:{HH}";
    } else if (/[0-9]+[day|week]/.test(period)) {
      format = "{YYYY}.{MM}.{DD}";
    } else if (/[0-9]+mon/.test(period)) {
      format = "{YYYY}.{MM}";
    } else if (/[0-9]+year/.test(period)) {
      format = "{YYYY}";
    }
    const filename = tinydate(format)(new Date(start)) + "-" + tinydate(format)(new Date(end));
    return path.join(folder, filename);
  }
};

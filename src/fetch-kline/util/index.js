const path = require("path");
const tinydate = require("tinydate");

module.exports = {
  getPath: ({ start, end, period, folder }) => {
    let format;
    let filename;
    if (/60min/.test(period)) {
      format = "{YYYY}.{MM}.{DD} {HH}";
      filename = tinydate(format)(new Date(start)) + ":00:00" + "-" + tinydate(format)(new Date(end)) + ":00:00";
    } else if (/[0-9]+min/.test(period)) {
      format = "{YYYY}.{MM}.{DD} {HH}:{mm}";
      filename = tinydate(format)(new Date(start)) + ":00" + "-" + tinydate(format)(new Date(end)) + ":00";
    } else if (/[0-9]+hour/.test(period)) {
      format = "{YYYY}.{MM}.{DD} {HH}";
      filename = tinydate(format)(new Date(start)) + ":00:00" + "-" + tinydate(format)(new Date(end)) + ":00:00";
    } else if (/[0-9]+[day|week]/.test(period)) {
      format = "{YYYY}.{MM}.{DD}";
      filename = tinydate(format)(new Date(start)) + "-" + tinydate(format)(new Date(end));
    } else if (/[0-9]+mon/.test(period)) {
      format = "{YYYY}.{MM}";
      filename = tinydate(format)(new Date(start)) + "-" + tinydate(format)(new Date(end));
    } else if (/[0-9]+year/.test(period)) {
      format = "{YYYY}";
      filename = tinydate(format)(new Date(start)) + "-" + tinydate(format)(new Date(end));
    }
    return path.join(folder, filename);
  }
};

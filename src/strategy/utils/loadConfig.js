const fs = require("fs");
const path = require("path");

module.exports = (file) => {
  try {
    let config;
    if (file) {
      if (fs.existsSync(file)) {
        config = JSON.parse(fs.readFileSync(file, { encoding: "utf8" }));
      } else {
        config = JSON.parse(fs.readFileSync(path.join(__dirname, file), { encoding: "utf8" }));
      }
    } else {
      config = require("./config");
    }
    return config;
  } catch (error) {
    throw error;
  }
};

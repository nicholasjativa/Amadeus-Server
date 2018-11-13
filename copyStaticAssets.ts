const shell = require("shelljs");

shell.mkdir("-p", "dist/public/js");
shell.cp("-R", "src/public/js/dist", "dist/public/js/");
shell.cp("-R", "src/public/fonts", "dist/public/");
shell.cp("-R", "src/public/images", "dist/public/");

const fs = require("fs");
const tables = [
    "BUser",
    "BRole"
];

module.exports = class DBHelper {
    static initDb = (guild) => {
        const path = "db/"+guild.id;
        if (!fs.existsSync(path))
            fs.mkdirSync(path);
        tables.forEach(t => {
            const tablePath = path + "/" + t + ".json";
            if (!fs.existsSync(tablePath))
                fs.appendFile(tablePath, "{}", (error) => {
                    if (error) throw error;
                });
        })
    }

}
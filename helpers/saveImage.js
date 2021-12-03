const fs = require("fs");
const util = require("util");
const path = require("path");
const uniqid = require('uniqid');
const { Buffer } = require('buffer');
const axios = require("axios");

const saveImage = async (url) => {
    try {
        const writeFile = util.promisify(fs.writeFile);
        const extension = url.split(".").slice(-1).join();
        const fileName = uniqid();
        const { data } = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        const base64Data = Buffer.from(data, 'binary').toString('base64')
        await writeFile(
            `${path.join(__dirname, "..", "images")}/${fileName}.${extension}`,
            base64Data,
            "base64");
        if(fs.existsSync(path.join(__dirname, "..", "images", `${fileName}.${extension}`))) {
            const resultFile = {name: `${fileName}.${extension}`};
            return resultFile;
        } else {
            throw e;
        };
    } catch (e) {
        throw e;
    }
};

module.exports = {
    saveImage
}
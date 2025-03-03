require("dotenv").config();
const fs = require("fs"); // for streams
const fsp = fs.promises; // for promise-based functions
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch"); // make sure to install node-fetch

const directoryPath = "/home/nischit/Downloads/test_files";

async function getFilesArray(directoryPath) {
  const fileNames = await fsp.readdir(directoryPath);
  const filesArray = [];
  for (const fileName of fileNames) {
    const filePath = path.join(directoryPath, fileName);
    const stat = await fsp.stat(filePath);
    if (stat.isFile()) {
      // Create a read stream for the file
      const fileStream = fs.createReadStream(filePath);
      filesArray.push({ stream: fileStream, filename: fileName });
    }
  }
  return filesArray;
}

const testRawApi = async () => {
  try {
    const filesArray = await getFilesArray(directoryPath);
    const form = new FormData();
    for (const file of filesArray) {
      // Append the stream along with its filename
      form.append("file", file.stream, {
        filepath: `/folder/${file.filename}`,
      });
    }
    console.log("uploading files: ", filesArray.length);
    const res = await fetch("https://storage.thirdweb.com/ipfs/upload", {
      method: "POST",
      headers: {
        "x-secret-key": process.env.TW_SECRET_KEY,
        ...form.getHeaders(),
      },
      body: form,
      timeout: 1000 * 60 * 30,
    });

    console.log(res.status, await res.text());
  } catch (error) {
    console.error("Error during upload:", error);
  }
};

testRawApi();

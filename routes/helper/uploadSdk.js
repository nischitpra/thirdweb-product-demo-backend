require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { upload } = require("thirdweb/storage");
const { createThirdwebClient } = require("thirdweb");
const FormData = require("form-data");

const directoryPath = "/home/nischit/Downloads/test_files";

const client = createThirdwebClient({
  clientId: process.env.TW_CLIENT_ID,
  config: {
    storage: {
      fetch: { requestTimeoutMs: 1000 * 60 * 30 },
    },
  },
});

async function getFilesArray(directoryPath) {
  const fileNames = await fs.readdir(directoryPath);
  const filesArray = [];

  for (const fileName of fileNames) {
    const filePath = path.join(directoryPath, fileName);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      const data = await fs.readFile(filePath);
      // Create a File object. (Requires Node 18+ or a polyfill)
      const fileObj = new File([data], fileName);
      filesArray.push(fileObj);
    }
  }

  return filesArray;
}

const testSdk = async () => {
  try {
    const filesArray = await getFilesArray(directoryPath);
    console.log("uploading total files:", filesArray.length);
    const uri = await upload({
      client,
      files: filesArray,
    });
    console.info("Upload URI:", uri);
  } catch (error) {
    console.error("Error during upload:", error);
  }
};

testSdk();

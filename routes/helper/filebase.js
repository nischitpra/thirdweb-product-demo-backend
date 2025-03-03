require("dotenv").config();
const { ObjectManager } = require("@filebase/sdk");
const fs = require("fs");
const { User } = require("../../types");

const filebaseSdk = new ObjectManager(
  process.env.FILEBASE_CLIENT_ID,
  process.env.FILEBASE_SECRET,
  {
    bucket: "tw-upload-test",
  }
);

const uploadFile = async () => {
  console.log("uploadFile");
  const response = await filebaseSdk.upload(
    `/uploads/${Date.now()}`, // file key of s3 bucket
    [
      {
        path: `/0`, // path of file in ipfs directory
        content: fs.createReadStream(
          "/home/nischit/code/thirdweb/mini project/backend/test.json"
        ),
      },
    ]
  );
  return response;
};

/**
 * Adds two numbers
 * @param {User} a
 * @param {User} b
 * @returns {number} Sum of two numbers
 */
const print = (a, b) => {
  console.log(a, b);
  console.log(a.n.number, b.n.number);
};

module.exports = { uploadFile };


require("dotenv").config()
var express = require("express");
var router = express.Router();
const { abis } = require("../constants");
const fs = require("fs");

const fetch = require("node-fetch");
const FormData = require("form-data");

const backendWallet = process.env.BACKEND_WALLET;
const accessToken = process.env.ACCESS_TOKEN;

router.get("/", (req, res, next) => {
  return res.send({ serverTime: Date.now() });
});

let maxLat = 0;
let minLat = Infinity;
let totalLat = 0;
let counter = 0;

const DELAY = 10000 
router.post("/testing", async (req, res) => {
  const s = Date.now();
  // await new Promise((res) => setTimeout(res, DELAY));
  const lat = Date.now() - s;

  totalLat += lat;
  maxLat = Math.max(maxLat, lat);
  minLat = Math.min(minLat, lat);

  counter++;
  return res.send();
});

router.get("/print", async (req, res) => {
  const resp = { counter, maxLat, minLat, avgLat: totalLat / counter };
  console.log(resp);
  counter = 0;
  maxLat = 0;
  minLat = Infinity;
  totalLat = 0;
  return res.send(resp);
});

router.post("/uploadtest", async (req, res, next) => {
  const form = new FormData();
  for (let i = 0; i < 9001; i++) {
    form.append(
      "file",
      fs.createReadStream(`/home/nischit/Downloads/meta/nfts/${i}.json`, {
        originalname: `/test/${i}.json`,
        pathname: `/test/${i}.json`,
      })
    );
  }
  try {
    const resp = await fetch("http://localhost:3000/ipfs/upload", {
      method: "POST",
      headers: {
        ...form.getHeaders(),
        "x-secret-key":
          process.env.TW_SECRET_KEY,
      },
      body: form,
    });
    console.log(
      "upload completed, staus:",
      resp.status,
      "text",
      await resp.text()
    );
  } catch (e) {
    console.error(e);
  }
  return res.send({});
});

/* GET home page. */
router.post("/mint", async (req, res, next) => {
  try {
    const { communityAddress, chainId, userAddress } = req.body;

    const queueId = await mintTo(communityAddress, chainId, userAddress);

    try {
      const response = await waitQueueId(queueId);
      return res.send(response);
    } catch (e) {
      console.error(e);
      return res.status(400).send({ error: e.message });
    }
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: e.message });
  }
});

const mintTo = async (communityAddress, chainId, userAddress) => {
  const url = `${process.env.ENGINE_URL}/contract/${chainId}/${communityAddress}/write`;
  const { result, error } = await (
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-backend-wallet-address": backendWallet,
      },
      body: JSON.stringify({
        functionName: "safeMint",
        args: [userAddress, true], // not verifying any task done and submitting true
        abi: abis.communityAbi,
      }),
    })
  ).json();

  if (error) throw new Error(error.message);

  // console.log(result);

  return result.queueId;
};

const waitQueueId = async (queueId) => {
  return await new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const { result, error } = await (
        await fetch(`${process.env.ENGINE_URL}/transaction/status/${queueId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      ).json();

      if (error) return reject(error.message);

      // console.log(result);
      const isComplete = ["mined", "errored", "cancelled"].includes(
        result.status
      );

      if (isComplete) {
        clearInterval(interval);
        if (result.status == "mined" || result.status == "cancelled")
          return resolve(result);

        return reject(result.status);
      }
    }, 5 * 1000);
  });
};

module.exports = router;

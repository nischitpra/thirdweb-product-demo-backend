var express = require("express");
var router = express.Router();
const { abis } = require("../constants");

const fetch = require("node-fetch");

const backendWallet = process.env.BACKEND_WALLET;
const accessToken = process.env.ACCESS_TOKEN;

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

  console.log(result);

  return result.queueId;
};

const waitQueueId = async (queueId) => {
  return await new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const { result, error } = await (
        await fetch(
          `${process.env.ENGINE_URL}/transaction/status/${queueId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      ).json();

      if (error) return reject(error.message);

      console.log(result);
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

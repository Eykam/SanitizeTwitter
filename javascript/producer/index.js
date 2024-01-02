const express = require("express");
const { Queue, Worker, Job } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
// const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
// import { Worker, Job } from "bullmq";
const { fetchMentions, reconnect, getCredentials } = require("./utils");
const { initVideoWorker } = require("./worker/videoWorker.js");
const { initTranslationWorker } = require("./worker/translationWorker.js");
require("dotenv").config();
require("./worker/videoWorker.js");
// ============================================================== CONSTANTS =======================================================
const ERROR_THRESHOLD = 5;
const CONNECTION = {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_ENV,
    db: 0,
    password: process.env.REDIS_PASSWORD,
    enableReadyCheck: true,
  },
};

let POLL_COUNT = 0;
let ERRORS = 0;
// const POLLING_RATE = 60000;
// const ERROR_RATE_INCREASE = 30000;

let CREDENTIALS;

getCredentials().then((TWITTER_CREDENTIALS) => {
  // CREDENTIALS = TWITTER_CREDENTIALS;
  console.log("Twitter Credentials:", TWITTER_CREDENTIALS);

  // ============================================================== UTILS =========================================================

  const pollingQueue = new Queue("pollingQueue", CONNECTION);

  const mentionQueue = new Queue("mentionQueue", CONNECTION);

  const translationQueue = new Queue("translationQueue", CONNECTION);

  const serverAdapter = new ExpressAdapter();

  serverAdapter.setBasePath("/admin/queues");

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [
      new BullMQAdapter(mentionQueue),
      new BullMQAdapter(pollingQueue),
      new BullMQAdapter(translationQueue),
    ],
    serverAdapter: serverAdapter,
  });

  // ============================================================== SERVER ========================================================

  const app = express();

  app.use("/admin/queues", serverAdapter.getRouter());

  app.listen(3000, () => {
    console.log("Running on 3000...");
    console.log("For the UI, open http://localhost:3000/admin/queues");
    console.log("Make sure Redis is running on port 6379 by default");
  });

  pollingQueue.add(
    "pollingQueue",
    {},
    {
      repeat: {
        every: 10000,
      },
    }
  );

  // ====================================================================== WORKERS ==========================================================
  const pollingWorker = new Worker(
    "pollingQueue",
    (job) => {
      return;
    },

    CONNECTION
  );

  initVideoWorker(TWITTER_CREDENTIALS);
  initTranslationWorker();

  // ================================================================ EVENTS ==================================================================
  const processEvent = () => {
    fetchMentions(TWITTER_CREDENTIALS).then((mentions) => {
      // console.log("Process Event Mentions:", mentions);

      if (mentions && mentions.length > 0) {
        mentionQueue.addBulk(mentions, { attempts: 3 });
      }
    });
  };

  pollingWorker.on("completed", (job, returnvalue) => {
    console.log(
      `============================ REFRESH COUNT ${POLL_COUNT} ==============================`
    );

    if (TWITTER_CREDENTIALS) {
      processEvent();
    } else {
      ERRORS++;
      if (ERRORS >= ERROR_THRESHOLD) {
        //   // POLLING_RATE += ERROR_RATE_INCREASE;
        //   // reconnect();
        // } else {
        console.log("Exceeded Error Threshold! Exiting...");
        process.exit(1);
      }
    }
    POLL_COUNT++;
  });
});

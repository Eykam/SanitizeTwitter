const { Worker, Job, Queue } = require("bullmq");
const { Rettiwt } = require("rettiwt-api");
const fs = require("fs");
const { urls } = require("../urls");

// const rettiwt = (cookies) => {
//   return new Rettiwt({ apiKey: cookies, logging: true });
// };

// const getTweetInfo = (client) => {
//   client.
// }

const CONNECTION = {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_ENV,
    db: 0,
    password: process.env.REDIS_PASSWORD,
    enableReadyCheck: true,
  },
};

const initVideoWorker = (credentials) => {
  const mentionWorker = new Worker(
    "mentionQueue",
    async (job) => {
      const video = await getVideo(
        job.data.inReplyToStatus,
        credentials,
        job.data.command[1]
      );
      return { ...video, mentionId: job.data.mentionId };
    },
    CONNECTION
  );

  mentionWorker.on("completed", (job, returnvalue) => {
    console.log(
      "mentionQueue job",
      job.id,
      "has completed with value",
      returnvalue
    );

    getTranslation(returnvalue).then(() => {
      console.log("Adding translation to queue complete.");
      return returnvalue;
    });
  });
};
// ===================================== UTILS =======================================

const getMaxVariant = (variants) => {
  let max;
  let maxVariant;

  for (const variant in variants) {
    if (variants[variant]["bitrate"]) {
      if (maxVariant) {
        max =
          max < variants[variant]["bitrate"]
            ? variants[variant]["bitrate"]
            : max;
        maxVariant =
          max < variants[variant]["bitrate"] ? variants[variant] : maxVariant;
      } else {
        max = variants[variant]["bitrate"];
        maxVariant = variants[variant];
      }
    }
  }

  return maxVariant;
};

const getMinVariant = (variants) => {
  let min;
  let minVariant;

  for (const variant in variants) {
    if (variants[variant]["bitrate"]) {
      if (minVariant) {
        min =
          min >= variants[variant]["bitrate"]
            ? variants[variant]["bitrate"]
            : min;
        minVariant =
          min >= variants[variant]["bitrate"] ? variants[variant] : minVariant;
      } else {
        min = variants[variant]["bitrate"];
        minVariant = variants[variant];
      }
    }
  }

  return minVariant;
};

const getCorrectEntry = (entries, id) => {
  for (const entry in entries) {
    let currId = entries[entry]["entryId"].split("-")[1];
    if (currId === id) {
      return entries[entry];
    }
  }
  console.log("Correct entry not found!");
};

const logging = async (file) => {
  // store data from entries here from process event mentions
};

const getVideo = async (statusId, credentials, language) => {
  try {
    const threadDataReq = await fetch(
      urls.videoPrefix + statusId + urls.videoSuffix,
      {
        headers: credentials,
        "x-client-uuid": "f541d45a-7887-4c85-9ca0-14b0666316fb",
        origin: "http://localhost:3000",
      }
    );

    const threadDataJSON = await threadDataReq.json();

    const entries =
      threadDataJSON.data.threaded_conversation_with_injections_v2
        .instructions[0].entries;

    const entry = getCorrectEntry(entries, statusId); //not sure if this is the correct ID to check for
    console.log("Entry:", entry);

    const variants =
      entry.content.itemContent.tweet_results.result.legacy.entities.media[0]
        .video_info.variants;

    // console.log("variants:", variants);
    const variant = getMaxVariant(variants);
    // console.log("Variant:", variant);

    const videoUrl = variant.url;
    console.log("variantUrl:", videoUrl);

    const videoReq = await fetch(videoUrl);
    const video = await videoReq.blob();

    console.log("video:", video);

    const filename = statusId + "@" + language;

    return { video: video, filename: filename };
  } catch (e) {
    console.log("Error getting video", e);
    return {};
  }
};

const saveFile = async (blob, filename, mentionId) => {
  const buffer = Buffer.from(await blob.arrayBuffer());

  fs.writeFile("./uploads/" + filename, buffer, async () => {
    const translationQueue = new Queue("translationQueue", CONNECTION);

    console.log("video saved!");
    console.log("translation filename:", filename);

    await translationQueue.add("translationQueue", {
      filename: filename,
      type: blob.type,
      size: blob.size,
      mentionId: mentionId,
    });
  });
};

const getTranslation = async (data) => {
  const video = data.video;

  console.log("translation video:", video);
  console.log("inReplyToStatus:", data.mentionId);
  if (video.type.includes("video") || video.type.includes("audio")) {
    const filename = data.filename + "." + video.type.split("/")[1];
    saveFile(video, filename, data.mentionId);
  }
};

module.exports = {
  initVideoWorker,
};

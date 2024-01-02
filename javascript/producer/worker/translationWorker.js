const { Worker, Job } = require("bullmq");
// const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { urls } = require("../urls");

const CONNECTION = {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_ENV,
    db: 0,
    password: process.env.REDIS_PASSWORD,
    enableReadyCheck: true,
  },
};

const TRANSLATION_URL = "http://twitter-driver-container:5005/postTranslation";

const initTranslationWorker = () => {
  console.log("Intializing translation Worker...");
  const translationWorker = new Worker(
    "translationQueue",
    async (job) => {
      console.log("Getting Translation for:", job.data.filename);
      console.log("job", job.data);
      const translation = await getTranslation(
        job.data.filename,
        job.data.type,
        job.data.mentionId
      );
      return translation;
    },
    CONNECTION
  );

  translationWorker.on("completed", async (job, returnvalue) => {
    console.log(`======================== \n Posting video for ${returnvalue}`);
  });
};
// ===================================== UTILS =======================================
const getFile = (filename) => {
  let currPath = path.resolve("/app", "./uploads/" + filename);
  console.log("path", currPath);
  let data = fs.readFileSync(currPath);

  // console.log("d: ", data);
  return data;
};

const saveFile = async (blob, filename, inReplyToStatus) => {
  const buffer = Buffer.from(await blob.arrayBuffer());
  let filepath = "./uploads/subtitle-" + filename;
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, buffer, async () => {
      try {
        let postRes = await fetch(TRANSLATION_URL, {
          method: "POST",
          body: JSON.stringify({
            in_reply_to: inReplyToStatus,
            video_path: filepath,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        let post = await postRes.json();
        console.log("Successfully posted tweet!", post);
        resolve(post);
      } catch (err) {
        reject("Error posting tweet!" + err);
      }
    });
  });
};

//try catch here to add to error / retry queue
const getTranslation = async (filename, type, inReplyToStatus) => {
  const formData = new FormData();
  let fileBuffer = getFile(filename);
  let fileBlob = new Blob([fileBuffer], { type: type });
  let currFile = new File([fileBlob], filename, { type: type });

  // console.log("file", currFile);
  formData.append("file", currFile);
  console.log("formdata", formData);

  const translationRes = await fetch(urls.translation, {
    method: "post",
    body: formData,
    // "Content-Type": file.type,
  });

  console.log("here!");
  const translation = await translationRes.blob();
  console.log("translation:", translation);

  return await saveFile(translation, filename, inReplyToStatus);
};

module.exports = {
  initTranslationWorker,
};

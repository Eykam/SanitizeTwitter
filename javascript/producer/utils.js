const { Auth } = require("rettiwt-auth");
const { urls } = require("./urls");
const {
  setConversationTranslation,
  updateUserLimit,
} = require("./redis/redisClient");
const { read } = require("fs");
require("dotenv");

const CREDENTIALS_URL = "http://twitter-driver-container:5005/getCredentials";
const PING_URL = "http://twitter-driver-container:5005/ping";
const MAX_RETRIES = 6;
const RETRY_INTERVAL = 10000;

const getTestCredentials = async () => {
  const credential = {
    authorization: process.env.AUTHORIZATION,
    "x-csrf-token": process.env.XCSRF,
    cookie: process.env.COOKIE,
  };

  return credential;
};

const waitForServerReady = async () => {
  const serverUrl = PING_URL;
  const maxRetries = MAX_RETRIES;
  const retryInterval = RETRY_INTERVAL; // in milliseconds

  let retries = 0;

  async function pingServer() {
    let response = await fetch(serverUrl);
    return true;
  }

  let ready = false;

  while (!ready) {
    try {
      const serverReady = await pingServer();

      if (serverReady) {
        ready = serverReady;
      }
    } catch (err) {
      retries += 1;
      console.log("Ping #", retries);
      await new Promise((r) => setTimeout(r, retryInterval));
    }
  }

  return false;
};

const getCredentials = async () => {
  await waitForServerReady();

  try {
    let credentialsReq = await fetch(CREDENTIALS_URL, { method: "GET" });
    let credentials = await credentialsReq.json();

    // console.log("Credentials:", credentials);

    return credentials;
  } catch (err) {
    console.error("Error getting credentials:");
    // throw err; // Propagate the error
  }
  // return (
  //   await new Auth().getUserCredential({
  //     email: process.env.EMAIL,
  //     userName: process.env.TWITTER_HANDLE,
  //     password: process.env.PASSWORD,
  //   })
  // ).toHeader();
  // return await getTestCredentials;
};

const fetchMentions = async (creds) => {
  console.log("Fetching Mentions...");

  const res = await fetch(urls.mentions, {
    headers: creds,
    "x-client-uuid": "f541d45a-7887-4c85-9ca0-14b0666316fb",
  });

  const data = await res.json();

  const serializedMentions = await serializeEvent(data);

  // console.log("Serialized Event:", serializedMentions);
  return serializedMentions;
};

const serializeEvent = async (data) => {
  users = data["globalObjects"]["users"];
  tweets = data["globalObjects"]["tweets"];

  let results = [];

  for (const currMention in tweets) {
    // console.log("CurrMention:", currMention);
    let mention = tweets[currMention];
    // console.log("mention data", mention);
    let inReplyToUser = mention["in_reply_to_user_id_str"];
    let inReplyToStatus = mention["in_reply_to_status_id_str"];
    let mentionId = mention["id_str"];
    let mentionUserId = mention["user_id_str"];
    let fullText = mention["full_text"];
    let conversationId = mention["conversation_id"];

    let mentionScreenName = users[mentionUserId]["screen_name"];
    fullText = fullText.replace("—", "--");
    let command = fullText.match("--translate (\\w*)");

    // console.log("command", command);
    if (command) {
      const conversationCheck = await setConversationTranslation(
        inReplyToStatus,
        command[1]
      );

      // console.log("conversationCheck", conversationCheck);
      if (conversationCheck) {
        const userLimitNotExceeded = true; //await updateUserLimit(mentionUserId);

        // console.log("inReplyToStatus", inReplyToStatus);
        // console.log("userLimitNotExceeded", userLimitNotExceeded);
        if (inReplyToStatus && userLimitNotExceeded) {
          let event = {
            name: "mentionQueue",
            data: {
              mentionId: mentionId,
              mentionUserId: mentionUserId,
              rawText: fullText,
              command: command,
              conversationId: conversationId,
              inReplyToUser: inReplyToUser,
              inReplyToStatus: inReplyToStatus,
              callback_url: `${process.env.TWITTER_BASE_URL}/${mentionScreenName}/status/${mentionId}`,
              data_url: `${process.env.TWITTER_BASE_URL}/${inReplyToUser}/status/${inReplyToStatus}`,
            },
          };

          console.log("Serialized Mention:", event);
          results.push(event);
        }
      }
    }
  }

  return results;
};

const reconnect = async () => {
  let curr = await getCredentials();

  if (!curr) {
    process.exit(1);
  }

  return curr;
};

module.exports = { getCredentials, fetchMentions, reconnect };

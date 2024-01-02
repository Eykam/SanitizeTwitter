const Redis = require("ioredis");
require("dotenv").config();

const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_URL = process.env.REDIS_HOST;

const conversationChannel = new Redis({
  host: REDIS_URL,
  port: REDIS_PORT,
  keyPrefix: "conversations:",
  password: process.env.REDIS_PASSWORD,
});

const userChannel = new Redis({
  host: REDIS_URL,
  port: REDIS_PORT,
  keyPrefix: "users:",
  password: process.env.REDIS_PASSWORD,
});

const checkTranslationExists = async (key, value) => {
  const isMember = await conversationChannel.sismember(key, value);
  if (isMember) {
    return true;
  } else {
    return false;
  }
};

const setConversationTranslation = async (key, value) => {
  const exists = await checkTranslationExists(key, value);
  if (!exists) {
    await conversationChannel.sadd(key, value);
    console.log(`Adding new translation ${value} to conversation ${key}`);
    return true;
  }

  return false;
};

const checkUserLimit = async (key) => {
  const curr = await userChannel.get(key);
  if (curr && curr >= process.env.REQUEST_LIMIT) return -1;
  return curr ? Number(curr) : 0;
};

const updateUserLimit = async (key) => {
  const limit = await checkUserLimit(key);
  if (limit === 0) {
    userChannel.set(key, 1);
    userChannel.expire(key, process.env.TOKENS_REFRESH_DURATION);

    console.log(`Adding new user ${key} to rate limiter`);

    return true;
  } else if (limit === -1) {
    console.log("Exceeded user limit for", key);

    return false;
  } else {
    userChannel.set(key, limit + 1);

    console.log(`Updating usage to ${limit + 1}for ${key} in rate limiter`);

    return true;
  }
};

module.exports = {
  checkTranslationExists,
  checkUserLimit,
  setConversationTranslation,
  updateUserLimit,
  conversationChannel,
  userChannel,
};

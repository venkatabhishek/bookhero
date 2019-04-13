const secrets = {
  dbUri: process.env.DB_URI || 'mongodb+srv://abhi:as70rv65@cluster0-zafev.mongodb.net/test',
};

const getSecret = (key) => secrets[key];

module.exports = { getSecret };

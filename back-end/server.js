const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (error) => {
  console.log(error);
  console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN...');

  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    autoIndex: true,
  })
  .then(() => {
    console.log('DB connection succesful!');
  });

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Server up on port 3000');
});

process.on('unhandledRejection', (error) => {
  console.log(error);
  console.log('UNHANDLED REJECTION! SHUTTING DOWN...');
  server.close(() => {
    process.exit(1);
  });
});

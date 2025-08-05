import dotenv from 'dotenv'
import app from './app'
import connectDb from './src/db';

dotenv.config();

const port: number = parseInt(process.env.PORT || '8800', 10);
connectDb()
.then(() => {
    app.on("error", (err) => {
      console.log("Error while connecting from express", err);
    });

    app.listen(port, () => {
      console.log(`server connection at ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error in connecting db", err);
  });
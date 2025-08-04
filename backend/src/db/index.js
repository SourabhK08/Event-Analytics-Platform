import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}${process.env.DB_NAME}`
    );

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Error in connection of DB", error);
    process.exit(1);
  }
};

export default connectDb;

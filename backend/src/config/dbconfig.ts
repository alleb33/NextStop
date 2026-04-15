import mongoose from "mongoose";
import Trip from "../models/trip.model";

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(`${process.env.CONNECTION_STRING}`);
    await Trip.deleteMany({ ownerKey: { $exists: false } });
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

};

export default connectDb;

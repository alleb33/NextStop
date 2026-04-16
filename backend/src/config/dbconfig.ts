import mongoose from "mongoose";
import Trip from "../models/trip.model";

const connectDb = async () => {
  try {
    const connectionString = process.env.CONNECTION_STRING?.trim();

    if (
      !connectionString ||
      connectionString === "your_mongodb_connection_string" ||
      (!connectionString.startsWith("mongodb://") &&
        !connectionString.startsWith("mongodb+srv://"))
    ) {
      throw new Error(
        "Invalid CONNECTION_STRING. Set backend/.env with a valid MongoDB URI starting with mongodb:// or mongodb+srv://."
      );
    }

    const connect = await mongoose.connect(connectionString);
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

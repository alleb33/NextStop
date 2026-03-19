import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    address: { type: String, default: "" },
    suggestedTimeSlot: { type: String, default: "" },
    estimatedDurationMinutes: { type: Number, default: 60 },
    coordinates: {
      lon: { type: Number, default: null },
      lat: { type: Number, default: null },
    },
    source: { type: String, default: "geoapify" },
  },
  { _id: false }
);

const itineraryDaySchema = new Schema(
  {
    dayNumber: { type: Number, required: true },
    activities: { type: [activitySchema], default: [] },
  },
  { _id: false }
);

const tripInputSchema = new Schema(
  {
    destinationCity: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1, max: 14 },
    interests: { type: [String], default: [] },
    selectedAttractions: { type: [String], default: [] },
    constraints: {
      maxActivitiesPerDay: { type: Number, default: 3 },
      blockedWindows: { type: [String], default: [] },
    },
  },
  { _id: false }
);

const tripSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    tripInput: { type: tripInputSchema, required: true },
    itineraryDays: { type: [itineraryDaySchema], required: true, default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    notes: { type: [String], default: [] },
    unassignedActivities: { type: [activitySchema], default: [] },
  },
  { timestamps: true }
);

const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

export default Trip;

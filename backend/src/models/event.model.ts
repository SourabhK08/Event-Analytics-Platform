import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId; // MongoDB auto ID (for CRUD operations)
  eventId: string; // Business ID (for deduplication)
  userId: string; // User who performed action
  eventName: string; // Event type: 'signup', 'page_view'
  properties: Record<string, any>; // Flexible event data
  timestamp: Date; // When event occurred
  sessionId?: string;
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      trim: true,
      sparse: true, // Allows null/undefined
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Event = mongoose.model<IEvent>("Event", eventSchema);

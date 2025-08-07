import mongoose, { Document, Schema } from "mongoose";

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  apiKey: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    apiKey: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>("Project", projectSchema);

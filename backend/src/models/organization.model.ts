import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  email: string;
  website?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const organizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema
);

import mongoose from "mongoose";

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "token is required to be added in blacklist"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // ✅ 24 hours baad auto-delete — JWT expiry ke saath match karta hai
    },
  },
  {
    timestamps: true,
  },
);

const tokenBlacklistModel = mongoose.model(
  "blacklistTokens",
  blacklistTokenSchema,
);

export default tokenBlacklistModel;

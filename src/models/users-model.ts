import { Document, Model, Schema, model } from "mongoose";
import * as validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Define the User interface
interface UserInterface extends Document {
  photo?: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword?: string | undefined;
  passwordChangedDate?: Date;
  role: string;
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
}

interface UserInterfaceMethods {
  checkPasswordChangedAfter(tokenIssueDate: number): boolean;
  createPasswordResetToken(): string;
  comparePassword(incomingPassword: string): Promise<boolean>;
}

type TypeUserModel = Model<UserInterface, {}, UserInterfaceMethods>;

// FUNCTION
// Define the User schema
const userSchema = new Schema<
  UserInterface,
  TypeUserModel,
  UserInterfaceMethods
>(
  {
    photo: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/.test(v); // Example validation for a URL ending with an image extension
        },
        message: (props) => `${props.value} is not a valid photo URL!`,
      },
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name must be less than 50 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      unique: [true, "Phone number must be unique"],
      validate: {
        validator: function (v: string) {
          return /^\d{11}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    confirmPassword: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          // `this` refers to the current document being validated
          return v === this.password;
        },
        message: "Passwords do not match",
      },
    },
    passwordChangedDate: {
      type: Date,
    },
    role: {
      type: String,
      required: [true, "role must be specified"],
      enum: {
        values: ["admin", "teacher", "student"],
        message:
          "invalid role {VALUE}, valid roles are admin, teacher, student",
      },
      default: "student",
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.confirmPassword;

        return ret;
      },
    },
  }
);

// FUNCTION
// Pre-save middleware
userSchema.pre("save", async function (next): Promise<void> {
  // if user have modified the password than encrypt it again
  if (!this.isModified("password")) {
    return next();
  } else {
    // encrypt the password field
    this.password = await bcrypt.hash(this.password, 12);

    this.confirmPassword = undefined;

    next();
  }
  next();
});

// FUNCTION
// this is an instance method
userSchema.method(
  "checkPasswordChangedAfter",
  function (tokenIssueDate: number) {
    // this in instance method points to current document
    if (this.passwordChangedDate) {
      const date = new Date(this.passwordChangedDate);
      const unixTimestamp = Math.floor(date.getTime() / 1000);
      return tokenIssueDate > unixTimestamp;
    }

    return false;
  }
);

// FUNCTION generate random token for forgot passwords
userSchema.method("createPasswordResetToken", function (): string {
  // 1 : create a token using crypt
  const resetToken = crypto.randomBytes(32).toString("hex"); // 32 bit string in hex format

  // 2 : encrypt that original token and store it on the user object, then store that user in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3 :  reset token expires in 10 mins
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  // 4 : return that original token
  return resetToken;
});

// FUNCTION compare the stored password with incoming password
userSchema.method(
  "comparePassword",
  async function (incomingPassword): Promise<boolean> {
    console.log(incomingPassword);
    console.log(this.password);
    return await bcrypt.compare(incomingPassword, this.password);
  }
);

// Create the User model
const UserModel = model<UserInterface, TypeUserModel>("User", userSchema);

export { UserModel, UserInterface };

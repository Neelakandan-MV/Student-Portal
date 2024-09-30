import mongoose, { Document, Schema } from 'mongoose';

// Define the user interface
interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  phone: string;
}

// Create the user schema
const userSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
});

// Create and export the User model
const User = mongoose.model<IUser>('User', userSchema);
export default User;

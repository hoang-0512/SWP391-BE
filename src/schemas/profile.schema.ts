import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type ProfileDocument = Profile & Document;

@Schema({ versionKey: false })
export class Profile extends Document {
  @Prop({ required: false })
  name: string;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender: string;

  @Prop()
  birth: Date;

  @Prop()
  address: string;

  @Prop()
  avatar: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

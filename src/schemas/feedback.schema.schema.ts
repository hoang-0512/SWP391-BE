import { FeedbackStatus } from '../enums/feedback.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Parent', required: true })
  parent: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ trim: true, default: null })
  response: string;

  @Prop({ enum: FeedbackStatus, default: FeedbackStatus.PENDING })
  status: boolean;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

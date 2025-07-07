import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class TreatmentHistory extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: false })
  staff: Types.ObjectId;

 @Prop({ default: Date.now })
date: Date;

  @Prop({ required: true, trim: true })
  class: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ required: true, trim: true })
  contactStatus: string;

  @Prop({ required: true, trim: true })
  priority: string;

  // Các thuộc tính mới cho việc cập nhật trạng thái điều trị
  @Prop({ required: false, trim: true })
  actionTaken?: string;

  @Prop({ required: false, default: false })
  contactParent?: boolean;

  @Prop({ required: false, trim: true })
  notes?: string;

  @Prop({
    required: false,
    trim: true,
    enum: ['pending', 'processing', 'resolved'],
    default: 'processing'
  })
  status?: string;
}

export const TreatmentHistorySchema =
  SchemaFactory.createForClass(TreatmentHistory);

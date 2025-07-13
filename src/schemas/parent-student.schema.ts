import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ParentStudentDocument = ParentStudent & Document;

@Schema({
  versionKey: false,
  timestamps: true, // Add timestamps
})
export class ParentStudent extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Parent', required: true })
  parent: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Student', required: true })
  student: MongooseSchema.Types.ObjectId;
}

export const ParentStudentSchema = SchemaFactory.createForClass(ParentStudent);

// Add compound index to prevent duplicate relationships
ParentStudentSchema.index({ parent: 1, student: 1 }, { unique: true });

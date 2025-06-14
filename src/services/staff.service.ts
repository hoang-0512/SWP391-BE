import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff, StaffDocument } from '@/schemas/staff.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
  ) {}

  async findAll(): Promise<Staff[]> {
    return this.staffModel.find().populate('userId').exec();
  }

  async findById(id: string): Promise<Staff> {
    const staff = await this.staffModel.findById(id).populate('userId').exec();
    if (!staff) {
      throw new NotFoundException(`Staff with ID "${id}" not found`);
    }
    return staff;
  }

  async findByUserId(userId: string): Promise<Staff | null> {
    return this.staffModel.findOne({ userId }).exec();
  }

  async create(createStaffDto: any): Promise<Staff> {
    // Check if staff with this userId already exists
    const existingStaff = await this.staffModel
      .findOne({ userId: createStaffDto.userId })
      .exec();

    if (existingStaff) {
      throw new ConflictException('A staff with this user ID already exists');
    }

    const createdStaff = new this.staffModel(createStaffDto);
    return createdStaff.save();
  }

  async update(id: string, updateStaffDto: any): Promise<Staff> {
    const updatedStaff = await this.staffModel
      .findByIdAndUpdate(
        id,
        { ...updateStaffDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!updatedStaff) {
      throw new NotFoundException(`Staff with ID "${id}" not found`);
    }

    return updatedStaff;
  }

  async remove(id: string): Promise<any> {
    const deletedStaff = await this.staffModel.findByIdAndDelete(id).exec();

    if (!deletedStaff) {
      throw new NotFoundException(`Staff with ID "${id}" not found`);
    }

    return { id, deleted: true };
  }
}

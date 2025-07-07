
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TreatmentHistory } from '@/schemas/treatment-history.schema';
import { CreateTreatmentHistoryDto } from '@/decorations/dto/create-treatment-history.dto';
import { UpdateTreatmentHistoryDto } from '@/decorations/dto/update-treatment-history.dto';
import { StudentService } from './student.service';
import { HealthRecordService } from './health-record.service';
import { ParentService } from './parent.service';
import { ParentStudent } from '@/schemas/parent-student.schema';
import { Student } from '@/schemas/student.schema';
import { UpdateTreatmentStatusDto } from '@/decorations/dto/update-treatment-history.dto';

@Injectable()
export class TreatmentHistoryService {
  constructor(
    @InjectModel(TreatmentHistory.name)
    private treatmentHistoryModel: Model<TreatmentHistory>,
    private parentService: ParentService,
    private studentService: StudentService,
  ) {}

  async create(
    createTreatmentHistoryDto: CreateTreatmentHistoryDto,
  ): Promise<TreatmentHistory> {
    const createdTreatmentHistory = new this.treatmentHistoryModel(
      createTreatmentHistoryDto,
    );
    const result = await createdTreatmentHistory.save();


    
    return result;
  }

  async findAll(): Promise<TreatmentHistory[]> {
    return this.treatmentHistoryModel
      .find()
      .populate('student')
      .populate('staff')
      .exec();
  }

  async findById(id: string): Promise<TreatmentHistory> {
    const treatmentHistory = await this.treatmentHistoryModel
      .findById(id)
      .populate('student')
      .populate('staff')
      .exec();

    if (!treatmentHistory) {
      throw new NotFoundException(`Treatment history with ID ${id} not found`);
    }

    return treatmentHistory;
  }
  async findByStudentId(studentId: string): Promise<TreatmentHistory[]> {
    return this.treatmentHistoryModel
      .find({ student: studentId })
      .populate('staff')
      .exec();
  }

  async findByStaffId(staffId: string): Promise<TreatmentHistory[]> {
    return this.treatmentHistoryModel
      .find({ staff: staffId })
      .populate('student')
      .exec();
  }

  // find by parentId
  async findByParentId(parentId: string): Promise<TreatmentHistory[]> {

    // find all students associated with the parent
    const parentStudents = await this.studentService.findByParentId(parentId);
    if (!parentStudents || parentStudents.length === 0) {
      throw new NotFoundException(`No students found for parent ID ${parentId}`);
    }

    // find all treatment histories for those students
    const treatmentHistories = await this.treatmentHistoryModel
      .find({ student: { $in: parentStudents.map((student) => student._id) } })
      .populate('staff')
      .exec();

    return treatmentHistories;
  }

  async update(
    id: string,
    updateTreatmentHistoryDto: UpdateTreatmentHistoryDto,
  ): Promise<TreatmentHistory> {
    const updatedTreatmentHistory = await this.treatmentHistoryModel
      .findByIdAndUpdate(id, updateTreatmentHistoryDto, { new: true })
      .populate('student')
      .populate('staff')
      .exec();

    if (!updatedTreatmentHistory) {
      throw new NotFoundException(`Treatment history with ID ${id} not found`);
    }

    return updatedTreatmentHistory;
  }

  async remove(id: string): Promise<TreatmentHistory> {
    const deletedTreatmentHistory = await this.treatmentHistoryModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedTreatmentHistory) {
      throw new NotFoundException(`Treatment history with ID ${id} not found`);
    }

    return deletedTreatmentHistory;
  }

  // UpdateTreatmentStatusDto
  async updateStatus(
    id: string,
    updateTreatmentStatusDto: UpdateTreatmentStatusDto,
  ): Promise<TreatmentHistory> {
    console.log(updateTreatmentStatusDto);
    const updatedTreatmentHistory = await this.treatmentHistoryModel
      .findByIdAndUpdate(id, updateTreatmentStatusDto, { new: true })
      .populate('student')  
      .populate('staff')
      .exec();

    if (!updatedTreatmentHistory) {
      throw new NotFoundException(`Treatment history with ID ${id} not found`);
    }

    return updatedTreatmentHistory;
  }
}

import { Parent } from '@/schemas/parent.schema';
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ParentStudent, ParentStudentDocument } from '@/schemas/parent-student.schema';
import { CreateParentStudentDto } from '@/decorations/dto/create-parent-student.dto';
import { UpdateParentStudentDto } from '@/decorations/dto/update-parent-student.dto';
import { StudentService } from './student.service';
import { HealthRecordService } from './health-record.service';
import { ParentService } from './parent.service';
import path from 'path';
import { UserService } from './user.service';

@Injectable()
export class ParentStudentService {
  constructor(
    @InjectModel(ParentStudent.name)
    private parentStudentModel: Model<ParentStudentDocument>,
    @Inject(forwardRef(() => HealthRecordService))
    private healthRecordService: HealthRecordService,
    private parentService: ParentService,
    private userService: UserService,
    @Inject(forwardRef(() => StudentService))
    private studentService: StudentService,
  ) {}

  async create(createParentStudentDto: CreateParentStudentDto): Promise<ParentStudent> {
    console.log('Creating parent-student relationship with data:', createParentStudentDto);

    // Validate ObjectId formats
    if (!Types.ObjectId.isValid(createParentStudentDto.parent)) {
      throw new BadRequestException(`Invalid parent ID format: ${createParentStudentDto.parent}`);
    }

    if (!Types.ObjectId.isValid(createParentStudentDto.student)) {
      throw new BadRequestException(`Invalid student ID format: ${createParentStudentDto.student}`);
    }

    // Check if parent exists
    try {
      const parentExists = await this.parentService.findById(createParentStudentDto.parent);
      if (!parentExists) {
        throw new BadRequestException(`Parent with ID ${createParentStudentDto.parent} not found`);
      }
      console.log('Parent found:', parentExists);
    } catch (error) {
      console.error('Error finding parent:', error);
      throw new BadRequestException(`Parent with ID ${createParentStudentDto.parent} not found`);
    }

    // Check if student exists
    try {
      const studentExists = await this.studentService.findById(createParentStudentDto.student);
      if (!studentExists) {
        throw new BadRequestException(
          `Student with ID ${createParentStudentDto.student} not found`,
        );
      }
      console.log('Student found:', studentExists);
    } catch (error) {
      console.error('Error finding student:', error);
      throw new BadRequestException(`Student with ID ${createParentStudentDto.student} not found`);
    }

    // Check if relationship already exists
    const existingRelationship = await this.parentStudentModel.findOne({
      parent: createParentStudentDto.parent,
      student: createParentStudentDto.student,
    });

    if (existingRelationship) {
      throw new BadRequestException('Parent-student relationship already exists');
    }

    // Create the relationship with explicit ObjectId conversion
    const relationshipData = {
      parent: new Types.ObjectId(createParentStudentDto.parent),
      student: new Types.ObjectId(createParentStudentDto.student),
    };

    console.log('Creating relationship with data:', relationshipData);

    const createdParentStudent = new this.parentStudentModel(relationshipData);
    const savedRelationship = await createdParentStudent.save();

    console.log('Saved parent-student relationship:', savedRelationship);

    // Return populated result
    return savedRelationship.populate(['parent', 'student']);
  }

  async findAll(): Promise<ParentStudent[]> {
    this.healthRecordService.getHealthRecordsByStudentId;
    return this.parentStudentModel.find().populate('parent').populate('student').exec();
  }

  async findById(id: string): Promise<ParentStudent> {
    const parentStudent = await this.parentStudentModel
      .findById(id)
      .populate('parent')
      .populate('student')
      .exec();

    if (!parentStudent) {
      throw new NotFoundException(`Parent-Student relationship with ID ${id} not found`);
    }

    return parentStudent;
  }

  async findByStudentId(studentId: string): Promise<ParentStudent[]> {
    return this.parentStudentModel.find({ student: studentId }).populate('parent').exec();
  }

  async update(id: string, updateParentStudentDto: UpdateParentStudentDto): Promise<ParentStudent> {
    const updatedParentStudent = await this.parentStudentModel
      .findByIdAndUpdate(id, updateParentStudentDto, { new: true })
      .populate('parent')
      .populate('student')
      .exec();

    if (!updatedParentStudent) {
      throw new NotFoundException(`Parent-Student relationship with ID ${id} not found`);
    }

    return updatedParentStudent;
  }

  async remove(id: string): Promise<ParentStudent> {
    const deletedParentStudent = await this.parentStudentModel.findByIdAndDelete(id).exec();

    if (!deletedParentStudent) {
      throw new NotFoundException(`Parent-Student relationship with ID ${id} not found`);
    }

    return deletedParentStudent;
  }

  /**
   * Tạo parent-student từ parent email và studentId
   */
  async createByParentEmail(parentEmail: string, studentId: string): Promise<ParentStudent> {
    // 1. Tìm user theo email
    const user = await this.userService.findByEmail(parentEmail);
    const userId = (user as any)?._id?.toString();
    if (!user || !userId) {
      throw new NotFoundException(`Không tìm thấy user với email ${parentEmail}`);
    }
    // 2. Tìm parent profile theo userId
    const parent = await this.parentService.findByUserId(userId);
    if (!parent || !(parent as any)._id) {
      throw new NotFoundException(`Không tìm thấy parent profile cho user ${parentEmail}`);
    }
    // 3. Tạo parent-student
    const createdParentStudent = new this.parentStudentModel({
      parent: (parent as any)._id,
      student: studentId,
    });
    return createdParentStudent.save();
  }

  /**
   * Find all students for a parent including their health records
   */
  async findByUserId(userId: string): Promise<any[]> {
    const parent = (await this.parentService.findByUserId(userId)) as Parent;
    if (!parent) {
      throw new NotFoundException(`Parent with user ID "${userId}" not found`);
    }
    const parentId = (parent as any)._id.toString();
    const parentStudents = await this.parentStudentModel
      .find({ parent: parentId })
      .populate({
        path: 'student',
        populate: {
          path: 'class',
          select: 'name',
        },
      })
      .populate('parent')
      .lean() // <-- Add lean() to get plain JS objects
      .exec();
    if (!parentStudents || parentStudents.length === 0) {
      return [];
    }
    const studentsWithHealthRecords = await Promise.all(
      parentStudents.map(async (ps: any) => {
        const student = ps.student;
        const parentObj = ps.parent;
        if (!student || !student._id) {
          // Log bản ghi bị loại bỏ
          console.warn(
            '[ParentStudentService] Bỏ qua parent-student vì student null hoặc thiếu _id:',
            ps,
          );
          return null;
        }
        const healthRecord = await this.healthRecordService.getHealthRecordsByStudentId(
          student._id.toString(),
        );

        return {
          student,
          parent: parentObj,
          healthRecord: healthRecord || null,
        };
      }),
    );
    // Lọc bỏ các phần tử null (nếu có)
    return studentsWithHealthRecords.filter(Boolean);
  }
}

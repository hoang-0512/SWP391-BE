import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HealthExamination,
  HealthExaminationDocument,
  ExaminationStatus,
} from '@/schemas/health-examination.schema';
import { NotificationService } from './notification.service';
import { StudentService } from './student.service';
import { CreateHealthExaminationDto } from '@/decorations/dto/health-examination.dto';

@Injectable()
export class HealthExaminationService {
  constructor(
    @InjectModel(HealthExamination.name)
    private healthExaminationModel: Model<HealthExaminationDocument>,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    private studentService: StudentService,
  ) {}

  async create(createDto: CreateHealthExaminationDto, staffId: string) {
    try {
      if (createDto.target_type === 'grade') {
        return await this.createForGradeLevels(createDto, staffId);
      } else {
        return await this.createForIndividualStudent(createDto, staffId);
      }
    } catch (error) {
      console.error('Error creating health examination:', error);
      throw error;
    }
  }

  private async createForGradeLevels(createDto: CreateHealthExaminationDto, staffId: string) {
    if (!createDto.grade_levels || createDto.grade_levels.length === 0) {
      throw new BadRequestException('Grade levels are required');
    }

    const results: any[] = [];

    for (const gradeLevel of createDto.grade_levels) {
      // Tìm tất cả học sinh trong khối
      const studentsInGrade = await this.findStudentsByGradeLevel(gradeLevel);

      for (const student of studentsInGrade) {
        const examination = new this.healthExaminationModel({
          title: createDto.title,
          description: createDto.description,
          examination_date: createDto.examination_date,
          examination_time: createDto.examination_time,
          location: createDto.location,
          doctor_name: createDto.doctor_name,
          examination_type: createDto.examination_type,
          student_id: student.student._id, // Access the student ID from the formatted response
          created_by: staffId,
          status: ExaminationStatus.PENDING,
          grade_level: gradeLevel,
        });

        const savedExamination = await examination.save();
        results.push(savedExamination);

        // Gửi thông báo cho phụ huynh
        try {
          await this.notificationService.createHealthExaminationNotification(
            (savedExamination._id as Types.ObjectId).toString(),
            student.student._id.toString(),
            createDto.title,
            createDto.description,
            createDto.examination_date,
            createDto.examination_time,
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Continue with the process even if notification fails
        }
      }
    }

    return {
      message: `Đã tạo ${results.length} lịch khám cho ${createDto.grade_levels.length} khối học`,
      examinations: results,
      total_created: results.length,
    };
  }

  private async createForIndividualStudent(createDto: CreateHealthExaminationDto, staffId: string) {
    if (!createDto.student_id) {
      throw new BadRequestException('Student ID is required');
    }

    const examination = new this.healthExaminationModel({
      title: createDto.title,
      description: createDto.description,
      examination_date: createDto.examination_date,
      examination_time: createDto.examination_time,
      location: createDto.location,
      doctor_name: createDto.doctor_name,
      examination_type: createDto.examination_type,
      student_id: createDto.student_id,
      created_by: staffId,
      status: ExaminationStatus.PENDING,
    });

    const savedExamination = await examination.save();

    // Gửi thông báo cho phụ huynh
    try {
      await this.notificationService.createHealthExaminationNotification(
        (savedExamination._id as Types.ObjectId).toString(),
        createDto.student_id,
        createDto.title,
        createDto.description,
        createDto.examination_date,
        createDto.examination_time,
      );
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with the process even if notification fails
    }

    return savedExamination.populate(['student_id', 'created_by']);
  }

  private async findStudentsByGradeLevel(gradeLevel: number) {
    try {
      const students = await this.studentService.findByGradeLevel(gradeLevel);
      return students;
    } catch (error) {
      console.error(`Error finding students for grade level ${gradeLevel}:`, error);
      return [];
    }
  }

  async findAll(query: any = {}) {
    return this.healthExaminationModel
      .find(query)
      .populate(['student_id', 'created_by'])
      .sort({ created_at: -1 });
  }

  async findOne(id: string) {
    const examination = await this.healthExaminationModel
      .findById(id)
      .populate(['student_id', 'created_by']);

    if (!examination) {
      throw new NotFoundException('Health examination not found');
    }

    return examination;
  }

  async updateStatus(id: string, status: ExaminationStatus) {
    const examination = await this.healthExaminationModel.findById(id);

    if (!examination) {
      throw new NotFoundException('Health examination not found');
    }

    examination.status = status;
    examination.updated_at = new Date();

    return examination.save();
  }

  async getCompletedExaminationsByStudent(studentId: string) {
    return this.healthExaminationModel
      .find({
        student_id: studentId,
        status: ExaminationStatus.COMPLETED,
      })
      .populate(['student_id', 'created_by'])
      .sort({ examination_date: -1 });
  }

  async getPendingExaminationsByStudent(studentId: string) {
    return this.healthExaminationModel
      .find({
        student_id: studentId,
        status: ExaminationStatus.PENDING,
      })
      .populate(['student_id', 'created_by'])
      .sort({ examination_date: -1 });
  }

  async approveExaminationByStudent(studentId: string, examinationId: string) {
    const examination = await this.healthExaminationModel.findOne({
      _id: examinationId,
      student_id: studentId,
      status: ExaminationStatus.PENDING,
    });

    if (!examination) {
      throw new NotFoundException('Không tìm thấy lịch khám đang chờ xử lý cho học sinh này');
    }

    examination.status = ExaminationStatus.APPROVED;
    examination.updated_at = new Date();

    const result = await examination.save();

    return {
      message: 'Đã phê duyệt lịch khám sức khỏe',
      examination: result,
      student_id: studentId,
      examination_id: examinationId,
    };
  }

  async cancelExaminationByStudent(studentId: string, examinationId: string) {
    const examination = await this.healthExaminationModel.findOne({
      _id: examinationId,
      student_id: studentId,
      status: ExaminationStatus.PENDING,
    });

    if (!examination) {
      throw new NotFoundException('Không tìm thấy lịch khám đang chờ xử lý cho học sinh này');
    }

    examination.status = ExaminationStatus.CANCELLED;
    examination.updated_at = new Date();

    const result = await examination.save();

    return {
      message: 'Đã hủy lịch khám sức khỏe',
      examination: result,
      student_id: studentId,
      examination_id: examinationId,
    };
  }

  async updateHealthExaminationResult(
    examinationId: string,
    updateData: {
      health_result?: string;
      examination_notes?: string;
      recommendations?: string;
      follow_up_required?: boolean;
      follow_up_date?: Date;
    },
  ) {
    const examination = await this.healthExaminationModel.findById(examinationId);

    if (!examination) {
      throw new NotFoundException('Health examination not found');
    }

    // Update examination results
    if (updateData.health_result !== undefined) {
      examination.health_result = updateData.health_result;
    }
    if (updateData.examination_notes !== undefined) {
      examination.examination_notes = updateData.examination_notes;
    }
    if (updateData.recommendations !== undefined) {
      examination.recommendations = updateData.recommendations;
    }
    if (updateData.follow_up_required !== undefined) {
      examination.follow_up_required = updateData.follow_up_required;
    }
    if (updateData.follow_up_date !== undefined) {
      examination.follow_up_date = updateData.follow_up_date;
    }

    // Update status to completed
    examination.status = ExaminationStatus.COMPLETED;
    examination.updated_at = new Date();

    const savedExamination = await examination.save();

    // If follow-up is required, send notification to parent
    if (updateData.follow_up_required) {
      try {
        // Create a simple notification for follow-up appointment
        const notificationMessage = updateData.follow_up_date
          ? `Cần tư vấn thêm cho con em. Lịch hẹn: ${updateData.follow_up_date.toLocaleDateString()}`
          : 'Cần tư vấn thêm cho con em. Vui lòng liên hệ nhà trường.';

        // TODO: Implement follow-up notification
        console.log('Follow-up notification needed:', {
          examinationId,
          studentId: examination.student_id.toString(),
          message: notificationMessage,
        });
      } catch (notificationError) {
        console.error('Error sending follow-up notification:', notificationError);
      }
    }

    return savedExamination.populate(['student_id', 'created_by']);
  }

  async getApprovedExaminations() {
    const examinations = await this.healthExaminationModel
      .find({ status: ExaminationStatus.APPROVED })
      .populate(['student_id', 'created_by'])
      .sort({ examination_date: 1 });

    // Tính toán thống kê approval cho mỗi lịch khám
    const result: any[] = [];
    for (const exam of examinations) {
      const totalForSameExam = await this.healthExaminationModel.countDocuments({
        title: exam.title,
        examination_date: exam.examination_date,
        examination_time: exam.examination_time,
        location: exam.location,
      });

      const approvedForSameExam = await this.healthExaminationModel.countDocuments({
        title: exam.title,
        examination_date: exam.examination_date,
        examination_time: exam.examination_time,
        location: exam.location,
        status: ExaminationStatus.APPROVED,
      });

      result.push({
        ...exam.toObject(),
        approvedCount: approvedForSameExam,
        totalCount: totalForSameExam,
        targetType: exam.grade_level ? 'grade' : 'individual',
        gradeLevel: exam.grade_level,
      });
    }

    return result;
  }

  async getHealthExaminationEvents() {
    // Group health examinations by campaign/event
    // Only get examinations that have grade_level (không có khám cá nhân)
    const examinations = await this.healthExaminationModel
      .find({ grade_level: { $exists: true, $ne: null } })
      .populate([
        { path: 'student_id', populate: { path: 'class', select: 'name grade_level' } },
        { path: 'created_by' },
      ])
      .sort({ examination_date: -1 });

    // Group by event (same title, date, time, location)
    const eventsMap = new Map();

    for (const exam of examinations) {
      const eventKey = `${exam.title}_${exam.examination_date}_${exam.examination_time}_${exam.location}`;

      if (!eventsMap.has(eventKey)) {
        eventsMap.set(eventKey, {
          _id: eventKey,
          title: exam.title,
          description: exam.description,
          examination_date: exam.examination_date,
          examination_time: exam.examination_time,
          location: exam.location,
          doctor_name: exam.doctor_name,
          examination_type: exam.examination_type,
          created_by: exam.created_by,
          grade_levels: new Set(),
          classes: new Map(),
          total_students: 0,
          approved_count: 0,
          pending_count: 0,
          rejected_count: 0,
          completed_count: 0,
          examinations: [],
        });
      }

      const event = eventsMap.get(eventKey);
      event.examinations.push(exam);
      event.total_students += 1;

      // Count by status
      switch (exam.status) {
        case ExaminationStatus.APPROVED:
          event.approved_count += 1;
          break;
        case ExaminationStatus.PENDING:
          event.pending_count += 1;
          break;
        case ExaminationStatus.REJECTED:
          event.rejected_count += 1;
          break;
        case ExaminationStatus.COMPLETED:
          event.completed_count += 1;
          break;
      }

      // Track grade levels and classes
      if (exam.grade_level) {
        event.grade_levels.add(exam.grade_level);
      }

      if (
        exam.student_id &&
        typeof exam.student_id === 'object' &&
        (exam.student_id as any).class
      ) {
        const studentData = exam.student_id as any;
        const classData = studentData.class;
        const classId = classData._id.toString();

        if (!event.classes.has(classId)) {
          event.classes.set(classId, {
            class_id: classId,
            class_name: classData.name || `${exam.grade_level}A`,
            grade_level: classData.grade_level || exam.grade_level,
            students: [],
            approved_count: 0,
            pending_count: 0,
            rejected_count: 0,
            completed_count: 0,
          });
        }

        const classInfo = event.classes.get(classId);
        classInfo.students.push({
          student: exam.student_id,
          examination: exam,
          status: exam.status,
        });

        // Count by status for this class
        switch (exam.status) {
          case ExaminationStatus.APPROVED:
            classInfo.approved_count += 1;
            break;
          case ExaminationStatus.PENDING:
            classInfo.pending_count += 1;
            break;
          case ExaminationStatus.REJECTED:
            classInfo.rejected_count += 1;
            break;
          case ExaminationStatus.COMPLETED:
            classInfo.completed_count += 1;
            break;
        }
      }
    }

    // Convert Map to Array and process
    const events = Array.from(eventsMap.values()).map((event) => ({
      ...event,
      grade_levels: Array.from(event.grade_levels).sort(),
      classes: Array.from(event.classes.values()),
    }));

    return events;
  }

  async getHealthExaminationEventDetail(eventId: string) {
    // Extract event details from eventId (title_date_time_location)
    const parts = eventId.split('_');
    const title = parts[0];
    const date = parts[1];
    const time = parts[2];
    const location = parts.slice(3).join('_'); // In case location has underscores

    const examinations = await this.healthExaminationModel
      .find({
        title: title,
        examination_date: new Date(date),
        examination_time: time,
        location: location,
      })
      .populate([
        { path: 'student_id', populate: { path: 'class', select: 'name grade_level' } },
        { path: 'created_by' },
      ])
      .sort({ grade_level: 1 });

    // Group by class
    const classesMap = new Map();

    for (const exam of examinations) {
      if (
        exam.student_id &&
        typeof exam.student_id === 'object' &&
        (exam.student_id as any).class
      ) {
        const studentData = exam.student_id as any;
        const classData = studentData.class;
        const classId = classData._id.toString();

        if (!classesMap.has(classId)) {
          classesMap.set(classId, {
            class_id: classId,
            class_name: classData.name || `${exam.grade_level}A`,
            grade_level: classData.grade_level || exam.grade_level,
            students: [],
            total_students: 0,
            approved_count: 0,
            pending_count: 0,
            rejected_count: 0,
            completed_count: 0,
          });
        }

        const classInfo = classesMap.get(classId);
        classInfo.students.push({
          _id: exam._id,
          student: exam.student_id,
          examination: exam,
          status: exam.status,
          parent_response_notes: exam.parent_response_notes,
          rejection_reason: exam.rejection_reason,
        });

        classInfo.total_students += 1;

        // Count by status
        switch (exam.status) {
          case ExaminationStatus.APPROVED:
            classInfo.approved_count += 1;
            break;
          case ExaminationStatus.PENDING:
            classInfo.pending_count += 1;
            break;
          case ExaminationStatus.REJECTED:
            classInfo.rejected_count += 1;
            break;
          case ExaminationStatus.COMPLETED:
            classInfo.completed_count += 1;
            break;
        }
      }
    }

    return {
      event_id: eventId,
      title: title,
      examination_date: new Date(date),
      examination_time: time,
      location: location,
      classes: Array.from(classesMap.values()).sort((a, b) => a.grade_level - b.grade_level),
    };
  }

  async getHealthExaminationClassDetail(eventId: string, classId: string) {
    console.log('getHealthExaminationClassDetail called with:', { eventId, classId });

    // Parse event ID to extract examination details
    const [title, date, time, location] = eventId.split('_');
    console.log('Parsed eventId parts:', { title, date, time, location });

    if (!title || !date || !time || !location) {
      console.error('Invalid event ID format:', eventId);
      throw new BadRequestException('Invalid event ID format');
    }

    // Find all examinations for this event and class
    const query = {
      title: title,
      examination_date: new Date(date),
      examination_time: time,
      location: location,
    };
    console.log('Query for examinations:', query);

    const examinations = await this.healthExaminationModel
      .find(query)
      .populate({
        path: 'student_id',
        populate: {
          path: 'class',
          model: 'Class',
        },
      })
      .populate('created_by')
      .sort({ created_at: -1 });

    console.log('Found examinations count:', examinations.length);

    if (!examinations.length) {
      throw new NotFoundException('No health examinations found for this event');
    }

    // Filter students from the specific class
    const classStudents = examinations.filter((exam) => {
      if (exam.student_id && typeof exam.student_id === 'object') {
        const studentData = exam.student_id as any;
        const studentClassId = studentData.class?._id?.toString();
        const matches = studentClassId === classId;
        console.log('Student class check:', {
          studentClassId,
          classId,
          matches,
          studentName: studentData.full_name || studentData.name,
        });
        return matches;
      }
      return false;
    });

    console.log('Filtered class students count:', classStudents.length);

    if (!classStudents.length) {
      throw new NotFoundException('No students found for this class in the event');
    }

    // Get class information from the first student
    const firstStudent = classStudents[0].student_id as any;
    const classInfo = firstStudent.class;
    console.log('Class info:', classInfo);

    // Lấy loại khám từ examination đầu tiên
    const examinationType = examinations[0]?.examination_type || null;

    // Group students by status
    const statusCounts = {
      approved: 0,
      pending: 0,
      rejected: 0,
      completed: 0,
    };

    const studentsWithDetails = classStudents.map((exam) => {
      // Count status
      switch (exam.status) {
        case ExaminationStatus.APPROVED:
          statusCounts.approved += 1;
          break;
        case ExaminationStatus.PENDING:
          statusCounts.pending += 1;
          break;
        case ExaminationStatus.REJECTED:
          statusCounts.rejected += 1;
          break;
        case ExaminationStatus.COMPLETED:
          statusCounts.completed += 1;
          break;
      }

      return {
        examination_id: exam._id,
        student: exam.student_id,
        status: exam.status,
        parent_response_notes: exam.parent_response_notes,
        rejection_reason: exam.rejection_reason,
        health_result: exam.health_result,
        recommendations: exam.recommendations,
        follow_up_required: exam.follow_up_required,
        examination_notes: exam.examination_notes,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
      };
    });

    const result = {
      event_id: eventId,
      class_id: classId,
      class_info: {
        name: classInfo.name,
        grade_level: classInfo.grade_level,
        teacher: classInfo.teacher,
      },
      event_details: {
        title: title,
        examination_date: new Date(date),
        examination_time: time,
        location: location,
        examination_type: examinationType,
      },
      statistics: {
        total_students: classStudents.length,
        ...statusCounts,
      },
      students: studentsWithDetails.sort((a, b) => {
        const nameA = (a.student as any).full_name || '';
        const nameB = (b.student as any).full_name || '';
        return nameA.localeCompare(nameB);
      }),
    };

    console.log('Returning class detail result:', result);
    return result;
  }

  async delete(id: string) {
    const result = await this.healthExaminationModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Health examination not found');
    }
    return result;
  }

  async deleteEvent(eventKey: string) {
    try {
      // Event key format từ frontend: "title_date_time_location"
      const parts = eventKey.split('_');

      if (parts.length < 3) {
        throw new BadRequestException('Invalid event ID format');
      }

      // Rebuild các thành phần từ eventKey
      // Do title có thể chứa dấu '_', ta cần xử lý cẩn thận
      const timeIndex = parts.length - 2;
      const locationIndex = parts.length - 1;

      const title = parts.slice(0, timeIndex - 1).join('_');
      const date = parts[timeIndex - 1];
      const time = parts[timeIndex];
      const location = parts[locationIndex] === 'undefined' ? undefined : parts[locationIndex];

      console.log('Deleting event with:', { title, date, time, location });

      // Tìm tất cả lịch khám thuộc sự kiện này
      const query: any = {
        title: title,
        examination_date: new Date(date),
        examination_time: time,
      };

      // Chỉ thêm location vào query nếu nó tồn tại
      if (location && location !== 'undefined') {
        query.location = location;
      } else {
        query.$or = [{ location: { $exists: false } }, { location: null }, { location: '' }];
      }

      console.log('Delete query:', query);

      const examinations = await this.healthExaminationModel.find(query);

      if (examinations.length === 0) {
        throw new NotFoundException('No examinations found for this event');
      }

      // Xóa tất cả lịch khám
      const result = await this.healthExaminationModel.deleteMany(query);

      return {
        message: `Đã xóa ${result.deletedCount} lịch khám thuộc sự kiện`,
        deleted_count: result.deletedCount,
        event_info: {
          title,
          date,
          time,
          location: location || null,
        },
      };
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getConsultationAppointments(studentId?: string) {
    try {
      console.log('Getting consultation appointments for studentId:', studentId);

      // Build query to find examinations with follow_up_required = true
      const query: any = {
        follow_up_required: true,
      };

      // If studentId is provided, filter by student
      if (studentId) {
        query.student_id = studentId;
      }

      console.log('Query:', JSON.stringify(query, null, 2));

      const consultations = await this.healthExaminationModel
        .find(query)
        .populate([
          { path: 'student_id', select: 'full_name student_id email phone' },
          { path: 'created_by', select: 'name email' },
        ])
        .sort({ follow_up_date: 1, created_at: -1 });

      console.log('Found consultations count:', consultations.length);
      console.log(
        'Raw consultations data:',
        JSON.stringify(
          consultations.map((c) => ({
            id: c._id,
            student_id: c.student_id,
            created_by: c.created_by,
            student_type: typeof c.student_id,
            created_by_type: typeof c.created_by,
          })),
          null,
          2,
        ),
      );

      // Format the response
      const formattedConsultations = consultations.map((consultation, index) => {
        console.log(`Processing consultation ${index + 1}:`, {
          id: consultation._id,
          student_id: consultation.student_id,
          created_by: consultation.created_by,
          examination_notes: consultation.examination_notes?.substring(0, 100) + '...',
        });

        // Extract consultation details from examination_notes
        let consultationTitle = 'Lịch hẹn tư vấn sức khỏe';
        let consultationDoctor = consultation.doctor_name || 'Bác sĩ phụ trách';
        let consultationTime = consultation.examination_time || 'Chưa xác định';
        let consultationNotes = '';

        // Parse consultation information from examination_notes
        const notesRaw = consultation.examination_notes || '';
        const lines = notesRaw.split('\n');
        for (const line of lines) {
          if (line.includes('Lịch hẹn tư vấn:')) {
            consultationTitle = line.replace('Lịch hẹn tư vấn:', '').trim();
          } else if (line.includes('Bác sĩ:')) {
            consultationDoctor = line.replace('Bác sĩ:', '').trim();
          } else if (line.includes('Giờ:')) {
            consultationTime = line.replace('Giờ:', '').trim();
          } else if (line.includes('Ghi chú:')) {
            consultationNotes = line.replace('Ghi chú:', '').trim();
          }
        }

        // Safe handling of student data
        let studentData: any = null;
        if (consultation.student_id) {
          if (typeof consultation.student_id === 'object' && consultation.student_id !== null) {
            studentData = {
              _id: (consultation.student_id as any)?._id?.toString() || '',
              full_name: (consultation.student_id as any)?.full_name || '',
              student_id: (consultation.student_id as any)?.student_id || '',
              email: (consultation.student_id as any)?.email || '',
              phone: (consultation.student_id as any)?.phone || '',
            };
          } else if (typeof consultation.student_id === 'string') {
            // If it's just an ID string, we'll need to populate it
            studentData = {
              _id: consultation.student_id,
              full_name: 'Đang tải...',
              student_id: '',
              email: '',
              phone: '',
            };
          }
        }

        // Safe handling of created_by data
        let createdByData: any = null;
        if (consultation.created_by) {
          if (typeof consultation.created_by === 'object' && consultation.created_by !== null) {
            createdByData = {
              name: (consultation.created_by as any)?.name || '',
              email: (consultation.created_by as any)?.email || '',
            };
          } else if (typeof consultation.created_by === 'string') {
            createdByData = {
              name: 'Đang tải...',
              email: '',
            };
          }
        }

        const formattedConsultation = {
          _id: consultation._id?.toString() || '',
          consultation_title: consultationTitle,
          consultation_date: consultation.follow_up_date || consultation.examination_date || null,
          consultation_time: consultationTime,
          consultation_doctor: consultationDoctor,
          consultation_notes: consultationNotes,
          student: studentData,
          original_examination: {
            title: consultation.title || '',
            examination_date: consultation.examination_date || null,
            examination_type: consultation.examination_type || '',
            status: consultation.status || '',
          },
          created_by: createdByData,
          created_at: consultation.created_at,
          updated_at: consultation.updated_at,
        };

        console.log(`Formatted consultation ${index + 1}:`, {
          id: formattedConsultation._id,
          title: formattedConsultation.consultation_title,
          student: formattedConsultation.student?.full_name || 'No student',
        });

        return formattedConsultation;
      });

      console.log('Returning formatted consultations:', formattedConsultations.length);
      return formattedConsultations;
    } catch (error) {
      console.error('Error getting consultation appointments:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async scheduleConsultation(scheduleData: {
    student_id: string;
    title: string;
    consultation_date: Date;
    consultation_time: string;
    doctor: string;
    notes?: string;
    created_by: string;
  }) {
    try {
      console.log('Starting scheduleConsultation with data:', scheduleData);

      // Validate required fields
      if (!scheduleData.created_by) {
        throw new BadRequestException('created_by is required');
      }

      if (!scheduleData.student_id) {
        throw new BadRequestException('student_id is required');
      }

      // Verify student exists
      console.log('Looking for student with ID:', scheduleData.student_id);
      const student = await this.studentService.findById(scheduleData.student_id);
      console.log('Student found:', student ? 'Yes' : 'No');

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      // Find the original health examination record for this student
      // Look for the most recent completed examination
      const originalExamination = await this.healthExaminationModel
        .findOne({
          student_id: scheduleData.student_id,
          status: { $in: [ExaminationStatus.COMPLETED, ExaminationStatus.APPROVED] },
        })
        .sort({ created_at: -1 });

      if (!originalExamination) {
        throw new NotFoundException('Không tìm thấy lịch khám sức khỏe của học sinh này');
      }

      console.log('Updating original examination record...');

      // Update the original examination record
      originalExamination.follow_up_required = true;
      originalExamination.follow_up_date = scheduleData.consultation_date;

      // Add consultation information to examination notes
      const consultationNote =
        `Lịch hẹn tư vấn: ${scheduleData.title}\n` +
        `Bác sĩ: ${scheduleData.doctor}\n` +
        `Ngày: ${scheduleData.consultation_date.toLocaleDateString('vi-VN')}\n` +
        `Giờ: ${scheduleData.consultation_time}\n` +
        `Ghi chú: ${scheduleData.notes || 'Không có'}`;

      originalExamination.examination_notes = originalExamination.examination_notes
        ? `${originalExamination.examination_notes}\n\n${consultationNote}`
        : consultationNote;

      originalExamination.updated_at = new Date();

      const savedExamination = await originalExamination.save();
      console.log('Consultation scheduled successfully:', savedExamination._id);

      // Send notification to student/parent about the consultation
      try {
        console.log('Creating notification...');
        await this.notificationService.createHealthExaminationNotification(
          (savedExamination._id as Types.ObjectId).toString(),
          scheduleData.student_id,
          scheduleData.title,
          `Lịch hẹn tư vấn với ${scheduleData.doctor} vào ${scheduleData.consultation_date.toLocaleDateString('vi-VN')} lúc ${scheduleData.consultation_time}`,
          scheduleData.consultation_date,
          scheduleData.consultation_time,
        );
        console.log('Notification created successfully');
      } catch (notificationError) {
        console.error('Error sending consultation notification:', notificationError);
        // Continue with the process even if notification fails
        // Don't throw error here, just log it
      }

      console.log('Populating consultation data...');
      const result = await savedExamination.populate(['student_id']);
      console.log('Schedule consultation completed successfully');
      return result;
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Provide more specific error messages
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.message && error.message.includes('Student not found')) {
        throw new NotFoundException('Không tìm thấy học sinh');
      }

      throw new BadRequestException(`Không thể lập lịch hẹn tư vấn: ${error.message}`);
    }
  }
}

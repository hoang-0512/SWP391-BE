import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ParentStudentService } from '@/services/parent-student.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { CreateParentStudentDto } from '@/decorations/dto/create-parent-student.dto';
import { UpdateParentStudentDto } from '@/decorations/dto/update-parent-student.dto';
import { Roles } from '@/decorations/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { Role } from '@/enums/role.enum';
import { ParentService } from '@/services/parent.service';
import { BadRequestException } from '@nestjs/common';
import { UserService } from '@/services/user.service';

@ApiTags('parent-students')
@Controller('parent-students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentStudentController {
  constructor(
    private readonly parentStudentService: ParentStudentService,
    private readonly parentService: ParentService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all parent-student relationships' })
  @ApiResponse({
    status: 200,
    description: 'Return all parent-student relationships.',
  })
  async findAll() {
    return this.parentStudentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parent-student relationship by ID' })
  @ApiParam({ name: 'id', description: 'Parent-Student relationship ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the parent-student relationship.',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent-Student relationship not found.',
  })
  async findOne(@Param('id') id: string) {
    return this.parentStudentService.findById(id);
  }

  @Get('parent/:userId')
  @ApiOperation({ summary: 'Get parent-student relationships by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID (user._id) của phụ huynh' })
  @ApiResponse({
    status: 200,
    description: 'Return parent-student relationships for a parent.',
  })
  async findByParentId(@Param('userId') userId: string) {
    try {
      return await this.parentStudentService.findByUserId(userId);
    } catch (error) {
      console.error('Error in GET /parent-students/parent/:userId:', { userId, error });
      if (error instanceof Error && error.message) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Không thể lấy danh sách học sinh cho phụ huynh này');
    }
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get parent-student relationships by student ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Return parent-student relationships for a student.',
  })
  async findByStudentId(@Param('studentId') studentId: string) {
    return this.parentStudentService.findByStudentId(studentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new parent-student relationship' })
  @ApiResponse({
    status: 201,
    description: 'The parent-student relationship has been created.',
  })
  async create(@Body() body: any) {
    // Nếu FE gửi studentId thay vì student, tự động map lại
    if (body.studentId && !body.student) {
      body.student = body.studentId;
      delete body.studentId;
    }
    if (!body.student || !body.parent) {
      throw new BadRequestException('Trường parent và student là bắt buộc');
    }
    return this.parentStudentService.create(body);
  }

  @Post('by-email')
  @ApiOperation({ summary: 'Create parent-student relationship by parent email' })
  @ApiResponse({ status: 201, description: 'Parent-student relationship created by email.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        parentEmail: { type: 'string', example: 'parent@example.com' },
        studentId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
      },
      required: ['parentEmail', 'studentId'],
    },
  })
  async createByEmail(@Body() body: { parentEmail: string; studentId: string }) {
    const { parentEmail, studentId } = body;
    if (!parentEmail || !studentId) {
      throw new BadRequestException('parentEmail and studentId are required');
    }
    // Gọi service mới để lấy parentId từ email và tạo parent-student
    return this.parentStudentService.createByParentEmail(parentEmail, studentId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a parent-student relationship' })
  @ApiParam({ name: 'id', description: 'Parent-Student relationship ID' })
  @ApiResponse({
    status: 200,
    description: 'The parent-student relationship has been updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent-Student relationship not found.',
  })
  async update(@Param('id') id: string, @Body() updateParentStudentDto: UpdateParentStudentDto) {
    return this.parentStudentService.update(id, updateParentStudentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parent-student relationship' })
  @ApiParam({ name: 'id', description: 'Parent-Student relationship ID' })
  @ApiResponse({
    status: 200,
    description: 'The parent-student relationship has been deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent-Student relationship not found.',
  })
  async remove(@Param('id') id: string) {
    return this.parentStudentService.remove(id);
  }
}

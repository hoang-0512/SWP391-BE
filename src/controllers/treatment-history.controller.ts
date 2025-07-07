
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TreatmentHistoryService } from '@/services/treatment-history.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { CreateTreatmentHistoryDto } from '@/decorations/dto/create-treatment-history.dto';
import { UpdateTreatmentHistoryDto, UpdateTreatmentStatusDto } from '@/decorations/dto/update-treatment-history.dto';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorations/roles.decorator';
import { Role } from '@/enums/role.enum';

@ApiTags('treatment-histories')
@Controller('treatment-histories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentHistoryController {
  constructor(
    private readonly treatmentHistoryService: TreatmentHistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all treatment histories' })
  @ApiResponse({ status: 200, description: 'Return all treatment histories.' })
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR, Role.NURSE, Role.PARENT, Role.STUDENT)
  async findAll() {
    return this.treatmentHistoryService.findAll();
    
  }
  

  @Get(':id')
  @ApiOperation({ summary: 'Get a treatment history by ID' })
  @ApiParam({ name: 'id', description: 'Treatment history ID' })
  @ApiResponse({ status: 200, description: 'Return the treatment history.' })
  @ApiResponse({ status: 404, description: 'Treatment history not found.' })
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR, Role.NURSE, Role.PARENT, Role.STUDENT)
  async findOne(@Param('id') id: string) {
    return this.treatmentHistoryService.findById(id);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get treatment histories by student ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Return treatment histories for a student.',
  })
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR, Role.NURSE, Role.PARENT, Role.STUDENT)
  async findByStudentId(@Param('studentId') studentId: string) {
    return this.treatmentHistoryService.findByStudentId(studentId);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get treatment histories by staff ID' })
  @ApiParam({ name: 'staffId', description: 'Staff ID' })
  @ApiResponse({
    status: 200,
    description: 'Return treatment histories for a staff member.',
  })
  @Roles(Role.ADMIN, Role.STAFF, Role.DOCTOR, Role.NURSE, Role.PARENT, Role.STUDENT)
  async findByStaffId(@Param('staffId') staffId: string) {
    return this.treatmentHistoryService.findByStaffId(staffId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new treatment history' })
  @ApiResponse({
    status: 201,
    description: 'The treatment history has been created.',
  })
 
  async create(@Body() createTreatmentHistoryDto: CreateTreatmentHistoryDto) {
    return this.treatmentHistoryService.create(createTreatmentHistoryDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a treatment history' })
  @ApiParam({ name: 'id', description: 'Treatment history ID' })
  @ApiResponse({
    status: 200,
    description: 'The treatment history has been updated.',
  })
  @ApiResponse({ status: 404, description: 'Treatment history not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentHistoryDto: UpdateTreatmentHistoryDto,
  ) {
    return this.treatmentHistoryService.update(id, updateTreatmentHistoryDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update the status of a treatment history' })
  @ApiParam({ name: 'id', description: 'Treatment history ID' })
  @ApiResponse({
    status: 200,
    description: 'The status of the treatment history has been updated.',
  })
  @ApiResponse({ status: 404, description: 'Treatment history not found.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTreatmentStatusDto: UpdateTreatmentStatusDto
  ) {
    return this.treatmentHistoryService.updateStatus(id, updateTreatmentStatusDto);
  }

  @Get('parent/:parentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT, Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get treatment histories by parent ID' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiResponse({
    status: 200,
    description: 'Treatment histories retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'No students found for parent.' })
  async getByParentId(@Param('parentId') parentId: string) {
    return this.treatmentHistoryService.findByParentId(parentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a treatment history' })
  @ApiParam({ name: 'id', description: 'Treatment history ID' })
  @ApiResponse({
    status: 200,
    description: 'The treatment history has been deleted.',
  })
  @ApiResponse({ status: 404, description: 'Treatment history not found.' })
  async remove(@Param('id') id: string) {
    return this.treatmentHistoryService.remove(id);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDate, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO cho việc cập nhật trạng thái điều trị
 * Dùng để cập nhật các thông tin về hành động đã thực hiện, liên hệ phụ huynh, ghi chú và trạng thái
 */
export class UpdateTreatmentStatusDto {
  @ApiProperty({
    description: 'Hành động đã thực hiện để điều trị cho học sinh',
    example: 'Đã cho uống thuốc paracetamol và nghỉ ngơi tại phòng y tế',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Hành động phải là chuỗi ký tự' })
  actionTaken?: string;

  @ApiProperty({
    description: 'Có liên hệ thông báo với phụ huynh hay không',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'contactParent phải là boolean (true/false)' })
  contactParent?: boolean;

  @ApiProperty({
    description: 'Ghi chú thêm về tình trạng điều trị và sức khỏe học sinh',
    example: 'Học sinh đã ổn định, có thể trở lại lớp học bình thường',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;

  @ApiProperty({
    description: 'Trạng thái hiện tại của quá trình điều trị',
    example: 'processing',
    enum: ['processing', 'resolved', 'pending'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  @IsIn(['processing', 'resolved', 'pending'], {
    message: 'Trạng thái phải là một trong: processing (Đang xử lý), resolved (Chờ phụ huynh), pending (Đã xử lý xong)'
  })
  status?: string;
}

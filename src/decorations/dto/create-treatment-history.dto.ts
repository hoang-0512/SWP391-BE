import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateTreatmentHistoryDto {
  @ApiProperty({ description: 'Tiêu đề sự kiện', example: 'quánh nhau' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'ID học sinh', example: '60d0fe4f5311236168a109ca' })
  @IsNotEmpty()
  @IsString()
  student: string; // Gửi lên là ObjectId

  @ApiProperty({ description: 'ID lớp', example: '60d0fe4f5311236168a109cb' })
  @IsNotEmpty()
  @IsString()
  class: string; // Gửi lên là ObjectId

  @ApiProperty({ description: 'ID người báo cáo', example: '60d0fe4f5311236168a109cc' })
  @IsNotEmpty()
  @IsString()
  reporter: string; // Gửi lên là ObjectId

  @ApiProperty({ description: 'Mô tả chi tiết', example: 'quánh xịt nước sting' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Vị trí', example: 'trong lp học' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({ description: 'Trạng thái liên hệ', example: 'Đang gọi' })
  @IsNotEmpty()
  @IsString()
  contactStatus: string;

  @ApiProperty({ description: 'Mức độ ưu tiên', example: 'Trung bình' })
  @IsNotEmpty()
  @IsString()
  priority: string;

  @ApiProperty({ description: 'Hành động đã thực hiện', example: 'đã thông báo phụ huynh' })
  @IsString()
    @IsOptional()
  actionTaken: string;

  // @ApiProperty({ description: 'Đã liên hệ phụ huynh', example: true })
  // @IsNotEmpty()
  // @IsBoolean()
  // contactParent: boolean;

  @ApiProperty({ description: 'Ghi chú', example: 'xít nước sting r thôi, đã cầm máu', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Trạng thái xử lý',
    example: 'processing',
    enum: ['processing', 'resolved', 'pending'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['processing', 'resolved', 'pending'], {
    message: 'Trạng thái phải là một trong: processing (Đang xử lý), resolved (Chờ phụ huynh), pending (Đã xử lý xong)'
  })
  status?: string;
}

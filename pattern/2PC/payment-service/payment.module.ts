import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentTransaction } from './entities/payment-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',          // Đổi sang mysql
      host: 'localhost',
      port: 3306,             // Đổi cổng mặc định thành 3306
      username: 'root',       // Thường mặc định của MySQL là root
      password: '1',   // Mật khẩu MySQL của bạn
      database: 'payment_db',    // Tên cơ sở dữ liệu MySQL của bạn
      autoLoadEntities: true, 
      synchronize: true,      // Lưu ý: Tắt đi (false) khi chạy production
    }),
    TypeOrmModule.forFeature([PaymentTransaction]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}
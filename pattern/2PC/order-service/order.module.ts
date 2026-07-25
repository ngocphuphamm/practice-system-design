import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
          type: 'mysql',          // Đổi sang mysql
          host: 'localhost',
          port: 3306,             // Đổi cổng mặc định thành 3306
          username: 'root',       // Thường mặc định của MySQL là root
          password: '1',   // Mật khẩu MySQL của bạn
          database: 'order_db',    // Tên cơ sở dữ liệu MySQL của bạn
          autoLoadEntities: true, 
          synchronize: true,      // Lưu ý: Tắt đi (false) khi chạy production
        }),
    TypeOrmModule.forFeature([Order]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService]
})
export class OrderModule {}
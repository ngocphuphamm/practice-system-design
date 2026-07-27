import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory2PCService } from './inventory-2pc.service';
import { InventoryController } from './inventory.controller';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',          // Đổi sang mysql
      host: 'localhost',
      port: 3306,             // Đổi cổng mặc định thành 3306
      username: 'root',       // Thường mặc định của MySQL là root
      password: '1',   // Mật khẩu MySQL của bạn
      database: 'inventory_db',    // Tên cơ sở dữ liệu MySQL của bạn
      autoLoadEntities: true,
      synchronize: true,      // Lưu ý: Tắt đi (false) khi chạy production
    }),
    TypeOrmModule.forFeature([InventoryTransaction, Product]),
  ],
  controllers: [InventoryController],
  providers: [Inventory2PCService],
  exports: [Inventory2PCService]
})
export class InventoryModule {}
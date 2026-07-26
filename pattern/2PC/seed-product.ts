import { createConnection } from 'typeorm';
import { Product } from './inventory-service/entities/product.entity';

async function seedProduct() {
  try {
    // Connect to the inventory database using the same configuration as inventory-service
    const connection = await createConnection({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1',
      database: 'inventory_db',
      entities: [Product],
      synchronize: true,
      logging: false
    });

    console.log('Connected to inventory database');

    // Create a sample product
    const productRepository = connection.getRepository(Product);
    
    // Check if product already exists to avoid duplicates
    const existingProduct = await productRepository.findOne({
      where: { name: 'Sample Product' }
    });
    
    if (!existingProduct) {
      const product = new Product();
      product.name = 'Sample Product';
      product.price = 29.99;
      product.stock = 100;
      
      await productRepository.save(product);
      console.log('Sample product created successfully');
    } else {
      console.log('Sample product already exists');
    }

    // Close the connection
    await connection.close();
    console.log('Seeding completed');
  } catch (error) {
    console.error('Error seeding product data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedProduct().then(() => {
  console.log('Product seeding script completed');
});
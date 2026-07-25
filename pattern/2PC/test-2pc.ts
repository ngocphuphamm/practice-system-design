// Test script to demonstrate 2PC workflow
import axios from 'axios';

// Mock request to simulate placing an order using our 2PC system
async function testOrderPlacement() {
  console.log("Testing 2PC Order Placement Workflow...");
  
  try {
    // Simulate placing an order with userId=123, productId=456, amount=$100, quantity=2
    const response = await axios.post('http://localhost:3003/orders', {
      userId: '123',
      productId: '456',
      amount: 100,
      quantity: 2
    });
    
    console.log('Order placement response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Order placed successfully with 2PC!');
    } else {
      console.log('❌ Order placement failed:', response.data.message);
    }
  } catch (error) {
    console.error('Error while placing order:', error.message);
  }
}

// Test payment prepare operation
async function testPaymentPrepare() {
  console.log("\nTesting Payment Prepare Operation...");
  
  try {
    const response = await axios.post('http://localhost:3001/payment/prepare', {
      gTid: 'test-gtid-123',
      entityId: 'user-123',
      amountOrQty: 100
    });
    
    console.log('Payment prepare response:', response.data);
  } catch (error) {
    console.error('Error in payment prepare:', error.message);
  }
}

// Test inventory prepare operation
async function testInventoryPrepare() {
  console.log("\nTesting Inventory Prepare Operation...");
  
  try {
    const response = await axios.post('http://localhost:3002/inventory/prepare', {
      gTid: 'test-gtid-123',
      entityId: 'product-456',
      amountOrQty: 2
    });
    
    console.log('Inventory prepare response:', response.data);
  } catch (error) {
    console.error('Error in inventory prepare:', error.message);
  }
}

// Test commit operation for payment
async function testPaymentCommit() {
  console.log("\nTesting Payment Commit Operation...");
  
  try {
    const response = await axios.post('http://localhost:3001/payment/commit', {
      gTid: 'test-gtid-123'
    });
    
    console.log('Payment commit response:', response.data);
  } catch (error) {
    console.error('Error in payment commit:', error.message);
  }
}

// Test commit operation for inventory
async function testInventoryCommit() {
  console.log("\nTesting Inventory Commit Operation...");
  
  try {
    const response = await axios.post('http://localhost:3002/inventory/commit', {
      gTid: 'test-gtid-123'
    });
    
    console.log('Inventory commit response:', response.data);
  } catch (error) {
    console.error('Error in inventory commit:', error.message);
  }
}

// Run our tests
console.log('Starting 2PC System Tests...\n');

// Run individual component tests first
testPaymentPrepare();
testInventoryPrepare();

// Then try a complete order placement
setTimeout(() => {
  testOrderPlacement();
}, 1000);

// Test committing after preparation
setTimeout(() => {
  testPaymentCommit();
  testInventoryCommit(); 
}, 2000);
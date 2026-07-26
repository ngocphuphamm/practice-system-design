// Client request to place an order using the 2PC system
const axios = require('axios');

// Function to place an order using the 2PC system
async function placeOrder(orderData) {
  try {
    const response = await axios.post('http://localhost:3003/orders', orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Order placement response:', response.data);
    return response.data;
  } catch (error) {
    console.log(error);
    console.error('Error placing order:', error.message);
    throw error;
  }
}

// Example usage
async function main() {
  const orderRequest = {
    userId: 'user123',
    productId: '0c347ffc-68bd-4c7e-a78a-00a21ba85068',
    amount: 99.99,
    quantity: 2
  };

  try {
    const result = await placeOrder(orderRequest);
    if (result.success) {
      console.log('✅ Order placed successfully with 2PC!');
    } else {
      console.log('❌ Order placement failed:', result.message);
    }
  } catch (error) {
    console.error('Failed to place order:', error);
  }
}

// Run the example
main();
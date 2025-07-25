const axios = require('axios');
require('dotenv').config();

// Get the Azure Function URL from .env
const AZURE_FUNCTION_URL = process.env.AZURE_FUNCTION_URL;

console.log('Testing Azure Function URL:', AZURE_FUNCTION_URL);

// Set longer timeout for axios
axios.defaults.timeout = 30000; // 30 seconds

// Simple C# class for testing
const sourceCode = `
public class Calculator {
    public int Add(int a, int b) {
        return a + b;
    }
}
`;

// Simple test code
const testCode = `
public class CalculatorTests {
    public void TestAdd() {
        Calculator calc = new Calculator();
        int result = calc.Add(2, 3);
        if (result != 5) {
            throw new Exception($"Expected 5 but got {result}");
        }
        Console.WriteLine("Test passed");
    }
}
`;

async function testAzureFunction() {
    try {
        console.log('Sending request to Azure Function...');
        console.log('----------------------------------------');
        console.log('Source code:');
        console.log(sourceCode);
        console.log('----------------------------------------');
        console.log('Test code:');
        console.log(testCode);
        console.log('----------------------------------------');

        console.log('Sending POST request to:', AZURE_FUNCTION_URL);
        console.time('Azure Function Request');
        
        const response = await axios.post(AZURE_FUNCTION_URL, {
            sourceCode: sourceCode.trim(),
            testCode: testCode.trim()
        });
        
        console.timeEnd('Azure Function Request');
        console.log('Request successful! Status code:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));
        console.log('----------------------------------------');
        console.log('Azure Function response data:');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Error calling Azure Function:');
        console.error('Error message:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received. Request details:', error.request._currentUrl);
            console.error('Request timed out or network error');
        } else {
            console.error('Error setting up request:', error.message);
        }
    }
}

testAzureFunction();

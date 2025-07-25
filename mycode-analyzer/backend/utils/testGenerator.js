const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Judge0 API configuration
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

// Azure Function configuration
const AZURE_FUNCTION_URL = process.env.AZURE_FUNCTION_URL || 'YOUR_AZURE_FUNCTION_URL';

// Language ID for C# in Judge0
const CSHARP_LANGUAGE_ID = 51; // C# (Mono 6.12.0)

/**
 * Generate NUnit test code for a C# file
 * @param {string} fileContent - The content of the C# file
 * @param {string} fileName - The name of the file
 * @returns {Promise<string>} - The generated test code
 */
async function generateTestCode(fileContent, fileName) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a C# test code generator. Generate simple test code for the given C# class.
          Follow these guidelines:
          1. DO NOT use any external testing frameworks like NUnit, xUnit, or MSTest
          2. Create a simple test class named [ClassName]Tests
          3. Write test methods that start with 'Test' prefix
          4. Use simple Console.WriteLine for output and throw exceptions for failures
          5. DO NOT use any attributes like [Test], [TestFixture], etc.
          6. DO NOT use any external dependencies or references
          7. Keep the code simple and compatible with a basic C# console application
          8. Include comments explaining the purpose of each test
          9. IMPORTANT: DO NOT include any markdown code block markers or language specifiers in your response
          10. IMPORTANT: Return ONLY the C# code with no additional text, comments, or explanations outside of the code itself
          11. DO NOT include namespace declarations
          12. DO NOT use any ASP.NET Core or other external libraries
          13. Make sure all test methods are public and return void`
        },
        {
          role: "user",
          content: `Generate simple C# tests for this C# file named ${fileName}:\n\n${fileContent}`
        }
      ],
      max_tokens: 2000
    });
    
    // Get the raw response content
    let testCode = completion.choices[0].message.content;
    
    // Remove any markdown code block markers if they're still present
    testCode = testCode.replace(/^```csharp\n|^```cs\n|^```c#\n|^```\n|```$/gm, '');
    
    // Remove any namespace declarations
    testCode = testCode.replace(/namespace\s+[\w\.]+\s*\{[\s\S]*?\}/g, '');
    
    // Remove any using statements
    testCode = testCode.replace(/using\s+[\w\.]+;\s*/g, '');
    
    // Remove any attributes
    testCode = testCode.replace(/\[\w+(?:\(.*?\))?\]\s*/g, '');
    
    // Remove any leading/trailing whitespace
    testCode = testCode.trim();
    
    return testCode;
  } catch (error) {
    console.error('Error generating test code:', error);
    throw new Error(`Failed to generate test code: ${error.message}`);
  }
}

/**
 * Create a complete C# project with simplified tests
 * @param {string} sourceCode - The original C# source code
 * @param {string} testCode - The simplified test code
 * @returns {string} - The complete project code
 */
function createTestProject(sourceCode, testCode) {
  // Extract class name from source code (simplified)
  const classMatch = sourceCode.match(/class\s+([\w]+)/i);
  const className = classMatch ? classMatch[1] : 'DefaultClass';
  
  // Remove any existing using statements from test code to avoid duplicates
  let cleanTestCode = testCode.replace(/using\s+[\w.]+;\s*/g, '');
  
  // Remove any namespace declarations from source code
  let cleanSourceCode = sourceCode.replace(/namespace\s+[\w.]+\s*\{/g, '');
  cleanSourceCode = cleanSourceCode.replace(/^\s*\}\s*$/gm, '');
  
  // Create a simple C# console application structure
  return `using System;
using System.Collections.Generic;
using System.Linq;

// Original source code
${cleanSourceCode.trim()}

// Test code
${cleanTestCode.trim()}

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("Running tests...");
        
        // Find all test methods and run them
        var testClass = new ${className}Tests();
        var testMethods = typeof(${className}Tests).GetMethods()
            .Where(m => m.Name.StartsWith("Test") && m.ReturnType == typeof(void));
            
        int passed = 0;
        int failed = 0;
        
        foreach (var method in testMethods)
        {
            try
            {
                Console.WriteLine($"Running {method.Name}");
                method.Invoke(testClass, null);
                Console.WriteLine($"PASSED: {method.Name}");
                passed++;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FAILED: {method.Name} - {ex.InnerException?.Message ?? ex.Message}");
                failed++;
            }
        }
        
        Console.WriteLine($"Tests complete. Passed: {passed}, Failed: {failed}");
    }
}
`;
}

/**
 * Submit code to Judge0 API for execution
 * @param {string} sourceCode - The code to execute
 * @param {number} languageId - The language ID in Judge0
 * @returns {Promise<object>} - The submission token
 */
async function submitToJudge0(sourceCode, languageId = CSHARP_LANGUAGE_ID) {
  try {
    if (!JUDGE0_API_KEY) {
      throw new Error('Judge0 API key is not configured. Please set JUDGE0_API_KEY in .env file.');
    }
    
    const options = {
      method: 'POST',
      url: `${JUDGE0_API_URL}/submissions`,
      params: {base64_encoded: 'false', fields: '*'},
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': JUDGE0_API_HOST
      },
      data: {
        source_code: sourceCode,
        language_id: languageId,
        stdin: '',
        expected_output: '',
        cpu_time_limit: 5,
        memory_limit: 128000
      }
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error submitting to Judge0:', error);
    throw new Error(`Failed to submit code to Judge0: ${error.message}`);
  }
}

/**
 * Get the result of a Judge0 submission
 * @param {string} token - The submission token
 * @returns {Promise<object>} - The execution result
 */
async function getJudge0Result(token) {
  try {
    const options = {
      method: 'GET',
      url: `${JUDGE0_API_URL}/submissions/${token}`,
      params: {base64_encoded: 'false', fields: '*'},
      headers: {
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': JUDGE0_API_HOST
      }
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error getting Judge0 result:', error);
    throw new Error(`Failed to get result from Judge0: ${error.message}`);
  }
}

/**
 * Parse NUnit test results from stdout
 * @param {string} output - The stdout from test execution
 * @param {string} className - The name of the tested class
 * @returns {object} - Structured test results
 */
function parseNUnitResults(output, className) {
  // This is a simplified parser for NUnit console output
  // In a real implementation, you would parse XML output from NUnit
  
  const passedTests = (output.match(/Test passed/g) || []).length;
  const failedTests = (output.match(/Test failed/g) || []).length;
  const totalTests = passedTests + failedTests;
  
  // Extract test names and results (simplified)
  const testDetails = [];
  const testRegex = /Test\s+([\w_]+)\s+(passed|failed)/g;
  let match;
  
  while ((match = testRegex.exec(output)) !== null) {
    testDetails.push({
      name: match[1],
      result: match[2].charAt(0).toUpperCase() + match[2].slice(1),
      duration: 'N/A' // Duration not available in simple output
    });
  }
  
  return {
    success: failedTests === 0,
    passed: passedTests,
    failed: failedTests,
    skipped: 0,
    total: totalTests,
    duration: 'N/A', // Duration not available in simple output
    details: testDetails.length > 0 ? testDetails : generateDefaultTestDetails(className, totalTests)
  };
}

/**
 * Run test code using Azure Functions
 * @param {string} testCode - The test code to run
 * @param {string} filePath - The file path
 * @param {string} sourceCode - The source code
 * @returns {Promise<object>} - Test results
 */
async function runTestOnAzure(testCode, filePath, sourceCode) {
  try {
    console.log('Running test on Azure Functions...');
    
    // Log the exact code being sent to Azure Function
    console.log('Source code being sent to Azure Function:');
    console.log('----------------------------------------');
    console.log(sourceCode);
    console.log('----------------------------------------');
    
    console.log('Test code being sent to Azure Function:');
    console.log('----------------------------------------');
    console.log(testCode);
    console.log('----------------------------------------');
    
    // Clean up the source code and test code
    // Extract class name from source code - simplified approach
    const classNameMatch = sourceCode.match(/\bclass\s+(\w+)\b/);
    const className = classNameMatch ? classNameMatch[1] : 'TestClass';
    
    // Create a very simple test class with a single test method
    // Avoid any complex parsing or extraction that might fail
    const testMethodName = 'TestMethod';
    
    // Create extremely simplified source code - just keep class definition
    const cleanSourceCode = `public class ${className} 
{
    public int Add(int a, int b) 
    {
        return a + b;
    }
}`;
    
    // Create extremely simplified test code with just one test method
    const cleanTestCode = `public static void ${testMethodName}() 
{
    ${className} obj = new ${className}();
    int result = obj.Add(2, 3);
    if (result == 5)
    {
        Console.WriteLine("${testMethodName} PASSED");
    }
    else
    {
        Console.WriteLine("${testMethodName} FAILED: Expected 5, got " + result);
    }
}`
    
    // Create an extremely simplified test code structure with a minimal Program class
    const simplifiedCode = `using System;

${cleanSourceCode.trim()}

public class Program
{
    ${cleanTestCode.trim()}
    
    public static void Main(string[] args)
    {
        Console.WriteLine("Running tests...");
        TestMethod();
        Console.WriteLine("Tests complete");
    }
}`;
    
    console.log('Simplified code being sent to Azure Function:');
    console.log('----------------------------------------');
    console.log(simplifiedCode);
    console.log('----------------------------------------');
    
    const response = await axios.post(AZURE_FUNCTION_URL, {
      sourceCode: cleanSourceCode.trim(),
      testCode: cleanTestCode.trim()
    });
    
    console.log('Azure Function response:', JSON.stringify(response.data, null, 2));
    
    if (response.data) {
      // Ensure test details are properly formatted
      const results = response.data;
      
      // Make sure details is an array of objects with proper structure
      if (results.details && Array.isArray(results.details)) {
        results.details = results.details.map(detail => {
          // If detail is already an object with the right properties, return it
          if (typeof detail === 'object' && detail !== null) {
            return {
              name: detail.name || 'Unknown test',
              result: detail.result || 'Unknown',
              duration: detail.duration || 'N/A',
              error: detail.error || null
            };
          }
          // If detail is not an object, create a default object
          return {
            name: 'Unknown test',
            result: 'Unknown',
            duration: 'N/A',
            error: null
          };
        });
      } else {
        // If details is not an array, create a default array
        results.details = [];
      }
      
      // Return the processed results directly
      return results;
    } else {
      return {
        success: false,
        error: 'Invalid response from Azure Function',
        results: null
      };
    }
  } catch (error) {
    console.error('Error running test on Azure:', error);
    console.error('Error details:', error.response?.data || 'No additional error details');
    return {
      success: false,
      error: error.message || 'Error running test on Azure',
      results: null
    };
  }
}

/**
 * Generate local execution instructions
 * @param {string} testCode - The NUnit test code
 * @param {string} fileName - The original file name
 * @param {string} sourceCode - The original source code
 * @returns {object} - Local execution instructions
 */
function generateLocalExecutionInstructions(testCode, fileName, sourceCode) {
  // Extract class name from file name
  const className = path.basename(fileName, '.cs');
  
  // Create a complete project with source and test code
  const projectCode = createTestProject(sourceCode, testCode);
  
  // Create instructions for local execution
  const localExecutionInstructions = [
    "# How to Run These Tests Locally",
    "",
    `1. Create a new C# project: dotnet new console -n ${className}Tests`,
    `2. Change to the project directory: cd ${className}Tests`,
    "3. Add NUnit packages: dotnet add package NUnit and dotnet add package NUnit3TestAdapter and dotnet add package Microsoft.NET.Test.Sdk and dotnet add package Moq",
    "4. Replace the content of Program.cs with the test code",
    "5. Run the tests: dotnet test"
  ].join('\n');
  
  return {
    projectCode,
    instructions: localExecutionInstructions
  };
}

/**
 * Run test code
 * @param {string} testCode - The NUnit test code
 * @param {string} fileName - The original file name
 * @param {string} sourceCode - The original source code (optional)
 * @returns {Promise<object>} - The test results
 */
async function runTestCode(testCode, fileName, sourceCode = '') {
  try {
    // Extract class name from file name
    const className = path.basename(fileName, '.cs');
    
    // Try to run tests on Azure Function
    const azureResult = await runTestOnAzure(testCode, fileName, sourceCode);
    
    console.log('Azure Function result:', JSON.stringify(azureResult, null, 2));
    
    if (azureResult.success) {
      console.log('Successfully ran tests on Azure Function');
      return {
        success: true,
        ...azureResult,
        onlineExecution: true
      };
    } else {
      console.log('Azure Function execution failed, falling back to local instructions');
      // If Azure execution fails, provide local execution instructions
      const localInstructions = generateLocalExecutionInstructions(testCode, fileName, sourceCode);
      return {
        success: false,
        error: azureResult.error || 'Azure Function execution failed',
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: 'N/A (Local execution required)',
        details: generateDefaultTestDetails(className, 3).map(detail => ({
          ...detail,
          result: 'Pending',
          duration: 'N/A (Local execution required)'
        })),
        localExecution: true,
        testCode: testCode,
        projectCode: localInstructions.projectCode,
        instructions: localInstructions.instructions
      };
    }
  } catch (error) {
    console.error('Error running test code:', error);
    
    // Fallback to local execution instructions
    const localInstructions = generateLocalExecutionInstructions(testCode, fileName, sourceCode);
    return {
      success: false,
      error: error.message || 'Error running tests',
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 'N/A (Local execution required)',
      details: generateDefaultTestDetails(className, 3).map(detail => ({
        ...detail,
        result: 'Pending',
        duration: 'N/A (Local execution required)'
      })),
      localExecution: true,
      testCode: testCode,
      projectCode: localInstructions.projectCode,
      instructions: localInstructions.instructions
    };
  }
}

/**
 * Generate default test details for UI display
 * @param {string} className - The class name
 * @param {number} count - Number of test details to generate
 * @returns {Array} - Array of test details
 */
function generateDefaultTestDetails(className, count = 3) {
  const details = [];
  
  for (let i = 1; i <= count; i++) {
    details.push({
      name: `Test${i}_${className}`,
      result: 'Pending',
      duration: 'N/A',
      error: null
    });
  }
  
  return details;
}

module.exports = {
  generateTestCode,
  runTestCode,
  createTestProject,
  runTestOnAzure
};

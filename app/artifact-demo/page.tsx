// app/artifact-demo/page.tsx
"use client";
import React, { useState } from 'react';
import { ArtifactProvider } from '../context/ArtifactContext';
import { useArtifacts } from '../context/ArtifactContext';
import { useTheme } from '../context/ThemeContext';
import ArtifactLayout from '../components/ArtifactLayout';

// Demo component to show artifact creation
const ArtifactDemo = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { addArtifact, parseArtifactsFromMessage } = useArtifacts();
  const [message, setMessage] = useState('');

  // Function to add example artifacts
  const addExampleArtifacts = () => {
    // Add HTML example
    addArtifact({
      title: 'Simple HTML Page',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example HTML</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #45a049; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello from Artifact Display!</h1>
    <p>This is a simple HTML example displayed in the artifact panel.</p>
    <button id="demo-button">Click Me</button>
    <script>
      document.getElementById('demo-button').addEventListener('click', function() {
        alert('Button clicked!');
      });
    </script>
  </div>
</body>
</html>`,
      type: 'html'
    });

    // Add React component example
    addArtifact({
      title: 'Counter Component',
      content: `import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">React Counter</h2>
      <div className="flex justify-center items-center gap-4">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          -
        </button>
        <span className="text-2xl font-bold">{count}</span>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`,
      type: 'react'
    });

    // Add code example
    addArtifact({
      title: 'Fibonacci Function',
      content: `// Function to generate Fibonacci sequence up to n terms
function fibonacci(n) {
  const sequence = [0, 1];
  
  if (n <= 2) {
    return sequence.slice(0, n);
  }
  
  for (let i = 2; i < n; i++) {
    const nextValue = sequence[i - 1] + sequence[i - 2];
    sequence.push(nextValue);
  }
  
  return sequence;
}

// Example usage
const fibSequence = fibonacci(10);
console.log(fibSequence); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`,
      type: 'code',
      language: 'javascript'
    });
  };

  // Function to parse message for artifacts
  const handleParseMessage = () => {
    if (message.trim()) {
      parseArtifactsFromMessage(message);
      setMessage('');
    }
  };

  return (
    <div className={`p-8 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6">Artifact Display Demo</h1>
        <p className="mb-6">This page demonstrates the Artifact Display component. You can add example artifacts or paste content with code blocks to generate artifacts.</p>

        <div className="flex items-center mb-4 space-x-4">
          <button
            onClick={addExampleArtifacts}
            className={`px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Add Example Artifacts
          </button>
          
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Toggle Theme
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Create Artifacts from Message</h2>
          <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
            Paste a message containing code blocks (```language code```) to generate artifacts.
          </p>
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className={`flex-1 p-3 rounded-md border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Paste message with code blocks here..."
              rows={8}
            />
          </div>
          <div className="mt-2">
            <button
              onClick={handleParseMessage}
              disabled={!message.trim()}
              className={`px-4 py-2 rounded-md ${
                !message.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Parse Message
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-3">Sample Code Block Message</h2>
          <p className="text-sm mb-4">Copy this message to test artifact extraction:</p>
          <pre className={`p-4 rounded-md overflow-x-auto ${
            isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
          }`}>
{`Here's an HTML example:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Sample Page</title>
</head>
<body>
  <h1>Hello, Artifacts!</h1>
  <p>This is a sample HTML page.</p>
</body>
</html>
\`\`\`

And a JavaScript function:

\`\`\`javascript
function calculateArea(radius) {
  return Math.PI * radius * radius;
}

// Calculate area of a circle with radius 5
const area = calculateArea(5);
console.log(\`The area is \${area}\`);
\`\`\`

Try parsing this message to see artifacts appear!`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default function Demo() {
  return (
    <ArtifactProvider>
      <ArtifactLayout>
        <ArtifactDemo />
      </ArtifactLayout>
    </ArtifactProvider>
  );
}
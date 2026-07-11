import axios from 'axios';

const WORKFLOW_URL = import.meta.env.VITE_WORKFLOW_URL;
const API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY;

/**
 * Validates if the Roboflow credentials are valid (i.e. not placeholders)
 */
export const isApiConfigured = () => {
  return (
    API_KEY &&
    API_KEY !== 'YOUR_ROBOFLOW_API_KEY' &&
    API_KEY.trim() !== '' &&
    WORKFLOW_URL &&
    WORKFLOW_URL !== 'https://detect.roboflow.com/workflow/microplastics-workflow-id' &&
    WORKFLOW_URL.trim() !== ''
  );
};

// Recursive helper to scan any nested JSON object/array for a list of object detection predictions
const findPredictions = (obj) => {
  if (!obj || typeof obj !== 'object') return null;

  // If it's an array, check if it contains predictions
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const isPredictionArray = obj.every(item => 
        item && 
        typeof item === 'object' && 
        ('x' in item || 'x_center' in item) && 
        ('y' in item || 'y_center' in item) && 
        'width' in item && 
        'height' in item
      );
      if (isPredictionArray) {
        // Normalize coordinates key name if Roboflow uses x_center / y_center
        return obj.map(item => ({
          ...item,
          x: item.x !== undefined ? item.x : item.x_center,
          y: item.y !== undefined ? item.y : item.y_center
        }));
      }
    }
    
    // Recurse into array items
    for (const item of obj) {
      const found = findPredictions(item);
      if (found) return found;
    }
  } else {
    // Recurse into object values
    for (const key of Object.keys(obj)) {
      const found = findPredictions(obj[key]);
      if (found) return found;
    }
  }
  return null;
};

// Recursive helper to scan any nested JSON object/array for a base64 visualization image
const findAnnotatedImage = (obj) => {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findAnnotatedImage(item);
      if (found) return found;
    }
  } else {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        if (val.startsWith('data:image/') || (val.length > 10000 && /^[a-zA-Z0-9+/=\s\r\n]+$/.test(val.slice(0, 100)))) {
          return val;
        }
      }
      if (val && typeof val === 'object' && val.value && typeof val.value === 'string') {
        const str = val.value;
        if (str.startsWith('data:image/') || (str.length > 10000 && /^[a-zA-Z0-9+/=\s\r\n]+$/.test(str.slice(0, 100)))) {
          return str;
        }
      }
      const found = findAnnotatedImage(val);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Sends a base64 encoded image to Roboflow Workflow API.
 * If credentials are not configured, it simulates a professional laboratory analysis.
 * 
 * @param {string} base64Image - Base64 image string without data prefix
 * @param {object} imageDetails - { width, height, name, size }
 * @returns {Promise<object>} Detection results and performance metrics
 */
export const detectMicroplastics = async (base64Image, imageDetails = { width: 1024, height: 768 }) => {
  const startTime = performance.now();

  // If API is not configured, run in laboratory simulation mode
  if (!isApiConfigured()) {
    return new Promise((resolve) => {
      console.log('%c[Microplastics System] Running in Laboratory Simulation Mode.', 'color: #0284c7; font-weight: bold;');
      
      setTimeout(() => {
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        
        // Generate a deterministic number of detections based on the file name/size
        const seed = imageDetails.name ? imageDetails.name.length : 10;
        const numDetections = 8 + (seed % 15); // between 8 and 22 detections
        
        const classes = ['Fragment', 'Fiber', 'Pellet', 'Film'];
        const predictions = [];
        let totalConfidence = 0;
        let maxConfidence = 0;
        let minConfidence = 1.0;

        for (let i = 0; i < numDetections; i++) {
          const confidence = parseFloat((0.65 + ((i * 7 + seed) % 31) / 100).toFixed(4));
          totalConfidence += confidence;
          if (confidence > maxConfidence) maxConfidence = confidence;
          if (confidence < minConfidence) minConfidence = confidence;

          // Scatter predictions nicely across the image dimensions
          const boxWidth = Math.round(30 + ((i * seed + 12) % 40));
          const boxHeight = Math.round(30 + ((i * seed + 24) % 40));
          
          // Keep bounding boxes within boundaries
          const x = Math.round(boxWidth + ((i * 123 + seed * 45) % (imageDetails.width - boxWidth * 2)));
          const y = Math.round(boxHeight + ((i * 321 + seed * 67) % (imageDetails.height - boxHeight * 2)));

          predictions.push({
            id: `MP-${String(i + 1).padStart(3, '0')}`,
            class: classes[(i + seed) % classes.length],
            confidence: confidence,
            // Roboflow bounding boxes are typically centered: x, y (center coords), width, height
            x: x,
            y: y,
            width: boxWidth,
            height: boxHeight,
          });
        }

        const avgConfidence = parseFloat((totalConfidence / numDetections).toFixed(4));

        const mockResponse = {
          success: true,
          mode: 'simulation',
          summary: {
            totalDetected: numDetections,
            averageConfidence: avgConfidence,
            highestConfidence: maxConfidence,
            lowestConfidence: minConfidence,
            processingTimeMs,
            resolution: `${imageDetails.width} × ${imageDetails.height}`,
          },
          predictions,
          // In simulation, we don't have a server-annotated image, so we draw it client-side
          annotatedImage: null, 
        };

        resolve(mockResponse);
      }, 2000); // 2 second delay to simulate calculation
    });
  }

  // Real Roboflow Workflow API request
  try {
    const payload = {
      api_key: API_KEY,
      inputs: {
        image: {
          type: 'base64',
          value: base64Image,
        },
      },
    };

    let targetUrl = WORKFLOW_URL;
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser && targetUrl && targetUrl.startsWith('https://serverless.roboflow.com')) {
      targetUrl = targetUrl.replace('https://serverless.roboflow.com', '/api-roboflow');
      console.log('[Microplastics System] Routing request through proxy:', targetUrl);
    }

    const response = await axios.post(targetUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);

    // Parse Roboflow response. Depending on user's exact workflow:
    // It usually returns output blocks inside response.data.outputs or response.data.results
    // Let's print response for troubleshooting in laboratory console
    console.log('[Microplastics System] API Response:', response.data);

    const apiResponse = response.data;
    
    // Use the recursive helpers to robustly scan the entire response payload
    let predictions = findPredictions(apiResponse) || [];
    let annotatedImage = findAnnotatedImage(apiResponse);

    // Add unique IDs if they don't exist
    predictions = predictions.map((pred, index) => ({
      ...pred,
      id: pred.id || `MP-${String(index + 1).padStart(3, '0')}`,
      class: pred.class || 'Microplastic',
    }));

    // Calculate statistics
    const totalDetected = predictions.length;
    let averageConfidence = 0;
    let highestConfidence = 0;
    let lowestConfidence = 1.0;

    if (totalDetected > 0) {
      let totalConf = 0;
      predictions.forEach((pred) => {
        const conf = pred.confidence;
        totalConf += conf;
        if (conf > highestConfidence) highestConfidence = conf;
        if (conf < lowestConfidence) lowestConfidence = conf;
      });
      averageConfidence = parseFloat((totalConf / totalDetected).toFixed(4));
    } else {
      lowestConfidence = 0;
    }

    return {
      success: true,
      mode: 'api',
      summary: {
        totalDetected,
        averageConfidence,
        highestConfidence,
        lowestConfidence,
        processingTimeMs,
        resolution: `${imageDetails.width} × ${imageDetails.height}`,
      },
      predictions,
      annotatedImage,
    };
  } catch (error) {
    console.error('[Microplastics System] API Execution Failed:', error);
    
    let userFriendlyMessage = 'An unexpected error occurred during analysis.';
    let errorType = 'UNKNOWN';

    if (!navigator.onLine) {
      userFriendlyMessage = 'Internet connection disconnected. Please check your network and try again.';
      errorType = 'OFFLINE';
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      userFriendlyMessage = 'The request timed out. The microscope image resolution might be too large or the server is busy.';
      errorType = 'TIMEOUT';
    } else if (error.response) {
      errorType = `API_ERROR_${error.response.status}`;
      if (error.response.status === 401 || error.response.status === 403) {
        userFriendlyMessage = 'Authentication failed. Please verify your Roboflow API key in the environment configuration.';
      } else if (error.response.status === 404) {
        userFriendlyMessage = 'Workflow endpoint not found. Please verify your Roboflow Workflow URL.';
      } else if (error.response.status === 400) {
        userFriendlyMessage = 'Bad Request. The image base64 format might be incorrect or the payload layout is invalid.';
      } else {
        userFriendlyMessage = `Roboflow service returned error code ${error.response.status}: ${error.response.data?.error?.message || error.message}`;
      }
    } else {
      userFriendlyMessage = `Failed to connect to Roboflow. Error: ${error.message}`;
      errorType = 'CONNECTION_ERROR';
    }

    throw {
      success: false,
      message: userFriendlyMessage,
      type: errorType,
      originalError: error,
    };
  }
};

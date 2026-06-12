import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser
env.allowLocalModels = false;

// Suppress harmless ONNX warnings in the console
env.backends.onnx.logLevel = 'error';

// Define a variable to hold the pipeline instance
let img2textPipeline = null;

// Initialize the pipeline
async function getPipeline() {
  if (img2textPipeline === null) {
    // Post a message back to the main thread indicating loading started
    self.postMessage({ status: 'loading', message: 'Initializing AI Model...' });
    
    // We use Xenova/vit-gpt2-image-captioning which works flawlessly with v2 and is public
    img2textPipeline = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
      progress_callback: (x) => {
        self.postMessage({ status: 'progress', data: x });
      }
    });
    
    self.postMessage({ status: 'ready' });
  }
  return img2textPipeline;
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { imageUrl } = event.data;
  
  if (!imageUrl) return;

  try {
    const generator = await getPipeline();
    
    self.postMessage({ status: 'analyzing', message: 'Analyzing Scene...' });
    
    // Generate caption
    // blip-image-captioning-base doesn't need start_text but we can pass params
    const result = await generator(imageUrl, {
      max_new_tokens: 150,
      min_new_tokens: 20,
      repetition_penalty: 1.5,
    });
    
    // Capitalize first letter of result
    let finalDesc = result[0].generated_text;
    finalDesc = finalDesc.charAt(0).toUpperCase() + finalDesc.slice(1);
    
    self.postMessage({ 
      status: 'complete', 
      result: finalDesc 
    });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
});

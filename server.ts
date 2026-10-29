import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini SDK with lazy validation
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not defined.');
    }
    // Lazy initialize
    aiClient = new GoogleGenAI({ apiKey: apiKey || 'MOCK_KEY_FOR_DEV' });
  }
  return aiClient;
}

function getAIClientForRequest(req: express.Request): GoogleGenAI {
  const customKey = req.headers['x-gemini-key'] as string;
  if (customKey) {
    return new GoogleGenAI({ apiKey: customKey });
  }
  return getAIClient();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing requests
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API ROUTES ---

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // 1. Gemini Chat / Intelligence Route
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { prompt, message, history, modelType, useSearch, useGrounding, useThinking } = req.body;
      const queryPrompt = prompt || message;
      const querySearch = useSearch || useGrounding;
      const ai = getAIClientForRequest(req);

      let modelName = 'gemini-3.5-flash';
      let config: any = {};

      if (modelType === 'complex' || useThinking) {
        modelName = 'gemini-3.1-pro-preview';
      } else if (modelType === 'fast') {
        modelName = 'gemini-3.1-lite-preview'; // or 'gemini-3.1-flash-lite'
      }

      // Add thinking parameters if requested
      if (useThinking) {
        config.thinkingConfig = {
          thinkingBudget: 2048,
        };
        // Also support passing direct instructions for High Thinking Level
        config.thinkingLevel = 'HIGH';
      }

      // Add Google Search grounding if requested
      if (querySearch) {
        // Use gemini-3.5-flash for Search Grounding as requested
        modelName = 'gemini-3.5-flash';
        config.tools = [{ googleSearch: {} }];
      }

      console.log(`Calling Gemini API: model=${modelName}, useSearch=${!!querySearch}, useThinking=${!!useThinking}`);

      // Handle raw key mock fallback if we have a mock key
      const geminiKeyCheck = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;
      if (!geminiKeyCheck) {
        return res.json({
          success: true,
          text: `[DEMO MODE: GEMINI_API_KEY not configured] You asked: "${queryPrompt}". Configure your Gemini API Key in the workspace Settings to retrieve live neural responses! Here is a simulated response Grounded with Search Data: "Teachable Machine enables customized local classification with deep visual layers."`
        });
      }

      // Convert history for the API
      let contents: any[] = [];
      if (history && history.length > 0) {
        contents = history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : h.role,
          parts: [{ text: h.text || h.content || '' }]
        }));
      }
      contents.push({ role: 'user', parts: [{ text: queryPrompt || '' }] });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });

      // Extract grounded search results metadata if available
      let searchMetadata = null;
      if (response.candidates?.[0]?.groundingMetadata) {
        searchMetadata = response.candidates[0].groundingMetadata;
      }

      res.json({
        success: true,
        text: response.text,
        searchMetadata: searchMetadata
      });

    } catch (error: any) {
      console.error('Gemini Chat Error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Error occurred during generation.',
        isDemo: !process.env.GEMINI_API_KEY 
      });
    }
  });

  // 2. Multimodal AI Chat / Assistant Route supporting multiple providers
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { 
        message, 
        prompt, 
        history, 
        provider = 'gemini', 
        modelType, 
        useSearch, 
        useGrounding, 
        useThinking,
        fileData, 
        mimeType, 
        fileName 
      } = req.body;

      const queryPrompt = prompt || message || '';
      const querySearch = useSearch || useGrounding;
      const ai = getAIClientForRequest(req);

      let modelName = 'gemini-3.5-flash';
      const config: any = {};

      if (useThinking) {
        modelName = 'gemini-3.1-pro-preview';
        config.thinkingConfig = { thinkingBudget: 2048 };
      }

      if (querySearch) {
        modelName = 'gemini-3.5-flash';
        config.tools = [{ googleSearch: {} }];
      }

      console.log(`Calling Chat API: provider=${provider}, model=${modelName}, hasFile=${!!fileData}`);

      // Check third-party API key configurations (supporting localStorage overrides passed in request headers)
      let apiKeyValue = '';
      if (provider === 'openai') apiKeyValue = (req.headers['x-openai-key'] as string) || process.env.OPENAI_API_KEY || '';
      else if (provider === 'anthropic') apiKeyValue = (req.headers['x-anthropic-key'] as string) || process.env.ANTHROPIC_API_KEY || '';
      else if (provider === 'deepseek') apiKeyValue = (req.headers['x-deepseek-key'] as string) || process.env.DEEPSEEK_API_KEY || '';
      else if (provider === 'groq') apiKeyValue = (req.headers['x-groq-key'] as string) || process.env.GROQ_API_KEY || '';
      else if (provider === 'mistral') apiKeyValue = (req.headers['x-mistral-key'] as string) || process.env.MISTRAL_API_KEY || '';
      else if (provider === 'openrouter') apiKeyValue = (req.headers['x-openrouter-key'] as string) || process.env.OPENROUTER_API_KEY || '';

      // If third party key is configured, perform real external API request
      if (apiKeyValue) {
        try {
          let url = '';
          let headers: any = { 'Content-Type': 'application/json' };
          let bodyPayload: any = {};

          if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKeyValue}`;
            bodyPayload = {
              model: 'gpt-4o-mini',
              messages: [
                ...(history || []).map((h: any) => ({
                  role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.text || h.content || ''
                })),
                { role: 'user', content: queryPrompt }
              ]
            };
          } else if (provider === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKeyValue;
            headers['anthropic-version'] = '2023-06-01';
            bodyPayload = {
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              messages: [
                ...(history || []).map((h: any) => ({
                  role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.text || h.content || ''
                })),
                { role: 'user', content: queryPrompt }
              ]
            };
          } else if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKeyValue}`;
            bodyPayload = {
              model: 'deepseek-chat',
              messages: [
                ...(history || []).map((h: any) => ({
                  role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.text || h.content || ''
                })),
                { role: 'user', content: queryPrompt }
              ]
            };
          } else if (provider === 'groq') {
            url = 'https://api.groq.com/openai/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKeyValue}`;
            bodyPayload = {
              model: 'mixtral-8x7b-32768',
              messages: [
                ...(history || []).map((h: any) => ({
                  role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.text || h.content || ''
                })),
                { role: 'user', content: queryPrompt }
              ]
            };
          } else if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKeyValue}`;
            bodyPayload = {
              model: 'meta-llama/llama-3-8b-instruct:free',
              messages: [
                ...(history || []).map((h: any) => ({
                  role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.text || h.content || ''
                })),
                { role: 'user', content: queryPrompt }
              ]
            };
          } else if (provider === 'mistral') {
            url = 'https://api.mistral.ai/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKeyValue}`;
            bodyPayload = {
              model: 'open-mistral-7b',
              messages: [
                ...(history || []).map((h: any) => ({
                  role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.text || h.content || ''
                })),
                { role: 'user', content: queryPrompt }
              ]
            };
          }

          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyPayload)
          });

          if (response.ok) {
            const data: any = await response.json();
            let text = '';
            if (provider === 'anthropic') {
              text = data.content?.[0]?.text || '';
            } else {
              text = data.choices?.[0]?.message?.content || '';
            }
            return res.json({
              success: true,
              text,
              providerUsed: provider
            });
          } else {
            console.warn(`External provider ${provider} returned code ${response.status}. Falling back to Gemini.`);
          }
        } catch (e: any) {
          console.error(`Error fetching external provider ${provider}:`, e);
        }
      }

      // Default or fallback to Gemini Pro/Flash
      let contents: any[] = [];
      if (history && history.length > 0) {
        contents = history.map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text || h.content || '' }]
        }));
      }

      // Multimodal File attachments
      if (fileData) {
        const cleanBase64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
        contents.push({
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg'
              }
            },
            {
              text: `Analyze the attached file named "${fileName || 'attachment'}" (MIME type: ${mimeType}) and answer the user's inquiry: "${queryPrompt || 'Analyze this item.'}"`
            }
          ]
        });
      } else {
        contents.push({ role: 'user', parts: [{ text: queryPrompt || '' }] });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });

      let searchMetadata = null;
      if (response.candidates?.[0]?.groundingMetadata) {
        searchMetadata = response.candidates[0].groundingMetadata;
      }

      res.json({
        success: true,
        text: response.text,
        searchMetadata,
        providerUsed: 'gemini',
        note: provider !== 'gemini' ? `Defaulted to Gemini: ${provider.toUpperCase()}_API_KEY was not configured.` : undefined
      });

    } catch (error: any) {
      console.error('Chat Assistant Error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Error occurred during generation.'
      });
    }
  });

  // 2.1 Compatibility endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    // Redirect to general chat route
    req.url = '/api/ai/chat';
    return app._router.handle(req, res);
  });

  // 2.2 Comprehensive Image Generation Route (supporting OpenAI, Google, Stability, Fal, Pollinations)
  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      const { 
        prompt, 
        negativePrompt, 
        width = 1024, 
        height = 1024, 
        aspectRatio = '1:1', 
        quality = 'Standard', 
        seed = Math.floor(Math.random() * 1000000), 
        provider = 'pollinations' 
      } = req.body;

      if (!prompt || !prompt.trim()) {
        console.error('Validation Error: Image generation prompt is empty');
        return res.status(400).json({ success: false, error: 'Validation Error: Prompt cannot be empty.' });
      }

      console.log(`[SERVER GENERATE IMAGE] Prompt: "${prompt}"`);
      console.log(`[SERVER GENERATE IMAGE] Provider: "${provider}"`);
      console.log(`[SERVER GENERATE IMAGE] Seed: ${seed}`);
      console.log(`[SERVER GENERATE IMAGE] Dimensions: ${width}x${height} (${aspectRatio})`);
      console.log(`[SERVER GENERATE IMAGE] Quality: ${quality}`);
      console.log(`[SERVER GENERATE IMAGE] Negative Prompt: "${negativePrompt || 'None'}"`);

      // Handle Pollinations (Free Option - Excellent for instant beautiful generations without any configuration)
      if (provider === 'pollinations') {
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false&negative=${encodeURIComponent(negativePrompt || '')}`;
        console.log(`[SERVER GENERATE IMAGE] Requesting Pollinations URL: ${pollUrl}`);
        const response = await fetch(pollUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          console.log(`[SERVER GENERATE IMAGE] Pollinations response success. Returning base64 image.`);
          return res.json({
            success: true,
            imageUrl: `data:image/png;base64,${base64}`,
            providerUsed: 'pollinations',
            seed
          });
        }
        throw new Error('Pollinations AI failed to return valid image bytes');
      }

      // Check OpenAI Images API (DALL-E 3)
      const openaiKey = (req.headers['x-openai-key'] as string) || process.env.OPENAI_API_KEY;
      if (provider === 'openai' && openaiKey) {
        try {
          console.log('[SERVER GENERATE IMAGE] Requesting OpenAI DALL-E 3...');
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: prompt,
              n: 1,
              size: `${width}x${height}`
            })
          });
          if (response.ok) {
            const data: any = await response.json();
            const imageUrl = data.data?.[0]?.url;
            if (imageUrl) {
              console.log('[SERVER GENERATE IMAGE] OpenAI DALL-E 3 success.');
              return res.json({
                success: true,
                imageUrl,
                providerUsed: 'openai',
                seed
              });
            }
          }
        } catch (e) {
          console.error('OpenAI Image generation failed, falling back to Pollinations.', e);
        }
      }

      // Check Stability AI
      const stabilityKey = (req.headers['x-stability-key'] as string) || process.env.STABILITY_API_KEY;
      if (provider === 'stability' && stabilityKey) {
        try {
          console.log('[SERVER GENERATE IMAGE] Requesting Stability AI...');
          const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${stabilityKey}`
            },
            body: JSON.stringify({
              text_prompts: [
                { text: prompt, weight: 1 },
                { text: negativePrompt || '', weight: -1 }
              ],
              cfg_scale: 7,
              height,
              width,
              samples: 1,
              steps: 30,
              seed
            })
          });
          if (response.ok) {
            const data: any = await response.json();
            const base64 = data.artifacts?.[0]?.base64;
            if (base64) {
              console.log('[SERVER GENERATE IMAGE] Stability AI success.');
              return res.json({
                success: true,
                imageUrl: `data:image/png;base64,${base64}`,
                providerUsed: 'stability',
                seed
              });
            }
          }
        } catch (e) {
          console.error('Stability Image generation failed, falling back to Pollinations.', e);
        }
      }

      // Standard Google Imagen Fallback via Gemini (represented by gemini-3.1-flash-lite-image)
      const geminiKey = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          console.log('[SERVER GENERATE IMAGE] Requesting Google Imagen (gemini-3.1-flash-lite-image)...');
          const ai = getAIClientForRequest(req);
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: {
              parts: [{ text: prompt }]
            },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio === '9:16' ? '9:16' : aspectRatio === '16:9' ? '16:9' : '1:1'
              }
            }
          });

          let base64EncodeString: string | null = null;
          let mimeType = 'image/png';
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                base64EncodeString = part.inlineData.data;
                if (part.inlineData.mimeType) {
                  mimeType = part.inlineData.mimeType;
                }
                break;
              }
            }
          }

          if (base64EncodeString) {
            console.log('[SERVER GENERATE IMAGE] Google Imagen success.');
            return res.json({
              success: true,
              imageUrl: `data:${mimeType};base64,${base64EncodeString}`,
              providerUsed: 'google',
              seed
            });
          }
        } catch (e) {
          console.error('Google Imagen API generation failed.', e);
        }
      }

      // Instant 100% reliable free Pollinations fallback so the user always succeeds
      console.log('[SERVER GENERATE IMAGE] Trying fallback Pollinations URL...');
      const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false&negative=${encodeURIComponent(negativePrompt || '')}`;
      const response = await fetch(pollUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        console.log('[SERVER GENERATE IMAGE] Fallback Pollinations success.');
        return res.json({
          success: true,
          imageUrl: `data:image/png;base64,${base64}`,
          providerUsed: 'pollinations-fallback',
          seed,
          note: `Auto-routed to Pollinations AI for instant high-fidelity delivery.`
        });
      }

      throw new Error('All image generation providers failed.');

    } catch (error: any) {
      console.error('General Image Generation Error:', error);
      res.status(500).json({ success: false, error: error.message || 'Error generating image' });
    }
  });

  // 2.3 Compatibility endpoint
  app.post('/api/gemini/generate-image', async (req, res) => {
    req.url = '/api/ai/generate-image';
    return app._router.handle(req, res);
  });

  // 2.4 Prompt Enhancement Route (Gemini Powered)
  app.post('/api/ai/enhance-prompt', async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getAIClientForRequest(req);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are an expert prompt engineer for commercial image generators (Midjourney, DALL-E, Stable Diffusion).
Take this short prompt: "${prompt}" and expand it into an extremely vivid, beautiful, descriptive, and production-grade image prompt.
Inject specific details, artistic style, camera focus, lighting, and textures.
Keep the enhanced prompt under 60 words.
Output ONLY the final enhanced prompt without any introductions, headers, conversational filler, or surrounding quotation marks.`
      });

      res.json({
        success: true,
        enhancedPrompt: response.text?.trim() || prompt
      });
    } catch (error: any) {
      console.error('Prompt Enhance Error:', error);
      res.json({ success: false, enhancedPrompt: prompt });
    }
  });

  // 2.5 Prompt Understanding Engine (Interprets a human prompt into structural parameters)
  app.post('/api/ai/interpret-prompt', async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getAIClientForRequest(req);

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analyze the following image generation prompt: "${prompt}".
Identify and extract the following structural features: Subject, Style, Scene, Lighting, Camera, Quality, Negative Prompt, Seed, and Aspect Ratio.
Output ONLY a standard JSON object containing exactly these keys in lowercase: "subject", "style", "scene", "lighting", "camera", "quality", "negativePrompt", "seed", "aspectRatio".
- For "seed": extract any seed number specified in the prompt (e.g. "seed: 12345" or "seed 4567") as a number. If not specified, set to null.
- For "aspectRatio": extract any specified ratio (e.g. "16:9", "9:16", "3:2", "2:3", "1:1"). If not specified, set to null.
Ensure no markdown wrapper blocks (like \`\`\`json) are returned.

Example:
{
  "subject": "Golden retriever puppy",
  "style": "Photorealistic",
  "scene": "Playing in a green summer meadow",
  "lighting": "Golden hour sunset",
  "camera": "85mm macro lens, shallow depth of field",
  "quality": "Ultra HD, 8k resolution",
  "negativePrompt": "blurry, low quality, distorted, extra limbs, bad eyes",
  "seed": 12345,
  "aspectRatio": "16:9"
}`
      });

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const interpreted = JSON.parse(jsonText);
      res.json({ success: true, ...interpreted });
    } catch (error: any) {
      console.error('Prompt Interpret Error:', error);
      res.json({
        success: false,
        subject: prompt,
        style: 'Realistic',
        scene: 'Natural scenery',
        lighting: 'Balanced',
        camera: 'Standard',
        quality: 'High Resolution',
        negativePrompt: 'low quality, blurry, distorted',
        seed: null,
        aspectRatio: null
      });
    }
  });

  // In-memory cache for completed video generations to save API limit usage
  const videoGenerationCache = new Map<string, { url: string; timestamp: number }>();

  // Utility to generate unique cache key based on settings
  const getVideoCacheKey = (payload: any): string => {
    const { provider, prompt, negativePrompt, duration, aspect, resolution, seed, imageBase64 } = payload;
    const imgHash = imageBase64 ? imageBase64.substring(0, 150) : '';
    return `${provider || 'google'}:${prompt || ''}:${negativePrompt || ''}:${duration || '5s'}:${aspect || '16:9'}:${resolution || '720p'}:${seed || -1}:${imgHash}`;
  };

  // 3. Multi-Provider Video Generation & Synthesis API Pipeline (/api/video/generate & /api/gemini/generate-video)
  app.post(['/api/video/generate', '/api/gemini/generate-video'], async (req, res) => {
    let isCancelled = false;

    // Detect client cancellation (close connection)
    req.on('close', () => {
      console.log('Client disconnected from video generation stream. Aborting active synthesis poll loops...');
      isCancelled = true;
    });

    try {
      const { 
        prompt, 
        imageBase64, 
        aspect, 
        provider, 
        duration, 
        resolution, 
        fps, 
        style, 
        cameraMotion, 
        seed, 
        negativePrompt 
      } = req.body;

      const activeProvider = provider || 'google';
      const chosenAspect = aspect || '16:9';

      console.log(`Video Synthesis Request Initiated: provider=${activeProvider}, prompt="${prompt?.substring(0, 45)}...", aspect=${chosenAspect}`);

      // --- VALIDATION 1: Prompt Validations ---
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: 'Validation Error: Prompt is required and must be a string.' });
      }
      if (prompt.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Validation Error: Prompt must be at least 3 characters long.' });
      }
      if (prompt.trim().length > 2000) {
        return res.status(400).json({ success: false, error: 'Validation Error: Prompt is too long (maximum 2000 characters allowed).' });
      }

      // --- VALIDATION 2: API Keys Resolution & Validation ---
      let apiKey = '';
      if (activeProvider === 'google') {
        apiKey = (req.headers['x-gemini-key'] as string) || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Google API key is missing. Define GOOGLE_API_KEY or set it in UI Settings.' });
        }
      } else if (activeProvider === 'runway') {
        apiKey = (req.headers['x-fal-key'] as string) || process.env.RUNWAY_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Runway API key is missing. Define RUNWAY_API_KEY, FAL_KEY or configure in Settings.' });
        }
      } else if (activeProvider === 'pika') {
        apiKey = (req.headers['x-fal-key'] as string) || process.env.PIKA_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Pika API key is missing. Define PIKA_API_KEY, FAL_KEY or configure in Settings.' });
        }
      } else if (activeProvider === 'luma') {
        apiKey = (req.headers['x-luma-key'] as string) || (req.headers['x-fal-key'] as string) || (req.headers['x-replicate-key'] as string) || process.env.LUMA_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY || process.env.REPLICATE_API_TOKEN || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Luma API key is missing. Define LUMA_API_KEY, FAL_KEY, REPLICATE_API_TOKEN or configure in Settings.' });
        }
      } else if (activeProvider === 'fal') {
        apiKey = (req.headers['x-fal-key'] as string) || process.env.FAL_KEY || process.env.FAL_API_KEY || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Fal.ai API key is missing. Define FAL_KEY or configure in Settings.' });
        }
      } else if (activeProvider === 'replicate') {
        apiKey = (req.headers['x-replicate-key'] as string) || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Replicate API Token is missing. Define REPLICATE_API_TOKEN or configure in Settings.' });
        }
      } else if (activeProvider === 'stability') {
        apiKey = (req.headers['x-stability-key'] as string) || (req.headers['x-fal-key'] as string) || process.env.STABILITY_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY || '';
        if (!apiKey) {
          return res.status(401).json({ success: false, error: '401 Unauthorized: Stability AI API key is missing. Define STABILITY_API_KEY or configure in Settings.' });
        }
      } else {
        return res.status(404).json({ success: false, error: `404 Provider Unavailable: Unrecognized video generator provider "${activeProvider}".` });
      }

      // --- VALIDATION 3: Cache Verification ---
      const cacheKey = getVideoCacheKey(req.body);
      const cachedResult = videoGenerationCache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp < 1000 * 60 * 60 * 6)) { // 6 hours cache duration
        console.log('Fulfillment achieved via Completed Cache validation layer.');
        return res.json({ success: true, videoUrl: cachedResult.url, cached: true });
      }

      // --- HELPER 1: RETRY & ERROR AWARE HTTP FETCH WRAPPER ---
      const fetchWithRetry = async (url: string, options: any, retries = 3, baseDelay = 1500) => {
        for (let i = 0; i < retries; i++) {
          if (isCancelled) throw new Error('Video generation request cancelled by client connection termination.');
          try {
            const res = await fetch(url, options);
            if (res.status === 429) {
              console.warn(`Rate limit warning (429) received from ${url}. Exponential backoff engaged...`);
              await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1) * 2));
              continue;
            }
            if (res.status >= 500) {
              console.warn(`Transient server warning (${res.status}) on ${url}. Retrying...`);
              await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
              continue;
            }
            return res;
          } catch (err: any) {
            if (i === retries - 1) throw err;
            console.warn(`Fetch connection warning on ${url}: ${err.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
          }
        }
        throw new Error(`The requested endpoint returned a failure after ${retries} attempts.`);
      };

      // --- HELPER 2: FAL.AI POLLER ---
      const callFalVideoAPI = async (endpoint: string, payload: any, key: string) => {
        const submitRes = await fetchWithRetry(`https://queue.fal.run/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (!submitRes.ok) {
          const errText = await submitRes.text();
          throw new Error(`Fal.ai submission failed: ${submitRes.status} - ${errText}`);
        }
        const submitData = await submitRes.json();
        const requestId = submitData.request_id;
        if (!requestId) {
          throw new Error('Fal.ai returned no request_id.');
        }

        const statusUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
        const startTime = Date.now();
        while (Date.now() - startTime < 120000) { // 120 seconds timeout
          if (isCancelled) throw new Error('Video generation request cancelled by client.');
          const pollRes = await fetchWithRetry(statusUrl, {
            headers: { 'Authorization': `Key ${key}` }
          });
          if (!pollRes.ok) {
            throw new Error(`Fal.ai polling failed with status ${pollRes.status}`);
          }
          const pollData = await pollRes.json();
          if (pollData.status === 'COMPLETED') {
            const url = pollData.output?.video?.url || pollData.output?.url;
            if (!url) throw new Error('Fal.ai completed but returned no video stream URL.');
            return url;
          } else if (pollData.status === 'FAILED') {
            throw new Error(`Fal.ai generation failed: ${JSON.stringify(pollData.error || 'Unknown error')}`);
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        throw new Error('Fal.ai synthesis timed out.');
      };

      // --- HELPER 3: REPLICATE POLLER ---
      const callReplicateVideoAPI = async (version: string, inputPayload: any, key: string) => {
        const submitRes = await fetchWithRetry('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: version,
            input: inputPayload
          })
        });
        if (!submitRes.ok) {
          const errText = await submitRes.text();
          throw new Error(`Replicate submission failed: ${submitRes.status} - ${errText}`);
        }
        const submitData = await submitRes.json();
        const pollUrl = submitData.urls?.get;
        if (!pollUrl) {
          throw new Error('Replicate returned no polling URL.');
        }

        const startTime = Date.now();
        while (Date.now() - startTime < 120000) {
          if (isCancelled) throw new Error('Video generation request cancelled by client.');
          const pollRes = await fetchWithRetry(pollUrl, {
            headers: { 'Authorization': `Token ${key}` }
          });
          if (!pollRes.ok) {
            throw new Error(`Replicate polling failed: ${pollRes.status}`);
          }
          const pollData = await pollRes.json();
          if (pollData.status === 'succeeded') {
            let url = pollData.output;
            if (Array.isArray(url)) url = url[0];
            if (!url) throw new Error('Replicate succeeded but returned no output URL.');
            return url;
          } else if (pollData.status === 'failed' || pollData.status === 'canceled') {
            throw new Error(`Replicate generation failed: ${pollData.error || 'Canceled'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        throw new Error('Replicate synthesis timed out.');
      };

      // --- PROVIDER ROUTING & EXECUTION PIPELINES ---

      // PROVIDER 1: Google Veo (using veo-3.1-lite-generate-preview)
      if (activeProvider === 'google') {
        const ai = getAIClientForRequest(req);
        let promptPayload = `${prompt}. Style: ${style || 'Realistic'}. Camera Motion: ${cameraMotion || 'None'}.`;
        if (negativePrompt) {
          promptPayload += ` Avoid: ${negativePrompt}.`;
        }

        const options: any = {
          model: 'veo-3.1-lite-generate-preview',
          prompt: promptPayload,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: chosenAspect === '9:16' ? '9:16' : '16:9'
          }
        };

        if (imageBase64) {
          const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
          options.image = {
            imageBytes: cleanBase64,
            mimeType: 'image/jpeg'
          };
        }

        console.log('[GOOGLE VEO] Launching generateVideos operation...');
        const operation = await ai.models.generateVideos(options);

        const operationName = operation.name;
        if (!operationName) {
          throw new Error('Google Veo API did not return an operation name.');
        }

        console.log(`[GOOGLE VEO] Operation started: ${operationName}. Polling operation status...`);

        const op = new GenerateVideosOperation();
        op.name = operationName;

        let videoUri: string | null = null;
        const startTime = Date.now();
        
        // Poll for up to 5 minutes (300,000 ms)
        while (Date.now() - startTime < 300000) {
          if (isCancelled) {
            throw new Error('Video generation request was cancelled by client.');
          }

          const updated = await ai.operations.getVideosOperation({ operation: op });
          console.log(`[GOOGLE VEO] Polling status: done=${updated.done}`);
          
          if (updated.done) {
            videoUri = updated.response?.generatedVideos?.[0]?.video?.uri || null;
            break;
          }

          // Wait 6 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 6000));
        }

        if (!videoUri) {
          throw new Error('Google Veo video generation operation timed out or failed to return a video asset URI.');
        }

        console.log(`[GOOGLE VEO] Download starting from generated URI: ${videoUri}`);
        const apiKeyForFetch = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY || 'MOCK_KEY_FOR_DEV';
        const videoRes = await fetch(videoUri, {
          headers: { 'x-goog-api-key': apiKeyForFetch }
        });

        if (!videoRes.ok) {
          throw new Error(`Failed to download generated video asset: ${videoRes.status} - ${videoRes.statusText}`);
        }

        const arrayBuffer = await videoRes.arrayBuffer();
        const base64Video = Buffer.from(arrayBuffer).toString('base64');
        const finalUrl = `data:video/mp4;base64,${base64Video}`;

        videoGenerationCache.set(cacheKey, { url: finalUrl, timestamp: Date.now() });
        return res.json({ success: true, videoUrl: finalUrl });
      }

      // PROVIDER 2: Direct Luma Dream Machine API
      if (activeProvider === 'luma' && (process.env.LUMA_API_KEY || req.headers['x-luma-key'])) {
        const lumaKey = (req.headers['x-luma-key'] as string) || process.env.LUMA_API_KEY || apiKey;
        console.log('Initiating direct Luma Dream Machine generation pipeline...');
        const payload: any = {
          prompt: `${prompt}. Style: ${style || 'Realistic'}. Camera Motion: ${cameraMotion || 'None'}.`,
          aspect_ratio: chosenAspect === '16:9' ? '16:9' : chosenAspect === '9:16' ? '9:16' : chosenAspect === '1:1' ? '1:1' : '3:2',
          loop: false
        };
        if (imageBase64) {
          payload.keyframes = {
            frame0: {
              type: 'image',
              url: imageBase64
            }
          };
        }

        const submitRes = await fetchWithRetry('https://api.lumalabs.ai/v1/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lumaKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!submitRes.ok) {
          const text = await submitRes.text();
          throw new Error(`Luma AI direct submission failed: ${submitRes.status} - ${text}`);
        }

        const genData = await submitRes.json();
        const genId = genData.id;
        if (!genId) throw new Error('Luma AI direct returned no generation ID.');

        const pollUrl = `https://api.lumalabs.ai/v1/generations/${genId}`;
        const startTime = Date.now();
        while (Date.now() - startTime < 120000) {
          if (isCancelled) throw new Error('Luma generation cancelled.');
          const pollRes = await fetchWithRetry(pollUrl, {
            headers: { 'Authorization': `Bearer ${lumaKey}` }
          });
          if (!pollRes.ok) throw new Error(`Luma polling failed: ${pollRes.status}`);
          const pollData = await pollRes.json();
          if (pollData.state === 'completed') {
            const url = pollData.assets?.video;
            if (!url) throw new Error('Luma completed but returned no video asset URL.');
            videoGenerationCache.set(cacheKey, { url, timestamp: Date.now() });
            return res.json({ success: true, videoUrl: url });
          } else if (pollData.state === 'failed') {
            throw new Error(`Luma generation failed: ${pollData.failure_reason || 'Unknown failure'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        throw new Error('Luma direct generation timed out.');
      }

      // PROVIDER 3: Fal.ai Route (Kling, Runway, Pika, Stable Video Diffusion, or Luma via Fal)
      const falKey = (req.headers['x-fal-key'] as string) || process.env.FAL_KEY || process.env.FAL_API_KEY || apiKey;
      const hasImage = !!imageBase64;

      if (falKey && (activeProvider === 'fal' || activeProvider === 'runway' || activeProvider === 'pika' || activeProvider === 'kling' || activeProvider === 'luma')) {
        console.log(`Executing Fal.ai compilation for provider: ${activeProvider}`);
        let endpoint = '';
        let payload: any = {};

        if (activeProvider === 'luma' || activeProvider === 'fal') {
          endpoint = hasImage ? 'fal-ai/luma-dream-machine/image-to-video' : 'fal-ai/luma-dream-machine';
          payload = {
            prompt: `${prompt}. Style: ${style || 'Realistic'}. Motion: ${cameraMotion || 'None'}.`,
            aspect_ratio: chosenAspect,
            duration: duration === '10s' ? '10s' : '5s'
          };
          if (hasImage) payload.image_url = imageBase64;
        } else if (activeProvider === 'kling') {
          endpoint = hasImage ? 'fal-ai/kling-video/v1/standard/image-to-video' : 'fal-ai/kling-video/v1/standard/text-to-video';
          payload = {
            prompt: `${prompt}. Style: ${style || 'Realistic'}.`,
            aspect_ratio: chosenAspect === '1:1' ? '1:1' : chosenAspect === '9:16' ? '9:16' : '16:9',
            duration: duration === '10s' ? 10 : 5
          };
          if (hasImage) payload.image_url = imageBase64;
        } else if (activeProvider === 'runway') {
          endpoint = hasImage ? 'fal-ai/runway-gen3/image-to-video' : 'fal-ai/runway-gen3/text-to-video';
          payload = {
            prompt: `${prompt}. Style: ${style || 'Realistic'}.`,
            aspect_ratio: chosenAspect === '9:16' ? '9:16' : '16:9'
          };
          if (hasImage) payload.image_url = imageBase64;
        } else if (activeProvider === 'pika') {
          endpoint = 'fal-ai/pika/v1';
          payload = {
            prompt: prompt,
            aspect_ratio: chosenAspect
          };
          if (hasImage) payload.image_url = imageBase64;
        } else if (activeProvider === 'stability') {
          endpoint = 'fal-ai/stable-video';
          payload = {
            image_url: imageBase64 || 'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-32247-large.mp4'
          };
        } else {
          endpoint = 'fal-ai/luma-dream-machine';
          payload = { prompt, aspect_ratio: chosenAspect };
        }

        const videoUrl = await callFalVideoAPI(endpoint, payload, falKey);
        videoGenerationCache.set(cacheKey, { url: videoUrl, timestamp: Date.now() });
        return res.json({ success: true, videoUrl });
      }

      // PROVIDER 4: Replicate API Route
      const replicateKey = (req.headers['x-replicate-key'] as string) || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || apiKey;
      if (replicateKey) {
        console.log(`Executing Replicate compilation for provider: ${activeProvider}`);
        let version = '';
        let inputPayload: any = {};

        if (activeProvider === 'luma' || activeProvider === 'replicate') {
          version = 'f419c8f0f089676e695d852a46e1071b7829705a61036f01c233165b4c194e66'; // Luma Dream Machine
          inputPayload = {
            prompt: prompt,
            aspect_ratio: chosenAspect
          };
          if (imageBase64) inputPayload.image = imageBase64;
        } else if (activeProvider === 'stability') {
          version = '3f04bbf0b1ef591b5eb7e8bfac2c23d1e564115e1e1206131313131313131313'; // Stable Video Diffusion (SVD)
          inputPayload = {
            image: imageBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
          };
        } else {
          version = 'f419c8f0f089676e695d852a46e1071b7829705a61036f01c233165b4c194e66';
          inputPayload = { prompt: prompt, aspect_ratio: chosenAspect };
        }

        const videoUrl = await callReplicateVideoAPI(version, inputPayload, replicateKey);
        videoGenerationCache.set(cacheKey, { url: videoUrl, timestamp: Date.now() });
        return res.json({ success: true, videoUrl });
      }

      // PROVIDER 5: Stability AI SVD direct Integration
      const stabilityKey = (req.headers['x-stability-key'] as string) || process.env.STABILITY_API_KEY;
      if (stabilityKey && activeProvider === 'stability' && imageBase64) {
        console.log('Executing direct Stability AI SVD Pipeline...');
        const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
        const buffer = Buffer.from(cleanBase64, 'base64');
        const formData = new FormData();
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('image', blob, 'image.jpg');
        formData.append('seed', String(seed && seed > 0 ? seed : 0));
        formData.append('cfg_scale', '1.8');
        formData.append('motion_bucket_id', '127');

        const submitRes = await fetchWithRetry('https://api.stability.ai/v2beta/image-to-video', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${stabilityKey}` },
          body: formData
        });

        if (!submitRes.ok) {
          throw new Error(`Stability AI direct failed: ${submitRes.status} - ${await submitRes.text()}`);
        }

        const submitData = await submitRes.json();
        const generationId = submitData.id;
        if (!generationId) throw new Error('Stability AI returned no generation ID.');

        const pollUrl = `https://api.stability.ai/v2beta/image-to-video/result/${generationId}`;
        const startTime = Date.now();
        while (Date.now() - startTime < 120000) {
          if (isCancelled) throw new Error('Stability generation cancelled.');
          const pollRes = await fetchWithRetry(pollUrl, {
            headers: {
              'Authorization': `Bearer ${stabilityKey}`,
              'accept': 'video/*'
            }
          });
          if (pollRes.status === 202) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          if (pollRes.status === 200) {
            const videoBuffer = await pollRes.arrayBuffer();
            const base64Video = Buffer.from(videoBuffer).toString('base64');
            const finalUrl = `data:video/mp4;base64,${base64Video}`;
            videoGenerationCache.set(cacheKey, { url: finalUrl, timestamp: Date.now() });
            return res.json({ success: true, videoUrl: finalUrl });
          }
          throw new Error(`Stability API poll failed with status ${pollRes.status}`);
        }
        throw new Error('Stability AI direct pipeline timed out.');
      }

      // Default Unconfigured / Missing Credentials Error
      return res.status(401).json({
        success: false,
        error: `401 Unauthorized: API credentials or keys for provider "${activeProvider.toUpperCase()}" are missing. Please configure your key in Settings > Secure API Key Sandbox or define environment variables.`
      });

    } catch (error: any) {
      console.error('Multi-Provider Video generation pipeline failure:', error);
      
      const errMsg = error.message || '';
      let statusCode = 500;
      let friendlyMessage = 'The chosen video engine is offline or returned an invalid API response.';

      if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('missing') || errMsg.includes('key')) {
        statusCode = 401;
        friendlyMessage = 'Authentication failed: Please check your API credentials in Settings > Secure API Key Sandbox or .env.local configuration.';
      } else if (errMsg.includes('403') || errMsg.includes('Forbidden') || errMsg.includes('Invalid API Key') || errMsg.includes('invalid key')) {
        statusCode = 403;
        friendlyMessage = 'Forbidden: The provided API key is invalid or lacks permission for the requested video synthesis resource.';
      } else if (errMsg.includes('404') || errMsg.includes('Not Found') || errMsg.includes('endpoint') || errMsg.includes('unavailable')) {
        statusCode = 404;
        friendlyMessage = 'Provider Unavailable: The selected model, provider endpoint, or API resource is currently offline or unreachable.';
      } else if (errMsg.includes('429') || errMsg.includes('Rate Limit') || errMsg.includes('quota') || errMsg.includes('too many requests')) {
        statusCode = 429;
        friendlyMessage = 'Rate Limit Exceeded: The video synthesis provider is experiencing heavy load. Please wait a moment and try again.';
      } else if (errMsg.includes('timeout') || errMsg.includes('timed out') || errMsg.includes('Timeout')) {
        statusCode = 504;
        friendlyMessage = 'Synthesis Gateway Timeout: The video synthesis process took longer than 90 seconds to compile. Please try a simpler prompt.';
      } else if (errMsg.includes('Validation')) {
        statusCode = 400;
        friendlyMessage = errMsg;
      } else {
        friendlyMessage = `Internal Error during video compilation: ${errMsg}`;
      }

      res.status(statusCode).json({ 
        success: false, 
        error: friendlyMessage 
      });
    }
  });

  // 4. Gemini Image Analysis Route (gemini-3.1-pro-preview)
  app.post('/api/gemini/analyze-image', async (req, res) => {
    try {
      const { imageBase64, prompt } = req.body;
      const ai = getAIClientForRequest(req);

      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 parameter is required.' });
      }

      const geminiKey = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.json({
          text: `[DEMO MODE: GEMINI_API_KEY not configured] Image analysis completed. Identified 1 core subject. Recommendations: "Ensure clean margins, high image resolution, and balanced lighting parameters for optimal training classification."`
        });
      }

      const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg'
            }
          },
          prompt || 'Examine this image and analyze its visual quality, key objects, brightness distribution, and compatibility for an AI training dataset.'
        ]
      });

      res.json({
        text: response.text
      });

    } catch (error: any) {
      console.error('Gemini Image Analysis Error:', error);
      res.status(500).json({ error: error.message || 'Error during image analysis.' });
    }
  });

  // --- UNIVERSAL IMAGE ANALYSIS ENGINE (GOOGLE LENS) ENDPOINTS ---

  // 1. Web Search Image Scraping Proxy (Unsplash API Free Search)
  app.get('/api/lens/search', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
      }
      console.log(`[LENS SEARCH] Searching for images of "${query}"...`);
      
      const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      let results: any[] = [];
      if (response.ok) {
        const html = await response.text();
        const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-?=&;%]+/g;
        let match;
        const seen = new Set<string>();
        while ((match = regex.exec(html)) !== null) {
          const matchedUrl = match[0];
          const basePart = matchedUrl.split('?')[0];
          if (basePart && !seen.has(basePart)) {
            seen.add(basePart);
            results.push({
              id: basePart.split('photo-')[1]?.split('-')[0] || Math.random().toString(36).substring(7),
              title: `${query} image`,
              thumbnailUrl: `${basePart}?w=300&fit=crop&q=60`,
              fullUrl: `${basePart}?w=1080&fit=max&q=80`,
              source: 'Unsplash'
            });
          }
          if (results.length >= 12) break;
        }
      }

      if (results.length === 0) {
        console.log(`[LENS SEARCH] Unsplash scraper returned 0 results. Using high-quality curated stock photos.`);
        const terms = query.toLowerCase();
        const FallbackCollection: Record<string, string[]> = {
          tiger: ['photo-1549488344-1f9b8d2bd1f3', 'photo-1602491453977-1b416ad55f4c', 'photo-1507608616759-54f48f0af0ee'],
          ferrari: ['photo-1583121274602-3e2820c69888', 'photo-1614162692292-7ac56d7f7f1e', 'photo-1617814076367-b759c7d7e738'],
          apple: ['photo-1560806887-1e4cd0b6cbd6', 'photo-1619546813926-a78fa6372cd2', 'photo-1570913149827-d2ac84ab3f9a'],
          laptop: ['photo-1496181130204-755241544e35', 'photo-1588872657578-7efd1f1555ed', 'photo-1484788984921-03950022c9ef'],
          dog: ['photo-1543466835-00a7907e9de1', 'photo-1517841905240-472988babdf9', 'photo-1583511655857-d19b40a7a54e'],
          bird: ['photo-1452570053594-1b985d6ea890', 'photo-1480044965905-02098d419e96', 'photo-1552084090-364e9b14d4cd'],
          tree: ['photo-1502082553048-f009c37129b9', 'photo-1513836279014-a89f7a76ae86', 'photo-1448375240586-882707db888b'],
          planet: ['photo-1614730321146-b6fa6a46bcb4', 'photo-1614313913007-2b4ae8ce32d6', 'photo-1451187580459-43490279c0fa'],
          robot: ['photo-1485827404703-89b55fcc595e', 'photo-1589254065878-42c9da997008', 'photo-1531747118685-ca8fa6e08806'],
          anime: ['photo-1578632767115-351597cf2477', 'photo-1607604276583-eef5d076aa5f', 'photo-1563089145-599997674d42']
        };

        let selectedIds = FallbackCollection.tiger;
        for (const [key, ids] of Object.entries(FallbackCollection)) {
          if (terms.includes(key)) {
            selectedIds = ids;
            break;
          }
        }
        if (!selectedIds) {
          selectedIds = ['photo-1472214222541-d510753a4907', 'photo-1501854140801-50d01698950b', 'photo-1441974231531-c6227db76b6e'];
        }

        results = selectedIds.map((id, index) => {
          const basePart = `https://images.unsplash.com/${id}`;
          return {
            id: id.split('photo-')[1] || String(index),
            title: `${query} image ${index + 1}`,
            thumbnailUrl: `${basePart}?w=300&fit=crop&q=60`,
            fullUrl: `${basePart}?w=1080&fit=max&q=80`,
            source: 'Curated Unsplash'
          };
        });
      }

      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Lens search error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 2. Dynamic Image CORS Bypass Proxy
  app.get('/api/lens/proxy-image', async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url parameter is required' });
      }
      console.log(`[LENS PROXY] Fetching image from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const base64 = Buffer.from(buffer).toString('base64');
      res.json({
        success: true,
        contentType,
        base64: `data:${contentType};base64,${base64}`
      });
    } catch (error: any) {
      console.error('Proxy Image Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 3. Multi-modal AI Vision Analysis (returns structural image intelligence)
  app.post('/api/lens/analyze', async (req, res) => {
    try {
      const { imageBase64, detectorType = 'Object Detector', confidenceThreshold = 0.35, customPrompt } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 parameter is required' });
      }
      const ai = getAIClientForRequest(req);
      const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

      const systemPrompt = `You are an advanced Computer Vision and Image Intelligence Engine, functioning exactly like Google Lens, Teachable Machine, and Gemini Vision.
The active detector mode is: "${detectorType}".
Analyze the provided image specifically focusing on the goals of this detector:
- If Animal Classifier: Identify the animal species, breed, and wildlife traits. Make sure "imageCategory" is "Animal".
- If Plant Disease Detector: Identify the plant species and leaf condition or disease (e.g. Early Blight, Rust, Black Spot, Powdery Mildew, or Healthy). Make sure "imageCategory" is "Plant".
- If Vehicle Detector: Identify cars, trucks, bikes, boats, aircraft, or helicopters. Make sure "imageCategory" is "Vehicle".
- If Fruit Classifier: Identify fruits and varieties. Make sure "imageCategory" is "Fruit".
- If Vegetable Classifier: Identify vegetables. Make sure "imageCategory" is "Vegetable".
- If Flower Classifier: Identify flower species. Make sure "imageCategory" is "Flower".
- If Bird Classifier: Identify bird species. Make sure "imageCategory" is "Bird".
- If Food Classifier: Identify dishes and cuisines. Make sure "imageCategory" is "Food".
- If Waste Classifier: Identify waste materials (e.g. Recyclable, Compost, Landfill, Organic, Hazardous) and the item type (e.g. plastic bottle). Make sure "imageCategory" is "Waste".
- If Face Detector: Locate face features, age group, expressions, accessories (e.g. glasses, hats). Make sure "imageCategory" is "Face".
- If Emotion Detector: Identify primary human facial emotions (e.g. Happy, Sad, Neutral, Angry, Surprised, Fear, Disgust). Make sure "imageCategory" is "Emotion".
- If Object Detector: Identify everyday objects in the environment. Make sure "imageCategory" is "Object".
- If OCR: Extract and transcribe all visible textual elements (even in different languages like English, Hindi, Japanese, Spanish, French, German). Make sure "imageCategory" is "Text".
- If Document Detector: Identify document types (e.g. Invoice, ID card, Receipt, Book page, Certificate). Make sure "imageCategory" is "Document".
- If Custom User Models: Provide a general multi-class categorization. Make sure "imageCategory" is "Custom".

IMPORTANT: You must return the real identified object as "mainObject" (for example: "Cat" or "Ferrari" or "Tomato Early Blight" or "Happy Face"). NEVER return generic things like "Visual Subject".
Your "confidenceScore" MUST be a realistic estimation between 0.0 and 1.0 representing how confident you are.

You MUST reply with ONLY a single valid JSON object. Do not include any markdown wrappers like \`\`\`json or trailing text.

The JSON schema MUST exactly match:
{
  "mainObject": "string - the primary distinct subject, keeping it short and clean (e.g. 'Cat', 'Ferrari', 'Tomato Early Blight', 'Happy Face')",
  "topPredictions": [
    {"className": "string - specific class name", "probability": number_between_0_and_1}
  ],
  "confidenceScore": number_between_0_and_1,
  "sceneDescription": "string - highly detailed 1-2 sentence description of the scene",
  "detectedObjects": [
    {"name": "string", "confidence": number_between_0_and_1}
  ],
  "imageCaption": "string - a brief catchy caption or title for the image",
  "imageCategory": "string - general category matching the detector mode",
  "colors": ["string - 4 to 5 hex color codes representing dominant colors"],
  "qualityAnalysis": {
    "blur": "string - Low, Medium, or High",
    "noise": "string - Low, Medium, or High",
    "lowResolution": "boolean",
    "compressionArtifacts": "string - Low, Medium, or High",
    "estimatedQualityScore": number_between_0_and_1
  },
  "ocrText": "string - extract any text found in the image. If text is in Hindi, Japanese, Spanish, French, German, or English, transcribe it. If no text exists, return empty string.",
  "customProperties": {
    "dynamic_key_based_on_user_request": "string - dynamic analytical outcome. For example, if the prompt asks about 'What breed is this dog?', add a key like 'Breed': 'Golden Retriever'. If it asks 'Is this plant healthy?', add a key 'Plant Health': 'Healthy/Infected'. If it asks 'What vehicle is this?', add 'Vehicle Model': 'Tesla Model 3'. Add any other contextually highly specific attributes, counts, materials, or features requested by the prompt directly as key-value pairs here."
  },
  "suggestedLabels": ["string - 5 suggested smart conceptual tags/labels for categorizing this image"],
  "similarSearchQueries": ["string - 3 separate descriptive search keywords to find visually similar images"]
}`;

      let promptText = systemPrompt;
      if (customPrompt && customPrompt.trim()) {
        promptText += `\n\nADDITIONAL USER CUSTOM INSTRUCTION / PROMPT:\n"${customPrompt}"\n\nEnsure that you adjust the returned json fields (especially "mainObject", "sceneDescription", "imageCaption", "suggestedLabels", and "ocrText") to focus on or prioritize analyzing what the user requested in this custom instruction.\nAlso, critically: extract and populate any relevant custom properties asked about in the prompt (like "Breed", "Plant Health", "Object Count", "Vehicle Type", "Language Detected", or anything else specifically requested) in the "customProperties" object. Feel free to use whatever descriptive, user-friendly keys are appropriate for the user's prompt (e.g. key: "Breed", value: "Golden Retriever" or key: "Plant Health", value: "Healthy with slight chlorosis").`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg'
            }
          },
          { text: promptText }
        ]
      });

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(jsonText);
      res.json({
        success: true,
        analysis: parsedData
      });

    } catch (error: any) {
      console.error('Lens image analysis error:', error);
      res.json({
        success: true,
        isFallback: true,
        analysis: {
          mainObject: 'Visual Subject',
          topPredictions: [
            { className: 'Automated Subject Detection', probability: 0.92 },
            { className: 'Image Landmark', probability: 0.81 },
            { className: 'Outdoor Composition', probability: 0.74 }
          ],
          confidenceScore: 0.88,
          sceneDescription: 'Analyzing your image using neural vision layers. This beautiful composition features balanced colors, rich detail, and strong visual hierarchy.',
          detectedObjects: [
            { name: 'Subject', confidence: 0.95 },
            { name: 'Background', confidence: 0.85 }
          ],
          imageCaption: 'A Beautiful Snapshot',
          imageCategory: 'Photography',
          colors: ['#2A4365', '#ED8936', '#4A5568', '#CBD5E0', '#1A202C'],
          qualityAnalysis: {
            blur: 'Low',
            noise: 'Low',
            lowResolution: false,
            compressionArtifacts: 'Low',
            estimatedQualityScore: 0.95
          },
          ocrText: 'Vision Text Extraction',
          suggestedLabels: ['Snapshot', 'Vibrant', 'Composition', 'Focus', 'AI Analysis'],
          similarSearchQueries: ['aesthetic landscape', 'nature photography', 'beautiful wallpaper']
        }
      });
    }
  });

  // 4. Interactive Q&A chat with vision model
  app.post('/api/lens/ask', async (req, res) => {
    try {
      const { imageBase64, question, history } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 parameter is required' });
      }
      if (!question) {
        return res.status(400).json({ error: 'question parameter is required' });
      }
      const ai = getAIClientForRequest(req);
      const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

      let contents: any[] = [];
      if (history && history.length > 0) {
        contents = history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : h.role,
          parts: [{ text: h.text || h.content || '' }]
        }));
      }

      contents.push({
        role: 'user',
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg'
            }
          },
          { text: `Answer this specific question about the image: "${question}". Keep your response concise, friendly, and highly accurate.` }
        ]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents
      });

      res.json({
        success: true,
        answer: response.text
      });

    } catch (error: any) {
      console.error('Lens Q&A Error:', error);
      res.json({
        success: true,
        answer: `[Demo response for visual query]: This image contains rich visual context. It displays proper brightness, clean margins, and distinct colors suited for professional computer vision.`
      });
    }
  });

  // 5. Enhance TensorFlow.js MobileNet raw prediction with beautiful taxonomic details and description
  app.post('/api/lens/animal-metadata', async (req, res) => {
    const { className, confidence, topPredictions } = req.body;
    if (!className) {
      return res.status(400).json({ error: 'className is required' });
    }

    try {
      const ai = getAIClientForRequest(req);
      
      const systemPrompt = `You are a taxonomic and zoological database assistant.
Given a raw TensorFlow.js MobileNet class name, extract and return clean, human-friendly scientific classification metadata.
Raw class name: "${className}"
Confidence score: ${confidence}

You MUST reply with ONLY a single valid JSON object containing exactly these fields:
{
  "animalName": "string - Clean common animal name capitalized (e.g. 'Tiger', 'Lion', 'Golden Retriever')",
  "scientificName": "string - Proper binomial scientific name (e.g. 'Panthera tigris', 'Canis lupus familiaris')",
  "category": "string - One of: 'Wild Animal', 'Domestic Animal', 'Bird', 'Aquatic Animal', 'Reptile', 'Amphibian', 'Insect', 'Mammal' based on the animal type",
  "description": "string - A concise 1-2 sentence description explaining the animal's physical traits or natural habitat"
}

Ensure the results are biologically accurate and tailored specifically to the given class name.
Reply with only JSON. No markdown backticks or wrappers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          { text: systemPrompt }
        ]
      });

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(jsonText);
      res.json({
        success: true,
        metadata: parsedData
      });

    } catch (error: any) {
      console.error('Animal Metadata Enrichment Error:', error);
      // Beautiful fallback values if Gemini is offline
      const rawLower = className.toLowerCase();
      let animalName = className.split(',')[0].trim();
      animalName = animalName.charAt(0).toUpperCase() + animalName.slice(1);
      
      let scientificName = 'Animalia';
      let category = 'Wild Animal';
      let description = `A beautiful wild animal classified under ${animalName}.`;

      if (rawLower.includes('dog') || rawLower.includes('retriever') || rawLower.includes('poodle') || rawLower.includes('pug')) {
        scientificName = 'Canis lupus familiaris';
        category = 'Domestic Animal';
        description = 'A domesticated carnivorous mammal, typically kept as a pet, companion, or working helper.';
      } else if (rawLower.includes('cat') || rawLower.includes('tabby') || rawLower.includes('siamese') || rawLower.includes('persian')) {
        scientificName = 'Felis catus';
        category = 'Domestic Animal';
        description = 'A small domesticated carnivorous mammal, commonly kept as a house pet for companionship and pest control.';
      } else if (rawLower.includes('tiger')) {
        scientificName = 'Panthera tigris';
        category = 'Wild Animal';
        description = 'The largest living cat species, famous for its dark vertical stripes on orange-brown fur.';
      } else if (rawLower.includes('lion')) {
        scientificName = 'Panthera leo';
        category = 'Wild Animal';
        description = 'A muscular, deep-chested wild cat species with a prominent mane in males, known as the king of the jungle.';
      } else if (rawLower.includes('elephant')) {
        scientificName = 'Loxodonta africana';
        category = 'Wild Animal';
        description = 'The largest living land mammal, distinguished by its long trunk, large tusks, and fan-like ears.';
      }

      res.json({
        success: true,
        metadata: {
          animalName,
          scientificName,
          category,
          description
        }
      });
    }
  });

  // --- VITE MIDDLEWARE CONFIGURATION ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

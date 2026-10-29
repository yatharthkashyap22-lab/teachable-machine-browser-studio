/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as tf from '@tensorflow/tfjs';
import { Sample, Label, TrainingConfig, TrainingHistoryItem, EvaluationResult } from '../types';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';
import * as posenet from '@tensorflow-models/posenet';
import * as speechCommands from '@tensorflow-models/speech-commands';
import * as use from '@tensorflow-models/universal-sentence-encoder';

// Helper to convert base64 to HTMLImageElement
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image element: ' + err));
  });
}

// Helper to resize base64 image on canvas and extract pixel tensor
export async function imageToTensor(src: string, size: number = 64): Promise<tf.Tensor3D> {
  const img = await loadImageElement(src);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw and crop to square centered
  const minDim = Math.min(img.width, img.height);
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

  return tf.tidy(() => {
    const pixels = tf.browser.fromPixels(canvas);
    return pixels.toFloat().div(255.0) as tf.Tensor3D; // Normalized [0, 1]
  });
}

// Cosine Similarity helper for embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// Text Tokenization helper (Bag-of-Words)
export function buildVocabulary(texts: string[]): string[] {
  const wordCounts: { [key: string]: number } = {};
  const stopWords = new Set(['', 'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'at']);

  texts.forEach(text => {
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/);
    tokens.forEach(token => {
      if (!stopWords.has(token)) {
        wordCounts[token] = (wordCounts[token] || 0) + 1;
      }
    });
  });

  // Return unique words sorted by frequency
  return Object.keys(wordCounts)
    .sort((a, b) => wordCounts[b] - wordCounts[a])
    .slice(0, 500); // Limit to top 500 words for efficiency
}

export function textToVector(text: string, vocab: string[]): number[] {
  const vector = new Array(vocab.length).fill(0);
  const tokens = new Set(text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/));
  
  vocab.forEach((word, index) => {
    if (tokens.has(word)) {
      vector[index] = 1; // Binary Bag of Words
    }
  });

  return vector;
}

export interface TrainingCallbacks {
  onEpochEnd: (epoch: number, history: TrainingHistoryItem) => void;
  onProgress: (progress: number, etaSeconds: number) => void;
  onMessage: (message: string) => void;
}

export class MLTrainingSession {
  private activeModel: tf.LayersModel | null = null;
  private isPaused: boolean = false;
  private shouldStop: boolean = false;
  private vocab: string[] = [];

  // Pre-trained model caches
  private mobilenetModel: mobilenet.MobileNet | null = null;
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private blazefaceModel: any = null;
  private posenetModel: posenet.PoseNet | null = null;
  private speechRecognizer: any = null;
  private useModel: use.UniversalSentenceEncoder | null = null;

  public getVocabulary(): string[] {
    return this.vocab;
  }

  public hasActiveModel(): boolean {
    return this.activeModel !== null;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public stop() {
    this.shouldStop = true;
  }

  public clear() {
    if (this.activeModel) {
      try {
        this.activeModel.dispose();
      } catch (e) {
        console.warn('Error disposing old model:', e);
      }
    }
    this.activeModel = null;
    this.isPaused = false;
    this.shouldStop = false;
    this.vocab = [];
  }

  // --- PRE-TRAINED MODELS INFERENCE ENGINES ---

  // 1. MobileNet v2 (Image Classification)
  public async loadMobileNet(): Promise<void> {
    if (!this.mobilenetModel) {
      this.mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    }
  }

  public async predictMobileNet(imgSrc: string): Promise<{
    predictions: Array<{ className: string; probability: number }>;
    inferenceTime: number;
  }> {
    await this.loadMobileNet();
    const img = await loadImageElement(imgSrc);
    const start = performance.now();
    const preds = await this.mobilenetModel!.classify(img);
    const time = performance.now() - start;
    return {
      predictions: preds,
      inferenceTime: parseFloat(time.toFixed(1))
    };
  }

  // 2. COCO-SSD (Object Detection with Bounding Boxes)
  public async loadCocoSsd(): Promise<void> {
    if (!this.cocoSsdModel) {
      this.cocoSsdModel = await cocoSsd.load();
    }
  }

  public async predictCocoSsd(imgSrc: string): Promise<{
    predictions: Array<{ bbox: [number, number, number, number]; class: string; score: number }>;
    inferenceTime: number;
  }> {
    await this.loadCocoSsd();
    const img = await loadImageElement(imgSrc);
    const start = performance.now();
    const results = await this.cocoSsdModel!.detect(img);
    const time = performance.now() - start;
    return {
      predictions: results,
      inferenceTime: parseFloat(time.toFixed(1))
    };
  }

  // 3. BlazeFace (Face Detection & Landmarks)
  public async loadBlazeFace(): Promise<void> {
    if (!this.blazefaceModel) {
      this.blazefaceModel = await blazeface.load();
    }
  }

  public async predictBlazeFace(imgSrc: string): Promise<{
    predictions: Array<{
      topLeft: [number, number] | tf.Tensor1D;
      bottomRight: [number, number] | tf.Tensor1D;
      probability: [number] | tf.Tensor1D;
      landmarks: Array<[number, number]> | tf.Tensor2D;
    }>;
    inferenceTime: number;
  }> {
    await this.loadBlazeFace();
    const img = await loadImageElement(imgSrc);
    const start = performance.now();
    const predictions = await this.blazefaceModel!.estimateFaces(img, false);
    const time = performance.now() - start;
    return {
      predictions,
      inferenceTime: parseFloat(time.toFixed(1))
    };
  }

  // 4. PoseNet (Pose Estimation)
  public async loadPoseNet(): Promise<void> {
    if (!this.posenetModel) {
      this.posenetModel = await posenet.load();
    }
  }

  public async predictPoseNet(imgSrc: string): Promise<{
    pose: any;
    inferenceTime: number;
  }> {
    await this.loadPoseNet();
    const img = await loadImageElement(imgSrc);
    const start = performance.now();
    const pose = await this.posenetModel!.estimateSinglePose(img, {
      flipHorizontal: false
    });
    const time = performance.now() - start;
    return {
      pose,
      inferenceTime: parseFloat(time.toFixed(1))
    };
  }

  // 5. Speech Commands (Audio Microphone Inference)
  public async startAudioInference(onResult: (label: string, score: number, scores: { [key: string]: number }) => void): Promise<void> {
    if (!this.speechRecognizer) {
      this.speechRecognizer = speechCommands.create('BROWSER_FFT');
      await this.speechRecognizer.ensureModelLoaded();
    }
    
    await this.speechRecognizer.listen((result: any) => {
      const labels = this.speechRecognizer.wordLabels();
      const scores = result.scores;
      let maxScore = -1;
      let maxIdx = -1;
      const scoreMap: { [key: string]: number } = {};
      for (let i = 0; i < labels.length; i++) {
        const score = parseFloat(scores[i]);
        scoreMap[labels[i]] = score;
        if (score > maxScore) {
          maxScore = score;
          maxIdx = i;
        }
      }
      onResult(labels[maxIdx], maxScore, scoreMap);
    }, {
      includeSpectrogram: false,
      probabilityThreshold: 0.60,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.50
    });
  }

  public stopAudioInference(): void {
    if (this.speechRecognizer && this.speechRecognizer.isListening()) {
      this.speechRecognizer.stopListening();
    }
  }

  // 6. Universal Sentence Encoder (USE Semantic Text Similarity)
  public async loadUSE(): Promise<void> {
    if (!this.useModel) {
      this.useModel = await use.load();
    }
  }

  public async predictUSE(text: string, labels: Label[]): Promise<{
    label: string;
    confidence: number;
    scores: { [key: string]: number };
    inferenceTime: number;
  }> {
    await this.loadUSE();
    const start = performance.now();
    
    const allTexts = [text, ...labels.map(l => l.name)];
    const embeddings = await this.useModel!.embed(allTexts);
    const data = await embeddings.array() as number[][];
    embeddings.dispose();

    const queryVector = data[0];
    const scores: { [key: string]: number } = {};
    let maxScore = -1;
    let bestLabel = labels[0]?.name || 'Unknown';

    labels.forEach((label, idx) => {
      const labelVector = data[idx + 1];
      if (queryVector && labelVector) {
        const similarity = cosineSimilarity(queryVector, labelVector);
        const normalizedScore = Math.max(0, Math.min(1, (similarity + 1) / 2));
        scores[label.name] = parseFloat(normalizedScore.toFixed(4));
        if (normalizedScore > maxScore) {
          maxScore = normalizedScore;
          bestLabel = label.name;
        }
      } else {
        scores[label.name] = 0;
      }
    });

    const time = performance.now() - start;
    return {
      label: bestLabel,
      confidence: parseFloat(maxScore.toFixed(4)),
      scores,
      inferenceTime: parseFloat(time.toFixed(1))
    };
  }

  public async train(
    samples: Sample[],
    labels: Label[],
    config: TrainingConfig,
    callbacks: TrainingCallbacks
  ): Promise<{ model: tf.LayersModel; history: TrainingHistoryItem[]; vocab: string[] }> {
    this.clear();

    if (samples.length < 2) {
      throw new Error('You need at least 2 samples to train a model');
    }

    const labelMap = new Map(labels.map((l, idx) => [l.id, idx]));
    const numClasses = labels.length;

    callbacks.onMessage('Preparing dataset...');

    let xs: tf.Tensor2D | tf.Tensor4D;
    let ys: tf.Tensor2D;

    const sampleType = samples[0].type;

    if (sampleType === 'text') {
      // Build vocab
      const rawTexts = samples.map(s => s.data);
      this.vocab = buildVocabulary(rawTexts);

      const vectors = samples.map(s => textToVector(s.data, this.vocab));
      const targets = samples.map(s => {
        const target = new Array(numClasses).fill(0);
        const idx = labelMap.get(s.labelId) ?? 0;
        target[idx] = 1;
        return target;
      });

      xs = tf.tensor2d(vectors);
      ys = tf.tensor2d(targets);
    } else {
      // Image Classification
      const imageTensors: tf.Tensor3D[] = [];
      const targets: number[][] = [];

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        try {
          const t = await imageToTensor(s.data, 64);
          imageTensors.push(t);
          const target = new Array(numClasses).fill(0);
          const idx = labelMap.get(s.labelId) ?? 0;
          target[idx] = 1;
          targets.push(target);

          if (i % 10 === 0) {
            callbacks.onMessage(`Processed ${i + 1}/${samples.length} images...`);
          }
        } catch (e) {
          console.error('Failed to parse image sample:', s.id, e);
        }
      }

      if (imageTensors.length === 0) {
        throw new Error('No valid images could be processed for training');
      }

      xs = tf.stack(imageTensors) as tf.Tensor4D;
      ys = tf.tensor2d(targets);
    }

    // Define model architecture dynamically
    const model = tf.sequential();
    const arch = config.architecture || 'standard';
    const dRate = config.dropoutRate !== undefined ? config.dropoutRate : (sampleType === 'text' ? 0.25 : 0.3);
    const dUnits = config.denseUnits !== undefined ? config.denseUnits : (sampleType === 'text' ? 32 : 64);

    if (sampleType === 'text') {
      if (arch === 'lightweight') {
        // Fast, high-performance lightweight model
        model.add(tf.layers.dense({
          units: dUnits,
          activation: 'relu',
          inputShape: [this.vocab.length]
        }));
        model.add(tf.layers.dropout({ rate: dRate }));
        model.add(tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        }));
      } else if (arch === 'deep') {
        // Multi-layered deep text neural network
        model.add(tf.layers.dense({
          units: dUnits,
          activation: 'relu',
          inputShape: [this.vocab.length]
        }));
        model.add(tf.layers.dropout({ rate: dRate }));
        model.add(tf.layers.dense({
          units: Math.max(16, Math.floor(dUnits / 2)),
          activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: Math.max(0.1, dRate - 0.1) }));
        model.add(tf.layers.dense({
          units: Math.max(8, Math.floor(dUnits / 4)),
          activation: 'relu'
        }));
        model.add(tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        }));
      } else {
        // Standard model
        model.add(tf.layers.dense({
          units: dUnits,
          activation: 'relu',
          inputShape: [this.vocab.length]
        }));
        model.add(tf.layers.dropout({ rate: dRate }));
        model.add(tf.layers.dense({
          units: Math.max(8, Math.floor(dUnits / 2)),
          activation: 'relu'
        }));
        model.add(tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        }));
      }
    } else {
      // CNN for images
      if (arch === 'lightweight') {
        // Simple ConvNet for edge devices
        model.add(tf.layers.conv2d({
          inputShape: [64, 64, 3],
          filters: 8,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 32x32
        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({ units: dUnits, activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: dRate }));
        model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
      } else if (arch === 'deep') {
        // Deep spatial hierarchical ConvNet
        model.add(tf.layers.conv2d({
          inputShape: [64, 64, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.conv2d({
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 32x32

        model.add(tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 16x16

        model.add(tf.layers.conv2d({
          filters: 128,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 8x8

        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({ units: dUnits, activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: dRate }));
        model.add(tf.layers.dense({ units: Math.max(16, Math.floor(dUnits / 2)), activation: 'relu' }));
        model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
      } else {
        // Standard CNN
        model.add(tf.layers.conv2d({
          inputShape: [64, 64, 3],
          filters: 16,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 32x32
        
        model.add(tf.layers.conv2d({
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 16x16

        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({ units: dUnits, activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: dRate }));
        model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
      }
    }

    // Select dynamic optimizer based on settings
    let optimizer;
    const optType = config.optimizer || 'adam';
    if (optType === 'sgd') {
      optimizer = tf.train.sgd(config.learningRate);
    } else if (optType === 'rmsprop') {
      optimizer = tf.train.rmsprop(config.learningRate);
    } else {
      optimizer = tf.train.adam(config.learningRate);
    }

    model.compile({
      optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.activeModel = model;
    callbacks.onMessage(`Starting training [Arch: ${arch.toUpperCase()}, Optimizer: ${optType.toUpperCase()}]...`);

    const historyItems: TrainingHistoryItem[] = [];
    const startTime = Date.now();

    // Track early stopping state
    let bestLoss = Infinity;
    let patienceCounter = 0;
    const patience = config.earlyStoppingPatience || 8;

    // Custom loop controller with pause & stop functionality
    await model.fit(xs, ys, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: config.validationSplit,
      shuffle: config.shuffle,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (this.shouldStop) {
            model.stopTraining = true;
            callbacks.onMessage('Training stopped by user.');
            return;
          }

          // Handle Pause/Resume using busy-loop async delay
          while (this.isPaused) {
            if (this.shouldStop) {
              model.stopTraining = true;
              callbacks.onMessage('Training stopped by user.');
              return;
            }
            callbacks.onMessage('Training paused...');
            await new Promise(r => setTimeout(r, 200));
          }

          const epochVal = epoch + 1;
          const telemetry: TrainingHistoryItem = {
            epoch: epochVal,
            loss: logs?.loss || 0,
            valLoss: logs?.val_loss || 0,
            acc: logs?.acc || 0,
            valAcc: logs?.val_acc || 0,
          };
          historyItems.push(telemetry);

          callbacks.onEpochEnd(epochVal, telemetry);

          // Handle Custom Early Stopping
          if (config.earlyStopping) {
            const monitorVal = (config.validationSplit && config.validationSplit > 0) ? (logs?.val_loss ?? logs?.loss) : logs?.loss;
            if (monitorVal !== undefined && monitorVal !== null) {
              if (monitorVal < bestLoss) {
                bestLoss = monitorVal;
                patienceCounter = 0;
              } else {
                patienceCounter++;
                if (patienceCounter >= patience) {
                  model.stopTraining = true;
                  callbacks.onMessage(`Early stopping triggered! Training halted as loss didn't improve for ${patience} epochs.`);
                }
              }
            }
          }

          // Calculate ETA
          const elapsedTime = Date.now() - startTime;
          const avgEpochTime = elapsedTime / epochVal;
          const remainingEpochs = config.epochs - epochVal;
          const etaSeconds = Math.round((remainingEpochs * avgEpochTime) / 1000);
          const progress = parseFloat(((epochVal / config.epochs) * 100).toFixed(1));

          callbacks.onProgress(progress, etaSeconds);
        }
      }
    });

    // Cleanup tensors
    xs.dispose();
    ys.dispose();

    if (this.shouldStop) {
      throw new Error('Training session was cancelled');
    }

    callbacks.onMessage('Training complete!');
    return { model, history: historyItems, vocab: this.vocab };
  }

  // Predict on arbitrary input
  public async predict(
    inputData: string, // Base64 for Image, plain text for Text
    type: 'image' | 'text',
    labels: Label[]
  ): Promise<{ label: string; confidence: number; scores: { [key: string]: number } }> {
    if (!this.activeModel) {
      throw new Error('No trained model is currently active');
    }

    return tf.tidy(() => {
      let inputTensor: tf.Tensor;
      if (type === 'text') {
        const vector = textToVector(inputData, this.vocab);
        inputTensor = tf.tensor2d([vector]);
      } else {
        // We need synchronous or rapid load. Since this is in tf.tidy, we pre-process
        // imageToTensor outside of tf.tidy and pass it in, but to keep the signature clean:
        throw new Error('Image prediction must be processed via predictImageTensor helper');
      }

      const prediction = this.activeModel!.predict(inputTensor) as tf.Tensor;
      const data = prediction.dataSync();

      const scores: { [key: string]: number } = {};
      let maxScore = -1;
      let predictedLabelIdx = 0;

      labels.forEach((label, idx) => {
        const score = data[idx] || 0;
        scores[label.name] = parseFloat(score.toFixed(4));
        if (score > maxScore) {
          maxScore = score;
          predictedLabelIdx = idx;
        }
      });

      return {
        label: labels[predictedLabelIdx]?.name || 'Unknown',
        confidence: parseFloat(maxScore.toFixed(4)),
        scores
      };
    });
  }

  // Predict on Image Tensor (since async loading is needed for image elements)
  public async predictImage(
    src: string,
    labels: Label[]
  ): Promise<{ label: string; confidence: number; scores: { [key: string]: number } }> {
    if (!this.activeModel) throw new Error('No trained model is active');

    const t = await imageToTensor(src, 64);
    const inputTensor = t.expandDims(0); // 1, 64, 64, 3

    const prediction = this.activeModel.predict(inputTensor) as tf.Tensor;
    const data = prediction.dataSync();

    // Clean up
    t.dispose();
    inputTensor.dispose();

    const scores: { [key: string]: number } = {};
    let maxScore = -1;
    let predictedLabelIdx = 0;

    labels.forEach((label, idx) => {
      const score = data[idx] || 0;
      scores[label.name] = parseFloat(score.toFixed(4));
      if (score > maxScore) {
        maxScore = score;
        predictedLabelIdx = idx;
      }
    });

    return {
      label: labels[predictedLabelIdx]?.name || 'Unknown',
      confidence: parseFloat(maxScore.toFixed(4)),
      scores
    };
  }

  // Calculate high-fidelity Metrics
  public async evaluate(
    samples: Sample[],
    labels: Label[]
  ): Promise<EvaluationResult> {
    if (!this.activeModel) throw new Error('No model is loaded for evaluation');

    const labelsList = labels.map(l => l.name);
    const numClasses = labels.length;
    
    // Confusion matrix init [true][pred]
    const matrix: number[][] = Array.from({ length: numClasses }, () => new Array(numClasses).fill(0));
    const labelMap = new Map(labels.map((l, idx) => [l.id, idx]));

    let correct = 0;
    let total = 0;

    for (const sample of samples) {
      try {
        const trueIdx = labelMap.get(sample.labelId);
        if (trueIdx === undefined) continue;

        let predIdx = 0;
        if (sample.type === 'text') {
          tf.tidy(() => {
            const vec = textToVector(sample.data, this.vocab);
            const inputTensor = tf.tensor2d([vec]);
            const pred = this.activeModel!.predict(inputTensor) as tf.Tensor;
            predIdx = pred.argMax(1).dataSync()[0];
          });
        } else {
          const t = await imageToTensor(sample.data, 64);
          const inputTensor = t.expandDims(0);
          const pred = this.activeModel!.predict(inputTensor) as tf.Tensor;
          predIdx = pred.argMax(1).dataSync()[0];
          t.dispose();
          inputTensor.dispose();
        }

        matrix[trueIdx][predIdx] += 1;
        if (trueIdx === predIdx) correct++;
        total++;
      } catch (e) {
        console.error('Error during sample evaluation:', e);
      }
    }

    const accuracy = total > 0 ? parseFloat((correct / total).toFixed(4)) : 0;

    // Calculate Precision, Recall, F1 (Macro-averaged)
    let sumPrecision = 0;
    let sumRecall = 0;

    for (let c = 0; c < numClasses; c++) {
      // True Positives
      const tp = matrix[c][c];
      
      // False Positives (Sum of column c excluding tp)
      let fp = 0;
      for (let r = 0; r < numClasses; r++) {
        if (r !== c) fp += matrix[r][c];
      }

      // False Negatives (Sum of row c excluding tp)
      let fn = 0;
      for (let col = 0; col < numClasses; col++) {
        if (col !== c) fn += matrix[c][col];
      }

      const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
      const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;

      sumPrecision += precision;
      sumRecall += recall;
    }

    const precision = parseFloat((sumPrecision / numClasses).toFixed(4));
    const recall = parseFloat((sumRecall / numClasses).toFixed(4));
    const f1 = (precision + recall) > 0 ? parseFloat(((2 * precision * recall) / (precision + recall)).toFixed(4)) : 0;

    return {
      accuracy,
      precision,
      recall,
      f1,
      confusionMatrix: matrix,
      labelsList
    };
  }

  // Serialize to JSON formats
  public async exportModel(): Promise<{ topology: string; weightsBase64: string }> {
    if (!this.activeModel) throw new Error('No active model to export');

    let artifactsResult: any = null;
    await this.activeModel.save(tf.io.withSaveHandler(async (artifacts) => {
      artifactsResult = artifacts;
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON'
        }
      };
    }));

    if (!artifactsResult) throw new Error('Serialization failed');

    const topology = JSON.stringify({
      modelTopology: artifactsResult.modelTopology,
      weightSpecs: artifactsResult.weightSpecs,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js Browser Studio',
      convertedBy: null
    });

    let weightsBase64 = '';
    if (artifactsResult.weightData) {
      const buffer = new Uint8Array(artifactsResult.weightData);
      let binary = '';
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      weightsBase64 = btoa(binary);
    }

    return { topology, weightsBase64 };
  }

  // Load from dynamic weights
  public async loadModel(topologyJson: string, weightsBase64: string, vocabulary?: string[]): Promise<void> {
    this.clear();
    const topo = JSON.parse(topologyJson);
    this.vocab = vocabulary || [];
    
    const binaryString = atob(weightsBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const weightsBuffer = bytes.buffer;

    this.activeModel = await tf.loadLayersModel(tf.io.fromMemory({
      modelTopology: topo.modelTopology,
      weightSpecs: topo.weightSpecs,
      weightData: weightsBuffer
    }));
  }
}

export const mlSession = new MLTrainingSession();

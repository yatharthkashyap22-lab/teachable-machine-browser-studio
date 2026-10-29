/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModelType = 'IMAGE' | 'TEXT' | 'AUDIO' | 'OBJECT' | 'POSE';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string; // Tailwind bg-class or hex code
}

export interface Sample {
  id: string;
  projectId: string;
  labelId: string;
  name: string;
  type: 'image' | 'text' | 'audio';
  data: string; // Base64 data URI for image/audio, or plain text
  size: number; // In bytes
  createdAt: string;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  shuffle: boolean;
  optimizer?: 'adam' | 'sgd' | 'rmsprop';
  architecture?: 'standard' | 'deep' | 'lightweight';
  earlyStopping?: boolean;
  earlyStoppingPatience?: number;
  dropoutRate?: number;
  denseUnits?: number;
}

export interface TrainingHistoryItem {
  epoch: number;
  loss: number;
  valLoss: number;
  acc: number;
  valAcc: number;
}

export interface EvaluationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: number[][]; // Row = True, Col = Pred
  labelsList: string[];
}

export interface SavedModel {
  id: string;
  projectId: string;
  name: string;
  accuracy: number;
  trainedAt: string;
  modelType: ModelType;
  labels: string[];
  modelTopology?: string; // JSON string of tfjs topology
  weightData?: string; // Base64 representation of weights
  vocabulary?: string[]; // Tokenizer vocab for text models
}

export interface User {
  id: string;
  username: string;
  email: string;
  photoUrl: string;
  isGuest: boolean;
  subscription: 'Free' | 'Pro' | 'Enterprise';
  joinedAt: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

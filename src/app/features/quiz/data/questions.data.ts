import { Question } from '../models/question.model';

export const QUESTIONS: readonly Question[] = [
  {
    id: 'q1',
    text: 'What does the abbreviation LLM stand for?',
    options: [
      'Large Language Model',
      'Linear Learning Matrix',
      'Local Logic Module',
      'Layered Latent Map',
    ],
    correctIndex: 0,
  },
  {
    id: 'q2',
    text: 'Which type of learning trains a model with labeled input-output examples?',
    options: [
      'Unsupervised learning',
      'Reinforcement learning',
      'Supervised learning',
      'Clustering',
    ],
    correctIndex: 2,
  },
  {
    id: 'q3',
    text: 'In neural network training, what is an epoch?',
    options: [
      'A single stored weight',
      'One full pass through the training dataset',
      'The final output layer',
      'A hardware accelerator',
    ],
    correctIndex: 1,
  },
  {
    id: 'q4',
    text: 'What does RAG stand for in modern language-model systems?',
    options: [
      'Random Answer Generation',
      'Retrieval-Augmented Generation',
      'Recurrent Activation Gate',
      'Ranked Algorithm Graph',
    ],
    correctIndex: 1,
  },
  {
    id: 'q5',
    text: 'What is overfitting?',
    options: [
      'Stopping training before the loss changes',
      'A model that memorizes training data and generalizes poorly',
      'Training only on unlabeled data',
      'A method that always raises test accuracy',
    ],
    correctIndex: 1,
  },
  {
    id: 'q6',
    text: 'Which transformer mechanism weighs how relevant other tokens are to the current token?',
    options: ['Convolution', 'Pooling', 'Attention', 'Batch normalization'],
    correctIndex: 2,
  },
  {
    id: 'q7',
    text: 'What is a token in the context of a language model?',
    options: [
      'A unit of text the model reads or generates',
      'The loss value after one update',
      'A labeled image bounding box',
      'The learning-rate schedule',
    ],
    correctIndex: 0,
  },
  {
    id: 'q8',
    text: 'Raising an LLM sampling temperature typically makes the output:',
    options: [
      'More deterministic',
      'More varied and less predictable',
      'Shorter by a fixed ratio',
      'Independent of the prompt',
    ],
    correctIndex: 1,
  },
  {
    id: 'q9',
    text: 'What is a hallucination in a language model?',
    options: [
      'A GPU memory error',
      'Fluent output that is not factually grounded',
      'A completed fine-tuning run',
      'Encryption of the user prompt',
    ],
    correctIndex: 1,
  },
  {
    id: 'q10',
    text: 'What does fine-tuning do to a pretrained model?',
    options: [
      'Deletes the original weights',
      'Further trains it for a narrower dataset or task',
      'Replaces the tokenizer with images only',
      'Guarantees zero loss on every prompt',
    ],
    correctIndex: 1,
  },
];

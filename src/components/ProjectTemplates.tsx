import React from 'react';
import { 
  Sparkles, Camera, BookOpen, Trash, Check, HelpCircle, 
  Leaf, Trash2, Car, Apple, Accessibility, Smile, ShieldAlert, 
  Hand, Scissors, Layers, Eye, Speech, MessageSquare 
} from 'lucide-react';
import { ModelType } from '../types';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  icon: React.ReactNode;
  classes: string[];
  sampleData: {
    labelName: string;
    samples: { name: string; data: string }[];
  }[];
}

// Helper to generate simple colorful placeholder SVGs for image templates
const makeSvgImage = (color: string, shape: 'circle' | 'rect' | 'polygon') => {
  let shapeMarkup = '';
  if (shape === 'circle') {
    shapeMarkup = `<circle cx="60" cy="60" r="40" fill="${color}" />`;
  } else if (shape === 'rect') {
    shapeMarkup = `<rect x="25" y="25" width="70" height="70" rx="15" fill="${color}" />`;
  } else {
    shapeMarkup = `<polygon points="60,20 100,90 20,90" fill="${color}" />`;
  }
  const rawSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#f1f5f9" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" rx="10" />
      ${shapeMarkup}
      <circle cx="60" cy="60" r="2" fill="#000" opacity="0.1" />
    </svg>
  `.trim();
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg);
};

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'animal_classifier',
    name: 'Animal Classifier',
    description: 'Classify visual samples into Dog, Cat, and Panda classifications.',
    type: 'IMAGE',
    icon: <Smile className="w-5 h-5 text-emerald-500" />,
    classes: ['Dog Class', 'Cat Class', 'Panda Class'],
    sampleData: [
      {
        labelName: 'Dog Class',
        samples: [
          { name: 'dog_retriever.svg', data: makeSvgImage('#f59e0b', 'circle') },
          { name: 'dog_bulldog.svg', data: makeSvgImage('#d97706', 'circle') },
          { name: 'dog_poodle.svg', data: makeSvgImage('#b45309', 'circle') },
        ]
      },
      {
        labelName: 'Cat Class',
        samples: [
          { name: 'cat_siamese.svg', data: makeSvgImage('#ec4899', 'rect') },
          { name: 'cat_persian.svg', data: makeSvgImage('#db2777', 'rect') },
          { name: 'cat_tabby.svg', data: makeSvgImage('#be185d', 'rect') },
        ]
      },
      {
        labelName: 'Panda Class',
        samples: [
          { name: 'panda_giant.svg', data: makeSvgImage('#1e293b', 'polygon') },
          { name: 'panda_red.svg', data: makeSvgImage('#475569', 'polygon') },
          { name: 'panda_baby.svg', data: makeSvgImage('#64748b', 'polygon') },
        ]
      }
    ]
  },
  {
    id: 'plant_disease',
    name: 'Plant Disease Detector',
    description: 'Diagnose plant leaves as healthy, rusted, or mildewed.',
    type: 'IMAGE',
    icon: <Leaf className="w-5 h-5 text-green-500" />,
    classes: ['Healthy Foliage', 'Rust Spots', 'Powdery Mildew'],
    sampleData: [
      {
        labelName: 'Healthy Foliage',
        samples: [
          { name: 'leaf_healthy_1.svg', data: makeSvgImage('#10b981', 'polygon') },
          { name: 'leaf_healthy_2.svg', data: makeSvgImage('#059669', 'polygon') },
          { name: 'leaf_healthy_3.svg', data: makeSvgImage('#047857', 'polygon') },
        ]
      },
      {
        labelName: 'Rust Spots',
        samples: [
          { name: 'leaf_rust_1.svg', data: makeSvgImage('#b45309', 'rect') },
          { name: 'leaf_rust_2.svg', data: makeSvgImage('#78350f', 'rect') },
          { name: 'leaf_rust_3.svg', data: makeSvgImage('#92400e', 'rect') },
        ]
      },
      {
        labelName: 'Powdery Mildew',
        samples: [
          { name: 'leaf_mildew_1.svg', data: makeSvgImage('#cbd5e1', 'circle') },
          { name: 'leaf_mildew_2.svg', data: makeSvgImage('#e2e8f0', 'circle') },
          { name: 'leaf_mildew_3.svg', data: makeSvgImage('#f8fafc', 'circle') },
        ]
      }
    ]
  },
  {
    id: 'waste_classifier',
    name: 'Waste Classifier',
    description: 'Separate household waste into recyclable paper, organics, or plastic.',
    type: 'IMAGE',
    icon: <Trash2 className="w-5 h-5 text-blue-500" />,
    classes: ['Recyclable Paper', 'Organic Food Waste', 'Hazardous Plastic'],
    sampleData: [
      {
        labelName: 'Recyclable Paper',
        samples: [
          { name: 'paper_box.svg', data: makeSvgImage('#3b82f6', 'rect') },
          { name: 'paper_newspaper.svg', data: makeSvgImage('#2563eb', 'rect') },
          { name: 'paper_cup.svg', data: makeSvgImage('#1d4ed8', 'rect') },
        ]
      },
      {
        labelName: 'Organic Food Waste',
        samples: [
          { name: 'food_apple_core.svg', data: makeSvgImage('#10b981', 'circle') },
          { name: 'food_banana_peel.svg', data: makeSvgImage('#84cc16', 'circle') },
          { name: 'food_vegetables.svg', data: makeSvgImage('#a3e635', 'circle') },
        ]
      },
      {
        labelName: 'Hazardous Plastic',
        samples: [
          { name: 'plastic_bottle.svg', data: makeSvgImage('#ef4444', 'polygon') },
          { name: 'plastic_bag.svg', data: makeSvgImage('#dc2626', 'polygon') },
          { name: 'plastic_container.svg', data: makeSvgImage('#b91c1c', 'polygon') },
        ]
      }
    ]
  },
  {
    id: 'vehicle_detector',
    name: 'Vehicle Detector',
    description: 'Classify camera frames containing sedans, SUVs, or motorcycles.',
    type: 'IMAGE',
    icon: <Car className="w-5 h-5 text-indigo-500" />,
    classes: ['Sedan Car', 'SUV Trunk', 'Motorcycle Class'],
    sampleData: [
      {
        labelName: 'Sedan Car',
        samples: [
          { name: 'car_sedan_1.svg', data: makeSvgImage('#6366f1', 'rect') },
          { name: 'car_sedan_2.svg', data: makeSvgImage('#4f46e5', 'rect') },
        ]
      },
      {
        labelName: 'SUV Trunk',
        samples: [
          { name: 'car_suv_1.svg', data: makeSvgImage('#ec4899', 'circle') },
          { name: 'car_suv_2.svg', data: makeSvgImage('#d946ef', 'circle') },
        ]
      },
      {
        labelName: 'Motorcycle Class',
        samples: [
          { name: 'bike_motor_1.svg', data: makeSvgImage('#f59e0b', 'polygon') },
          { name: 'bike_motor_2.svg', data: makeSvgImage('#eab308', 'polygon') },
        ]
      }
    ]
  },
  {
    id: 'fruit_classifier',
    name: 'Fruit Classifier',
    description: 'Identify fruit varieties like apple, banana, or orange.',
    type: 'IMAGE',
    icon: <Apple className="w-5 h-5 text-rose-500" />,
    classes: ['Fresh Apple', 'Ripe Banana', 'Sunkist Orange'],
    sampleData: [
      {
        labelName: 'Fresh Apple',
        samples: [
          { name: 'apple_red.svg', data: makeSvgImage('#ef4444', 'circle') },
          { name: 'apple_fuji.svg', data: makeSvgImage('#f43f5e', 'circle') },
        ]
      },
      {
        labelName: 'Ripe Banana',
        samples: [
          { name: 'banana_yellow.svg', data: makeSvgImage('#eab308', 'rect') },
          { name: 'banana_greenish.svg', data: makeSvgImage('#ca8a04', 'rect') },
        ]
      },
      {
        labelName: 'Sunkist Orange',
        samples: [
          { name: 'orange_fresh.svg', data: makeSvgImage('#f97316', 'circle') },
          { name: 'orange_tangerine.svg', data: makeSvgImage('#ea580c', 'circle') },
        ]
      }
    ]
  },
  {
    id: 'sign_language',
    name: 'Sign Language Recognition',
    description: 'Classify visual signs representing alphabetic characters A, B, or C.',
    type: 'IMAGE',
    icon: <Accessibility className="w-5 h-5 text-purple-500" />,
    classes: ['Sign Letter A', 'Sign Letter B', 'Sign Letter C'],
    sampleData: [
      {
        labelName: 'Sign Letter A',
        samples: [
          { name: 'sign_a_1.svg', data: makeSvgImage('#8b5cf6', 'polygon') },
          { name: 'sign_a_2.svg', data: makeSvgImage('#7c3aed', 'polygon') },
        ]
      },
      {
        labelName: 'Sign Letter B',
        samples: [
          { name: 'sign_b_1.svg', data: makeSvgImage('#ec4899', 'rect') },
          { name: 'sign_b_2.svg', data: makeSvgImage('#db2777', 'rect') },
        ]
      },
      {
        labelName: 'Sign Letter C',
        samples: [
          { name: 'sign_c_1.svg', data: makeSvgImage('#3b82f6', 'circle') },
          { name: 'sign_c_2.svg', data: makeSvgImage('#2563eb', 'circle') },
        ]
      }
    ]
  },
  {
    id: 'emotion_detection',
    name: 'Emotion Detection',
    description: 'Categorize facial expressions into Happy, Sad, or Surprised.',
    type: 'IMAGE',
    icon: <Smile className="w-5 h-5 text-pink-500" />,
    classes: ['Happy Face', 'Sad Face', 'Surprised Face'],
    sampleData: [
      {
        labelName: 'Happy Face',
        samples: [
          { name: 'emotion_happy_1.svg', data: makeSvgImage('#eab308', 'circle') },
          { name: 'emotion_happy_2.svg', data: makeSvgImage('#facc15', 'circle') },
        ]
      },
      {
        labelName: 'Sad Face',
        samples: [
          { name: 'emotion_sad_1.svg', data: makeSvgImage('#3b82f6', 'polygon') },
          { name: 'emotion_sad_2.svg', data: makeSvgImage('#60a5fa', 'polygon') },
        ]
      },
      {
        labelName: 'Surprised Face',
        samples: [
          { name: 'emotion_surprised_1.svg', data: makeSvgImage('#a855f7', 'rect') },
          { name: 'emotion_surprised_2.svg', data: makeSvgImage('#c084fc', 'rect') },
        ]
      }
    ]
  },
  {
    id: 'mask_detection',
    name: 'Mask Detection',
    description: 'Determine if a face visual contains an active respirator or is unmasked.',
    type: 'IMAGE',
    icon: <ShieldAlert className="w-5 h-5 text-teal-500" />,
    classes: ['Respirator Masked', 'Unmasked Exposure'],
    sampleData: [
      {
        labelName: 'Respirator Masked',
        samples: [
          { name: 'mask_n95.svg', data: makeSvgImage('#0d9488', 'circle') },
          { name: 'mask_surgical.svg', data: makeSvgImage('#14b8a6', 'circle') },
        ]
      },
      {
        labelName: 'Unmasked Exposure',
        samples: [
          { name: 'unmasked_face.svg', data: makeSvgImage('#f43f5e', 'rect') },
          { name: 'unmasked_skin.svg', data: makeSvgImage('#e11d48', 'rect') },
        ]
      }
    ]
  },
  {
    id: 'rock_paper_scissors',
    name: 'Rock Paper Scissors',
    description: 'Build hand gesture triggers for Rock, Paper, or Scissors.',
    type: 'IMAGE',
    icon: <Hand className="w-5 h-5 text-amber-500" />,
    classes: ['Rock Hand Gesture', 'Paper Hand Gesture', 'Scissors Hand Gesture'],
    sampleData: [
      {
        labelName: 'Rock Hand Gesture',
        samples: [
          { name: 'gesture_rock_1.svg', data: makeSvgImage('#4b5563', 'circle') },
          { name: 'gesture_rock_2.svg', data: makeSvgImage('#374151', 'circle') },
        ]
      },
      {
        labelName: 'Paper Hand Gesture',
        samples: [
          { name: 'gesture_paper_1.svg', data: makeSvgImage('#d1d5db', 'rect') },
          { name: 'gesture_paper_2.svg', data: makeSvgImage('#9ca3af', 'rect') },
        ]
      },
      {
        labelName: 'Scissors Hand Gesture',
        samples: [
          { name: 'gesture_scissors_1.svg', data: makeSvgImage('#f59e0b', 'polygon') },
          { name: 'gesture_scissors_2.svg', data: makeSvgImage('#d97706', 'polygon') },
        ]
      }
    ]
  },
  {
    id: 'chat_classification',
    name: 'Inbound Chat Classifier',
    description: 'Categorize customer messages as Support, Sales, or Spam immediately.',
    type: 'TEXT',
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    classes: ['Support Query', 'Sales Inquiry', 'Spam Report'],
    sampleData: [
      {
        labelName: 'Support Query',
        samples: [
          { name: 'support_1.txt', data: 'I cannot log in to my dashboard. The portal returns error code 500 when typing my password.' },
          { name: 'support_2.txt', data: 'My payment has been charged twice. Please issue a refund for the second transaction immediately.' },
          { name: 'support_3.txt', data: 'The web app is loading very slowly. I am seeing frequent websocket timeout exceptions.' },
        ]
      },
      {
        labelName: 'Sales Inquiry',
        samples: [
          { name: 'sales_1.txt', data: 'I would like to request an enterprise demo of your platform for a team of 150 developers.' },
          { name: 'sales_2.txt', data: 'Do you offer a high volume annual discount structure? Who is the account executive I can email?' },
          { name: 'sales_3.txt', data: 'What is the pricing model for hosting custom tf.js weights on your cloud platform nodes?' },
        ]
      },
      {
        labelName: 'Spam Report',
        samples: [
          { name: 'spam_1.txt', data: 'Congratulations! You won a brand new phone. Click this lottery link to claim your reward now!' },
          { name: 'spam_2.txt', data: 'EASY CASH WORK FROM HOME NOW! Earn $5000 a week using this quick automated software system.' },
          { name: 'spam_3.txt', data: 'Cheap pharmaceuticals and discount pills available with free global overnight container shipping.' },
        ]
      }
    ]
  },
  {
    id: 'object_counter',
    name: 'Object Counter',
    description: 'Determine item density levels to count industrial parts or inventory.',
    type: 'IMAGE',
    icon: <Layers className="w-5 h-5 text-indigo-500" />,
    classes: ['Empty Stage', 'Single Item Density', 'Multiple Stacked Density'],
    sampleData: [
      {
        labelName: 'Empty Stage',
        samples: [
          { name: 'stage_empty_1.svg', data: makeSvgImage('#f8fafc', 'circle') },
          { name: 'stage_empty_2.svg', data: makeSvgImage('#f1f5f9', 'circle') },
        ]
      },
      {
        labelName: 'Single Item Density',
        samples: [
          { name: 'density_single_1.svg', data: makeSvgImage('#60a5fa', 'circle') },
          { name: 'density_single_2.svg', data: makeSvgImage('#3b82f6', 'circle') },
        ]
      },
      {
        labelName: 'Multiple Stacked Density',
        samples: [
          { name: 'density_high_1.svg', data: makeSvgImage('#1e40af', 'rect') },
          { name: 'density_high_2.svg', data: makeSvgImage('#1d4ed8', 'rect') },
        ]
      }
    ]
  },
  {
    id: 'ocr_detector',
    name: 'OCR & Font Classifier',
    description: 'Differentiate font types or text capture qualities.',
    type: 'IMAGE',
    icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
    classes: ['Slab Serif Printed', 'Chancery Cursive Handwriting', 'Monospace Code Print'],
    sampleData: [
      {
        labelName: 'Slab Serif Printed',
        samples: [
          { name: 'serif_printed_1.svg', data: makeSvgImage('#1e293b', 'rect') },
          { name: 'serif_printed_2.svg', data: makeSvgImage('#0f172a', 'rect') },
        ]
      },
      {
        labelName: 'Chancery Cursive Handwriting',
        samples: [
          { name: 'cursive_hand_1.svg', data: makeSvgImage('#d97706', 'circle') },
          { name: 'cursive_hand_2.svg', data: makeSvgImage('#b45309', 'circle') },
        ]
      },
      {
        labelName: 'Monospace Code Print',
        samples: [
          { name: 'monospace_code_1.svg', data: makeSvgImage('#10b981', 'polygon') },
          { name: 'monospace_code_2.svg', data: makeSvgImage('#059669', 'polygon') },
        ]
      }
    ]
  },
  {
    id: 'pose_detection',
    name: 'Pose Action Identifier',
    description: 'Differentiate active physical poses like Standing, Sitting, or Crouching.',
    type: 'IMAGE',
    icon: <Accessibility className="w-5 h-5 text-rose-500" />,
    classes: ['Active Standing Pose', 'Active Sitting Pose', 'Active Crouching Pose'],
    sampleData: [
      {
        labelName: 'Active Standing Pose',
        samples: [
          { name: 'pose_stand_1.svg', data: makeSvgImage('#ef4444', 'polygon') },
          { name: 'pose_stand_2.svg', data: makeSvgImage('#dc2626', 'polygon') },
        ]
      },
      {
        labelName: 'Active Sitting Pose',
        samples: [
          { name: 'pose_sit_1.svg', data: makeSvgImage('#3b82f6', 'rect') },
          { name: 'pose_sit_2.svg', data: makeSvgImage('#2563eb', 'rect') },
        ]
      },
      {
        labelName: 'Active Crouching Pose',
        samples: [
          { name: 'pose_crouch_1.svg', data: makeSvgImage('#10b981', 'circle') },
          { name: 'pose_crouch_2.svg', data: makeSvgImage('#059669', 'circle') },
        ]
      }
    ]
  },
  {
    id: 'speech_recognition',
    name: 'Voice Command Classifier',
    description: 'Classify text transcripts of spoken voice command signals.',
    type: 'TEXT',
    icon: <Speech className="w-5 h-5 text-amber-500" />,
    classes: ['Command: EXECUTE', 'Command: HALT_STOP', 'Command: REBOOT'],
    sampleData: [
      {
        labelName: 'Command: EXECUTE',
        samples: [
          { name: 'voice_go_1.txt', data: 'Please proceed with compiling the convolutional layer weights right now.' },
          { name: 'voice_go_2.txt', data: 'Execute the model training pipeline immediately. Initiate weight initialization.' },
        ]
      },
      {
        labelName: 'Command: HALT_STOP',
        samples: [
          { name: 'voice_stop_1.txt', data: 'Halt all backpropagation updates and pause the model learning loop immediately.' },
          { name: 'voice_stop_2.txt', data: 'Emergency freeze on active calculations. Stop training right away.' },
        ]
      },
      {
        labelName: 'Command: REBOOT',
        samples: [
          { name: 'voice_reboot_1.txt', data: 'Perform a clean system soft reset on all active WebGL neural network caches.' },
          { name: 'voice_reboot_2.txt', data: 'Reboot development workspace node and empty local cache. Clear states.' },
        ]
      }
    ]
  }
];

interface ProjectTemplatesProps {
  onSelectTemplate: (template: TemplateDefinition) => void;
}

export const ProjectTemplates: React.FC<ProjectTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <div className="frosted-glass p-6 rounded-3xl shadow-lg space-y-6" id="project-templates-shelf">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            1-Click Industrial Templates
          </h3>
          <p className="text-xs text-slate-500 mt-1">Deploy pre-structured labels and high-fidelity training seeds with a single tap.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="templates-grid">
        {TEMPLATES.map((tpl) => (
          <div 
            key={tpl.id}
            onClick={() => onSelectTemplate(tpl)}
            className="p-5 bg-white/40 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850/80 rounded-2xl hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition-all flex flex-col justify-between h-44 group"
            id={`template-card-${tpl.id}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                  {tpl.icon}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${tpl.type === 'IMAGE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/50'}`}>
                  {tpl.type}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                {tpl.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-850/60 mt-3 text-[10px]">
              <span className="text-slate-400 font-medium font-mono">
                {tpl.classes.length} classes / {tpl.sampleData.reduce((acc, curr) => acc + curr.samples.length, 0)} seeds
              </span>
              <span className="text-blue-500 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                Start template &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

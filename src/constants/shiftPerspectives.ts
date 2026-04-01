import type { ImageSourcePropType } from 'react-native';

import { Images } from './images';

export type ShiftPerspectiveId =
  | 'agree'
  | 'disagree'
  | 'addContext'
  | 'satire'
  | 'question'
  | 'advice'
  | 'addEvidence'
  | 'challenge';

export interface ShiftPerspectiveItem {
  id: ShiftPerspectiveId;
  label: string;
  icon: ImageSourcePropType;
}

/** Order matches hi-fi “Select Perspective” grid */
export const SHIFT_PERSPECTIVES: ShiftPerspectiveItem[] = [
  { id: 'agree', label: 'Agree', icon: Images.shift.agree },
  { id: 'disagree', label: 'Disagree', icon: Images.shift.disagree },
  { id: 'addContext', label: 'Add Context', icon: Images.shift.addContext },
  { id: 'satire', label: 'Satire', icon: Images.shift.satire },
  { id: 'question', label: 'Question', icon: Images.shift.question },
  { id: 'advice', label: 'Advice', icon: Images.shift.advice },
  { id: 'addEvidence', label: 'Add Evidence', icon: Images.shift.addEvidence },
  { id: 'challenge', label: 'Challenge', icon: Images.shift.challenge },
];

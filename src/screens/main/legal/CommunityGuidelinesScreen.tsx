import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../navigation/types';
import { LegalTemplateScreen, type LegalSection } from './LegalTemplateScreen';

type Props = NativeStackScreenProps<MainStackParamList, 'CommunityGuidelines'>;

const SECTIONS: LegalSection[] = [
  {
    id: 'be-kind',
    title: '1) Be kind',
    body: 'Respect others. Disagree without attacking. No harassment, bullying, or hate.',
  },
  {
    id: 'safety',
    title: '2) Safety first',
    body: 'No threats, encouragement of self-harm, or instructions for wrongdoing. If you see imminent harm, contact local emergency services.',
  },
  {
    id: 'privacy',
    title: '3) Protect privacy',
    body: 'Don’t share private or sensitive information about yourself or others (addresses, phone numbers, passwords, private images).',
  },
  {
    id: 'authenticity',
    title: '4) Authenticity & spam',
    body: 'Don’t spam, scam, or impersonate. Avoid repetitive promotional content or engagement bait.',
  },
  {
    id: 'content',
    title: '5) Content boundaries',
    body: 'No illegal content. Avoid graphic violence or sexual content. If content is sensitive, keep it respectful and non-exploitative.',
  },
  {
    id: 'ai',
    title: '6) AI usage',
    body: 'AI drafts are allowed, but don’t use AI to harass, deceive, or amplify harmful content. You’re responsible for what you publish.',
  },
  {
    id: 'enforcement',
    title: '7) Enforcement',
    body: 'We may remove content or restrict accounts that violate these guidelines. Repeated violations may lead to permanent suspension.',
  },
];

export default function CommunityGuidelinesScreen(props: Props) {
  return (
    <LegalTemplateScreen
      {...props}
      title="Community Guidelines"
      subtitle="How we keep CxCix supportive, safe, and real."
      accent={['#F97316', '#EC4899']}
      sections={SECTIONS}
    />
  );
}


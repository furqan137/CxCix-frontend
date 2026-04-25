import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../navigation/types';
import { LegalTemplateScreen, type LegalSection } from './LegalTemplateScreen';

type Props = NativeStackScreenProps<MainStackParamList, 'TermsOfService'>;

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1) Acceptance of Terms',
    body: 'By accessing or using CxCix, you agree to these Terms. If you do not agree, do not use the app.',
  },
  {
    id: 'accounts',
    title: '2) Accounts & Eligibility',
    body: 'You must provide accurate information and keep your account secure. You are responsible for all activity under your account.',
  },
  {
    id: 'content',
    title: '3) Your Content',
    body: 'You own the content you create. You grant CxCix a limited license to host, store, and display it so we can operate the service.',
  },
  {
    id: 'community',
    title: '4) Community Rules',
    body: 'Do not post illegal content, harassment, hate, or threats. Follow the Community Guidelines. Repeated violations may lead to suspension.',
  },
  {
    id: 'ai',
    title: '5) AI Features',
    body: 'AI tools (Draft with AI, moderation labels) provide suggestions and may be inaccurate. You are responsible for what you publish.',
  },
  {
    id: 'termination',
    title: '6) Termination',
    body: 'We may suspend or terminate access if we reasonably believe you violated these Terms or created risk for others or the service.',
  },
  {
    id: 'disclaimer',
    title: '7) Disclaimers',
    body: 'CxCix is provided “as is” without warranties. We do not guarantee uninterrupted or error-free service.',
  },
  {
    id: 'contact',
    title: '8) Contact',
    body: 'Questions about Terms? Use Settings → Contact Support.',
  },
];

export default function TermsOfServiceScreen(props: Props) {
  return (
    <LegalTemplateScreen
      {...props}
      title="Terms of Service"
      subtitle="The rules that govern the use of CxCix."
      accent={['#6366F1', '#FDE047']}
      sections={SECTIONS}
    />
  );
}


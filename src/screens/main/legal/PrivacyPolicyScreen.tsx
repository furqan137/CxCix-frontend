import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../../../navigation/types';
import { LegalTemplateScreen, type LegalSection } from './LegalTemplateScreen';

type Props = NativeStackScreenProps<MainStackParamList, 'PrivacyPolicy'>;

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: '1) Overview',
    body: 'This policy explains what data we collect, how we use it, and the choices you have. We aim to collect the minimum necessary to run CxCix.',
  },
  {
    id: 'data',
    title: '2) Data We Collect',
    body: 'Account data (email, username, profile fields), content you post, and basic usage logs for security and reliability. Optional: location on a post only when you attach it.',
  },
  {
    id: 'use',
    title: '3) How We Use Data',
    body: 'To authenticate you, deliver the service, prevent abuse, and improve performance. AI features may process text you submit for drafting or moderation labels.',
  },
  {
    id: 'sharing',
    title: '4) Sharing',
    body: 'We do not sell personal data. We may share limited data with service providers (e.g., hosting, storage, analytics) strictly to operate CxCix.',
  },
  {
    id: 'security',
    title: '5) Security',
    body: 'We use industry-standard practices, but no system is 100% secure. Protect your account by using a strong password and keeping devices secure.',
  },
  {
    id: 'choices',
    title: '6) Your Choices',
    body: 'You can edit profile info, change privacy settings, and delete your account in Settings. You can also mute/block users to control your experience.',
  },
  {
    id: 'contact',
    title: '7) Contact',
    body: 'Privacy questions? Use Settings → Contact Support.',
  },
];

export default function PrivacyPolicyScreen(props: Props) {
  return (
    <LegalTemplateScreen
      {...props}
      title="Privacy Policy"
      subtitle="How CxCix collects, uses, and protects your data."
      accent={['#0EA5E9', '#22C55E']}
      sections={SECTIONS}
    />
  );
}


import AIModeratorScreen from '../onboarding/AIModeratorScreen';

// Type wrapper so it can mount in MainStack (props are compatible at runtime).
import type { ComponentType } from 'react';

export default AIModeratorScreen as unknown as ComponentType<any>;


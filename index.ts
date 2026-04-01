// Gesture handler must be first — required by React Navigation + Reanimated
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);

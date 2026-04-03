// Gesture handler must be first — required by React Navigation + Reanimated
import 'react-native-gesture-handler';
// Reanimated 4: worklets core, then Reanimated (TurboModule init order)
import 'react-native-worklets';
import 'react-native-reanimated';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);

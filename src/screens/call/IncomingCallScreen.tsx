import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { IncomingCallModal } from '../../components/call/IncomingCallModal';
import type { MainStackParamList } from '../../navigation/types';
import { apiNotifyCallDeclined } from '../../api/calls';

type Props = NativeStackScreenProps<MainStackParamList, 'IncomingCall'>;

export default function IncomingCallScreen({ navigation, route }: Props) {
  const { roomUrl, callerName, callMode, callerUserId } = route.params;

  const onReject = useCallback(() => {
    if (callerUserId) {
      void apiNotifyCallDeclined(callerUserId, callMode);
    }
    navigation.goBack();
  }, [callMode, callerUserId, navigation]);

  const onAccept = useCallback(() => {
    navigation.replace('Call', {
      roomUrl,
      callMode,
      displayName: callerName,
      isCaller: false,
    });
  }, [callMode, callerName, navigation, roomUrl]);

  return (
    <IncomingCallModal
      visible
      callerName={callerName}
      callMode={callMode}
      onAccept={onAccept}
      onReject={onReject}
    />
  );
}

import { useCallback, useState } from 'react';

import { apiRewriteReply, type RewriteType } from '../services/aiService';

export function useAI() {
  const [loading, setLoading] = useState(false);

  const rewrite = useCallback(async (text: string, type: RewriteType) => {
    setLoading(true);
    try {
      return await apiRewriteReply(text, type);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, rewrite };
}

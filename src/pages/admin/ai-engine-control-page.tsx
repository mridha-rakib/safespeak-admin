import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import {
  AdminOperationsSectionPage,
  type AdminOperationsSectionConfig,
} from "@/components/admin/admin-operations-section-page";
import { getAiEngineOverview } from "@/lib/ai-engine-control";
import { useEffect, useState } from "react";

export function AdminAiEngineControlPage() {
  const [config, setConfig] = useState<AdminOperationsSectionConfig>(
    ADMIN_OPERATIONS_CONFIGS.aiEngineControl,
  );

  const refreshConfig = async () => {
    const aiEngine = await getAiEngineOverview();
    setConfig(aiEngine);
  };

  useEffect(() => {
    let isMounted = true;

    void getAiEngineOverview()
      .then((aiEngine) => {
        if (isMounted) {
          setConfig(aiEngine);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConfig(ADMIN_OPERATIONS_CONFIGS.aiEngineControl);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminOperationsSectionPage
      config={config}
      onRefreshConfig={refreshConfig}
    />
  );
}

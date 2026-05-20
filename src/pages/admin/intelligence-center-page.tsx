import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import {
  AdminOperationsSectionPage,
  type AdminOperationsSectionConfig,
} from "@/components/admin/admin-operations-section-page";
import { getIntelligenceCenterOverview } from "@/lib/intelligence-center";
import { useEffect, useState } from "react";

export function AdminIntelligenceCenterPage() {
  const [config, setConfig] = useState<AdminOperationsSectionConfig>(
    ADMIN_OPERATIONS_CONFIGS.intelligenceCenter,
  );

  const refreshConfig = async () => {
    const intelligenceCenter = await getIntelligenceCenterOverview();
    setConfig(intelligenceCenter);
  };

  useEffect(() => {
    let isMounted = true;

    void getIntelligenceCenterOverview()
      .then((intelligenceCenter) => {
        if (isMounted) {
          setConfig(intelligenceCenter);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConfig(ADMIN_OPERATIONS_CONFIGS.intelligenceCenter);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminOperationsSectionPage
      config={config}
      sectionKey="analytics"
      onRefreshConfig={refreshConfig}
    />
  );
}

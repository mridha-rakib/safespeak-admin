import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import {
  AdminOperationsSectionPage,
  type AdminOperationsSectionConfig,
} from "@/components/admin/admin-operations-section-page";
import { getDataProtectionOverview } from "@/lib/data-protection";
import { useEffect, useState } from "react";

export function AdminDataProtectionPage() {
  const [config, setConfig] = useState<AdminOperationsSectionConfig>(
    ADMIN_OPERATIONS_CONFIGS.dataProtection,
  );

  const refreshConfig = async () => {
    const dataProtection = await getDataProtectionOverview();
    setConfig(dataProtection);
  };

  useEffect(() => {
    let isMounted = true;

    void getDataProtectionOverview()
      .then((dataProtection) => {
        if (isMounted) {
          setConfig(dataProtection);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConfig(ADMIN_OPERATIONS_CONFIGS.dataProtection);
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
